"""Request models for the lookup proxy."""

from typing import Literal

from pydantic import BaseModel, Field

ProviderId = Literal["claude", "gpt", "gemini"]


class ProviderSpec(BaseModel):
    id: ProviderId
    label: str = ""  # echoed back in the "providers" SSE event
    model: str = Field(min_length=1, max_length=100)


class LookupRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=8000)
    providers: list[ProviderSpec] = Field(min_length=1, max_length=3)
    max_tokens: int = Field(default=300, ge=1, le=1024)


class KeysIn(BaseModel):
    """PUT /v1/keys body — any subset of providers."""

    claude: str | None = Field(default=None, min_length=8, max_length=400)
    gpt: str | None = Field(default=None, min_length=8, max_length=400)
    gemini: str | None = Field(default=None, min_length=8, max_length=400)


class PromptIn(BaseModel):
    """POST /v1/prompts body — one history entry."""

    kind: Literal["lookup", "followup"] = "lookup"
    selection: str = Field(min_length=1, max_length=400)
    question: str | None = Field(default=None, min_length=1, max_length=500)
