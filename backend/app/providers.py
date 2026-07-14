"""Streaming provider adapters.

Each adapter is an async generator yielding events:
  {"text": str}                          — a content delta
  {"usage": {"input": int, "output": int}} — final token counts (at most once)

Keys are passed in headers only (never URLs) so they cannot leak into
exception strings or access logs. Non-200 responses raise with the status
code only — provider response bodies can echo request details and are never
included.
"""

import json
from typing import AsyncIterator

import httpx

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
OPENAI_URL = "https://api.openai.com/v1/chat/completions"
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models"


async def _sse_data_lines(resp: httpx.Response) -> AsyncIterator[dict]:
    """Parse `data: {...}` lines from a streaming SSE response.

    Mirrors the extension's readSSE(): ignores non-data lines, stops on
    [DONE], skips unparsable payloads (keepalives / partials).
    """
    async for line in resp.aiter_lines():
        s = line.strip()
        if not s.startswith("data:"):
            continue
        payload = s[5:].strip()
        if payload == "[DONE]":
            return
        try:
            yield json.loads(payload)
        except json.JSONDecodeError:
            continue


async def stream_anthropic(
    client: httpx.AsyncClient, prompt: str, key: str, model: str, max_tokens: int
) -> AsyncIterator[str]:
    async with client.stream(
        "POST",
        ANTHROPIC_URL,
        headers={
            "content-type": "application/json",
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
        },
        json={
            "model": model,
            "max_tokens": max_tokens,
            "stream": True,
            "messages": [{"role": "user", "content": prompt}],
        },
    ) as resp:
        if resp.status_code != 200:
            raise Exception(f"Anthropic {resp.status_code}")
        # input tokens arrive on message_start, cumulative output on message_delta
        usage = {"input": 0, "output": 0}
        async for data in _sse_data_lines(resp):
            if data.get("type") == "content_block_delta":
                text = (data.get("delta") or {}).get("text")
                if text:
                    yield {"text": text}
            elif data.get("type") == "message_start":
                usage["input"] = ((data.get("message") or {}).get("usage") or {}).get(
                    "input_tokens", 0
                )
            elif data.get("type") == "message_delta":
                usage["output"] = (data.get("usage") or {}).get(
                    "output_tokens", usage["output"]
                )
        yield {"usage": usage}


async def stream_openai(
    client: httpx.AsyncClient, prompt: str, key: str, model: str, max_tokens: int
) -> AsyncIterator[str]:
    async with client.stream(
        "POST",
        OPENAI_URL,
        headers={
            "content-type": "application/json",
            "authorization": f"Bearer {key}",
        },
        json={
            "model": model,
            "stream": True,
            "max_tokens": max_tokens,
            "stream_options": {"include_usage": True},  # final chunk carries usage
            "messages": [{"role": "user", "content": prompt}],
        },
    ) as resp:
        if resp.status_code != 200:
            raise Exception(f"OpenAI {resp.status_code}")
        usage = {"input": 0, "output": 0}
        async for data in _sse_data_lines(resp):
            choices = data.get("choices") or []
            text = (choices[0].get("delta") or {}).get("content") if choices else None
            if text:
                yield {"text": text}
            if data.get("usage"):
                usage["input"] = data["usage"].get("prompt_tokens", 0)
                usage["output"] = data["usage"].get("completion_tokens", 0)
        yield {"usage": usage}


async def stream_gemini(
    client: httpx.AsyncClient, prompt: str, key: str, model: str, max_tokens: int
) -> AsyncIterator[str]:
    async with client.stream(
        "POST",
        f"{GEMINI_URL}/{model}:streamGenerateContent?alt=sse",
        headers={
            "content-type": "application/json",
            "x-goog-api-key": key,  # header, not ?key= — keeps key out of URLs/logs
        },
        json={
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"maxOutputTokens": max_tokens},
        },
    ) as resp:
        if resp.status_code != 200:
            raise Exception(f"Gemini {resp.status_code}")
        # every chunk carries usageMetadata; the last one has final counts
        usage = {"input": 0, "output": 0}
        async for data in _sse_data_lines(resp):
            candidates = data.get("candidates") or []
            parts = ((candidates[0].get("content") or {}).get("parts") or []) if candidates else []
            text = parts[0].get("text") if parts else None
            if text:
                yield {"text": text}
            meta = data.get("usageMetadata")
            if meta:
                usage["input"] = meta.get("promptTokenCount", 0)
                usage["output"] = meta.get("candidatesTokenCount", 0)
        yield {"usage": usage}


ADAPTERS = {
    "claude": stream_anthropic,
    "gpt": stream_openai,
    "gemini": stream_gemini,
}
