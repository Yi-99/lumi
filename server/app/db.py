"""Local SQLite key store.

Lets the server run fully standalone: keys saved once via /v1/keys live in a
single SQLite file inside the docker volume (default /data/lumi.db) on the
machine that runs the server — no cloud component anywhere.

Storage is plaintext-on-own-disk, the same trust model as ~/.aws/credentials:
the file is chmod 0600 and never leaves the volume. Encrypting it with a key
kept next to it would add ceremony, not security. Request headers always
override stored keys, and lookups never write to this store.
"""

import os
import sqlite3

DB_PATH = os.environ.get("LUMI_DB", "/data/lumi.db")

PROVIDER_IDS = ("claude", "gpt", "gemini")


def _conn() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    created = not os.path.exists(DB_PATH)
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS api_keys ("
        "  provider TEXT PRIMARY KEY,"
        "  key TEXT NOT NULL,"
        "  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP"
        ")"
    )
    if created:
        os.chmod(DB_PATH, 0o600)
    return conn


def set_key(provider: str, key: str) -> None:
    with _conn() as conn:
        conn.execute(
            "INSERT INTO api_keys (provider, key) VALUES (?, ?) "
            "ON CONFLICT(provider) DO UPDATE SET key = excluded.key, "
            "updated_at = CURRENT_TIMESTAMP",
            (provider, key),
        )


def delete_key(provider: str) -> bool:
    with _conn() as conn:
        cur = conn.execute("DELETE FROM api_keys WHERE provider = ?", (provider,))
        return cur.rowcount > 0


def get_keys() -> dict[str, str]:
    with _conn() as conn:
        rows = conn.execute("SELECT provider, key FROM api_keys").fetchall()
    return dict(rows)


def status() -> dict[str, bool]:
    """Which providers have a stored key — never exposes key material."""
    stored = get_keys()
    return {p: p in stored for p in PROVIDER_IDS}
