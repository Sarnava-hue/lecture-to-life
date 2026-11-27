from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import sessionmaker

from app.db.dependencies import get_db
from app.main import app
from app.models.user import User


def test_root_and_health(client: TestClient) -> None:
    root_res = client.get("/")
    assert root_res.status_code == 200
    assert root_res.json()["status"] == "running"

    health_res = client.get("/health")
    assert health_res.status_code == 200
    assert health_res.json() == {"status": "healthy"}


def test_health_returns_503_when_db_fails(client: TestClient) -> None:
    class BrokenDB:
        def execute(self, *_args, **_kwargs):
            raise RuntimeError("DB down")

    def broken_db():
        yield BrokenDB()

    previous = app.dependency_overrides.get(get_db)
    app.dependency_overrides[get_db] = broken_db
    try:
        res = client.get("/health")
        assert res.status_code == 503
        assert res.json() == {"status": "unhealthy"}
    finally:
        if previous is not None:
            app.dependency_overrides[get_db] = previous


def test_cors_allows_frontend_origin(client: TestClient) -> None:
    res = client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_register_returns_token_and_user_profile(client: TestClient) -> None:
    res = client.post(
        "/api/v1/auth/register",
        json={
            "name": "  Ada Lovelace  ",
            "email": "ADA@Example.com",
            "password": "ValidPassword123",
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert data["token_type"] == "bearer"
    assert isinstance(data["access_token"], str) and data["access_token"]
    assert isinstance(data["user"]["id"], str)
    assert data["user"]["name"] == "Ada Lovelace"
    assert data["user"]["email"] == "ada@example.com"

    dup = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Ada Two",
            "email": "ada@example.com",
            "password": "ValidPassword123",
        },
    )
    assert dup.status_code == 409


def test_login_json_and_oauth_form(client: TestClient) -> None:
    reg = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Grace Hopper",
            "email": "grace@example.com",
            "password": "ValidPassword123",
        },
    )
    assert reg.status_code == 201

    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "GRACE@example.com", "password": "ValidPassword123"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    assert login_res.json()["user"]["email"] == "grace@example.com"

    token_res = client.post(
        "/api/v1/auth/token",
        data={"username": "grace@example.com", "password": "ValidPassword123"},
    )
    assert token_res.status_code == 200
    assert token_res.json()["access_token"]

    profile_res = client.get(
        "/api/v1/auth/profile",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert profile_res.status_code == 200
    assert profile_res.json()["name"] == "Grace Hopper"


def test_inactive_user_cannot_login_or_access_profile(
    client: TestClient,
    db_session_factory: sessionmaker,
) -> None:
    reg = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Inactive User",
            "email": "inactive@example.com",
            "password": "ValidPassword123",
        },
    )
    assert reg.status_code == 201
    token = reg.json()["access_token"]

    with db_session_factory() as db:
        user = db.scalar(select(User).where(User.email == "inactive@example.com"))
        assert user is not None
        user.is_active = False
        db.commit()

    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "inactive@example.com", "password": "ValidPassword123"},
    )
    assert login_res.status_code == 403

    profile_res = client.get(
        "/api/v1/auth/profile",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert profile_res.status_code == 401


def test_auth_rate_limiter_blocks_excess_requests(client: TestClient) -> None:
    app.state.auth_rate_limit_requests = 2
    app.state.auth_rate_limit_window_seconds = 60

    for _ in range(2):
        res = client.post(
            "/api/v1/auth/login",
            json={"email": "nobody@example.com", "password": "WrongPassword123"},
        )
        assert res.status_code == 401

    blocked = client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": "WrongPassword123"},
    )
    assert blocked.status_code == 429
    assert "Too many requests" in blocked.json()["detail"]
