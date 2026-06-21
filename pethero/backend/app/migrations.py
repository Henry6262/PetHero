"""YAML migration runner for SQLite.

Keeps the database schema versioned with simple YAML files under
backend/migrations/. Each file contains a version, description, and the SQL
that brings the database up to that version.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from . import config
from .db import Database

try:
    import yaml

    _HAS_YAML = True
except Exception:  # pragma: no cover
    _HAS_YAML = False


def _migration_files(migrations_dir: Path) -> list[Path]:
    if not migrations_dir.exists():
        return []
    files = [p for p in migrations_dir.iterdir() if p.suffix in {".yaml", ".yml"}]
    return sorted(files)


def _load_yaml(path: Path) -> dict[str, Any]:
    if not _HAS_YAML:
        raise RuntimeError("PyYAML is required to run migrations. Install with: pip install pyyaml")
    import yaml

    return yaml.safe_load(path.read_text())


def run_migrations(db: Database | None = None, migrations_dir: Path | None = None) -> None:
    db = db or Database(config.DATA_DIR / "pethero.db")
    migrations_dir = migrations_dir or config.BASE_DIR / "migrations"

    applied = db.applied_migrations()
    for path in _migration_files(migrations_dir):
        spec = _load_yaml(path)
        version = str(spec["version"])
        if version in applied:
            continue
        db.apply_migration(version, spec.get("up", ""))
        applied.add(version)
