from app import create_app
from app.config import Config


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"


def test_create_app_returns_configured_flask_app():
    app = create_app(TestConfig)
    assert app is not None
    assert app.config["TESTING"] is True


def test_health_endpoint_returns_ok():
    app = create_app(TestConfig)
    client = app.test_client()

    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.get_json() == {"status": "ok", "service": "skillforge-api"}
