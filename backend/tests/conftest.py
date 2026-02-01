import json

import pytest

from backend.app import create_app
from backend.extensions import db


@pytest.fixture(scope="session")
def test_data():
    with open("tests/data/users.json") as f:
        return json.load(f)


@pytest.fixture
def app():
    app = create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
            "SQLALCHEMY_TRACK_MODIFICATIONS": False,
            "SECRET_KEY": "secret",
            "JWT_SECRET_KEY": "secret",
            "JWT_ACCESS_TOKEN_EXPIRES": 3600,
            "JWT_REFRESH_TOKEN_EXPIRES": 86400,
            "JWT_TOKEN_LOCATION": ["cookies"],
        }
    )

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()
