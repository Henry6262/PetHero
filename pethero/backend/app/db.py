"""SQLite persistence layer for PetHero.

Keeps a local file database so schedules, pet profiles, and the activity log
survive backend restarts. Complex objects are stored as JSON blobs so the
schema stays small and stable.
"""

from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Any, Optional


class Database:
    def __init__(self, path: Path) -> None:
        self._path = path
        path.parent.mkdir(parents=True, exist_ok=True)
        self._ensure_tables()

    @contextmanager
    def _connect(self):
        conn = sqlite3.connect(self._path)
        try:
            yield conn
        finally:
            conn.close()

    def _ensure_tables(self) -> None:
        with self._connect() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS migrations (
                    version TEXT PRIMARY KEY,
                    applied_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS pets (
                    id TEXT PRIMARY KEY,
                    data TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    data TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS state (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );
                """
            )
            conn.commit()

    # --- migrations --------------------------------------------------------

    def applied_migrations(self) -> set[str]:
        with self._connect() as conn:
            rows = conn.execute("SELECT version FROM migrations").fetchall()
            return {r[0] for r in rows}

    def apply_migration(self, version: str, sql: str) -> None:
        with self._connect() as conn:
            conn.executescript(sql)
            conn.execute(
                "INSERT OR REPLACE INTO migrations (version, applied_at) VALUES (?, ?)",
                (version, datetime.now().isoformat()),
            )
            conn.commit()

    # --- pets --------------------------------------------------------------

    def load_pets(self) -> dict[str, dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute("SELECT id, data FROM pets").fetchall()
            return {r[0]: json.loads(r[1]) for r in rows}

    def save_pet(self, pet_id: str, data: dict[str, Any]) -> None:
        with self._connect() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO pets (id, data) VALUES (?, ?)",
                (pet_id, json.dumps(data)),
            )
            conn.commit()

    # --- events ------------------------------------------------------------

    def load_events(self) -> list[dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT data FROM events ORDER BY id ASC"
            ).fetchall()
            return [json.loads(r[0]) for r in rows]

    def append_event(self, event: dict[str, Any]) -> None:
        with self._connect() as conn:
            conn.execute(
                "INSERT INTO events (data, created_at) VALUES (?, ?)",
                (json.dumps(event), datetime.now().isoformat()),
            )
            conn.commit()

    def clear_events(self) -> None:
        with self._connect() as conn:
            conn.execute("DELETE FROM events")
            conn.commit()

    # --- key/value state ---------------------------------------------------

    def get_state(self, key: str) -> Optional[str]:
        with self._connect() as conn:
            row = conn.execute("SELECT value FROM state WHERE key = ?", (key,)).fetchone()
            return row[0] if row else None

    def set_state(self, key: str, value: str) -> None:
        with self._connect() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO state (key, value) VALUES (?, ?)",
                (key, value),
            )
            conn.commit()

    def delete_state(self, key: str) -> None:
        with self._connect() as conn:
            conn.execute("DELETE FROM state WHERE key = ?", (key,))
            conn.commit()
