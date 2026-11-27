import asyncio
import asyncio.tasks as _asyncio_tasks
import os
import sys
from collections.abc import Generator
from pathlib import Path

# Work around a Python 3.14.x Windows C-extension access violation in _asyncio.all_tasks
# during asyncio.Runner teardown when Starlette TestClient shuts down its portal.
if sys.platform == "win32" and sys.version_info[:2] == (3, 14):
    for _name in (
        "all_tasks",
        "current_task",
        "_register_task",
        "_register_eager_task",
        "_unregister_task",
        "_unregister_eager_task",
        "_enter_task",
        "_leave_task",
        "_swap_current_task",
    ):
        _py_impl = getattr(_asyncio_tasks, f"_py_{_name.lstrip('_')}", None)
        if _py_impl is None and _name.startswith("_"):
            _py_impl = getattr(_asyncio_tasks, f"_py{_name}", None)
        if _py_impl is not None:
            setattr(_asyncio_tasks, _name, _py_impl)
    asyncio.all_tasks = _asyncio_tasks.all_tasks
    asyncio.current_task = _asyncio_tasks.current_task

os.environ["DATABASE_URL"] = "sqlite:///./test_bootstrap.db"
os.environ["SECRET_KEY"] = "test-secret-key-at-least-32-chars-long-123456"
os.environ["ENVIRONMENT"] = "test"
os.environ["GEMINI_API_KEY"] = ""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.rate_limit import rate_limiter
from app.db import Base
from app.db.dependencies import get_db
from app.main import app


@pytest.fixture()
def db_session_factory(tmp_path: Path) -> Generator[sessionmaker, None, None]:
    db_file = tmp_path / "test_app.db"
    engine = create_engine(
        f"sqlite:///{db_file}",
        connect_args={"check_same_thread": False},
    )
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
    )
    Base.metadata.create_all(bind=engine)
    try:
        yield TestingSessionLocal
    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def upload_dir(tmp_path: Path) -> Path:
    path = tmp_path / "uploads"
    path.mkdir(parents=True, exist_ok=True)
    return path


@pytest.fixture()
def client(
    db_session_factory: sessionmaker,
    upload_dir: Path,
) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        db = db_session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    app.state.session_factory = db_session_factory
    app.state.upload_dir = upload_dir
    rate_limiter.reset()

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    rate_limiter.reset()
    for attr in (
        "session_factory",
        "upload_dir",
        "gemini_client",
        "rate_limit_enabled",
        "auth_rate_limit_requests",
        "auth_rate_limit_window_seconds",
    ):
        if hasattr(app.state, attr):
            delattr(app.state, attr)


@pytest.fixture()
def auth_headers(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Sarnava Member1",
            "email": "member1@example.com",
            "password": "StrongPassword123",
        },
    )
    assert response.status_code == 201
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def second_user_headers(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Anushka Member2",
            "email": "member2@example.com",
            "password": "StrongPassword123",
        },
    )
    assert response.status_code == 201
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
