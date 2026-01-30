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
    app = create_app()
    app.config.update(
        TESTING=True,
        SQLALCHEMY_DATABASE_URI="sqlite:///:memory:",
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
    )

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()
