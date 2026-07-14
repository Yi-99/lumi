"""lumi lookup proxy — FastAPI app.

POST /v1/lookup fans out one prompt to up to three LLM providers with
asyncio and streams the merged result back as SSE. Each `data:` payload is
byte-for-byte the extension's internal Port message shape
({type: providers|chunk|done|error, ...}), terminated by `data: [DONE]`,
so the extension forwards events to its UI without translation.

User API keys arrive per-request in X-*-Key headers, are forwarded to the
matching provider over TLS, and are never stored or logged (headers are
excluded from uvicorn access logs; error strings carry status codes only).
"""

import asyncio
import json
import time
from contextlib import asynccontextmanager

import httpx
from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from . import db
from .providers import ADAPTERS
from .schemas import KeysIn, LookupRequest, ProviderSpec

KEY_HEADERS = {
    "claude": "x-anthropic-key",
    "gpt": "x-openai-key",
    "gemini": "x-gemini-key",
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Shared client; default 5s read timeout would kill healthy slow SSE streams.
    app.state.client = httpx.AsyncClient(
        timeout=httpx.Timeout(connect=10, read=60, write=10, pool=10)
    )
    yield
    await app.state.client.aclose()


limiter = Limiter(key_func=get_remote_address, headers_enabled=True)
app = FastAPI(title="lumi lookup proxy", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    # MV3 service-worker fetches with host_permissions bypass CORS entirely;
    # this covers curl/browser testing and dropped-pattern fallback.
    allow_origin_regex=r"^(chrome-extension://[a-p]{32}|https?://(localhost|127\.0\.0\.1)(:\d+)?)$",
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["content-type", *KEY_HEADERS.values()],
    max_age=600,
)


async def auth_placeholder() -> None:
    """No-op auth slot — replace with real authentication before any
    non-localhost deployment."""


def sse(obj: dict) -> str:
    return f"data: {json.dumps(obj, separators=(',', ':'))}\n\n"


async def fanout(client: httpx.AsyncClient, body: LookupRequest, keys: dict[str, str]):
    q: asyncio.Queue = asyncio.Queue()

    async def run(spec: ProviderSpec) -> None:
        t0 = time.monotonic()
        try:
            adapter = ADAPTERS[spec.id]
            async for ev in adapter(client, body.prompt, keys[spec.id], spec.model, body.max_tokens):
                if "text" in ev:
                    await q.put({"type": "chunk", "provider": spec.id, "text": ev["text"]})
                elif "usage" in ev:
                    # Token accounting — the extension records this event and
                    # doesn't forward it to the card UI.
                    await q.put({"type": "usage", "provider": spec.id, **ev["usage"]})
            await q.put(
                {"type": "done", "provider": spec.id, "ms": int((time.monotonic() - t0) * 1000)}
            )
        except asyncio.CancelledError:
            raise
        except Exception as e:  # one provider failing never kills the stream
            await q.put({"type": "error", "provider": spec.id, "message": str(e)[:200]})

    tasks = [asyncio.create_task(run(s)) for s in body.providers]
    try:
        yield sse(
            {
                "type": "providers",
                "providers": [{"id": s.id, "label": s.label} for s in body.providers],
            }
        )
        pending = len(tasks)
        while pending:
            msg = await q.get()
            if msg["type"] in ("done", "error"):
                pending -= 1
            yield sse(msg)
        yield "data: [DONE]\n\n"
    finally:
        for t in tasks:  # client disconnect → stop burning the user's tokens
            t.cancel()


@app.get("/healthz")
async def healthz() -> dict:
    return {"ok": True}


# ---------- Key store (local SQLite, see db.py) ----------


@app.put("/v1/keys", dependencies=[Depends(auth_placeholder)])
@limiter.limit("30/minute")
async def put_keys(request: Request, response: Response, body: KeysIn) -> dict:
    """Store keys once so clients don't have to send them per request."""
    for provider, key in body.model_dump(exclude_none=True).items():
        db.set_key(provider, key.strip())
    return db.status()


@app.get("/v1/keys", dependencies=[Depends(auth_placeholder)])
@limiter.limit("30/minute")
async def keys_status(request: Request, response: Response) -> dict:
    """Which providers have stored keys — key material is never returned."""
    return db.status()


@app.delete("/v1/keys/{provider}", dependencies=[Depends(auth_placeholder)])
@limiter.limit("30/minute")
async def delete_key(request: Request, response: Response, provider: str) -> dict:
    if provider not in db.PROVIDER_IDS:
        raise HTTPException(status_code=404, detail="unknown provider")
    db.delete_key(provider)
    return db.status()


@app.post("/v1/lookup", dependencies=[Depends(auth_placeholder)])
@limiter.limit("30/minute")
async def lookup(request: Request, body: LookupRequest) -> StreamingResponse:
    # Per-request headers override the local SQLite store; lookups never
    # write to the store.
    stored = db.get_keys()
    keys = {
        spec.id: (
            request.headers.get(KEY_HEADERS[spec.id], "").strip()
            or stored.get(spec.id, "").strip()
        )
        for spec in body.providers
    }
    runnable = [s for s in body.providers if keys[s.id]]
    if not runnable:
        raise HTTPException(
            status_code=400,
            detail="no provider keys — send X-*-Key headers or store keys via PUT /v1/keys",
        )
    body = body.model_copy(update={"providers": runnable})

    return StreamingResponse(
        fanout(request.app.state.client, body, keys),
        media_type="text/event-stream",
        headers={"cache-control": "no-cache", "x-accel-buffering": "no"},
    )
