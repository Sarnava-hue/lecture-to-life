"""Export the FastAPI OpenAPI schema to docs/openapi.json without requiring a live database."""

import json
import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT_DIR / "backend"
DOCS_DIR = ROOT_DIR / "docs"

os.environ.setdefault("DATABASE_URL", "sqlite:///./openapi_export.db")
os.environ.setdefault(
    "SECRET_KEY", "openapi-export-placeholder-key-at-least-32-chars"
)
os.environ.setdefault("ENVIRONMENT", "development")

sys.path.insert(0, str(BACKEND_DIR))

from app.main import app  # noqa: E402


def main() -> None:
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    output_path = DOCS_DIR / "openapi.json"
    schema = app.openapi()
    output_path.write_text(json.dumps(schema, indent=2) + "\n", encoding="utf-8")
    print(f"Exported OpenAPI schema ({len(schema.get('paths', {}))} paths) to {output_path}")


if __name__ == "__main__":
    main()
