from werkzeug.security import generate_password_hash

from backend.extensions import db
from backend.models.user import User


def test_login_success(client, app):
    # Create a test user in the database
    with app.app_context():
        user = User(
            username="testuser",
            email="testuser@example.com",
            password=generate_password_hash(
                "StrongPassword123!", method="pbkdf2:sha256"
            ),
        )

        db.session.add(user)
        db.session.commit()

    # Attempt to log in
    res = client.post(
        "/login", json={"identifier": "testuser", "password": "StrongPassword123!"}
    )
    assert res.status_code == 200
    data = res.get_json()
    assert "access_token" in data
    assert data["user"]["username"] == "testuser"
    assert data["user"]["email"] == "testuser@example.com"


def test_login_invalid_credentials(client, app):
    # Create a test user with the correct username but add the wrong password
    with app.app_context():
        user = User(
            username="testuser",
            email="testuser@example.com",
            password=generate_password_hash(
                "StrongPassword123!", method="pbkdf2:sha256"
            ),
        )
        from backend.extensions import db

        db.session.add(user)
        db.session.commit()

    # Attempt to log in with the wrong password
    res = client.post(
        "/login", json={"identifier": "testuser", "password": "WrongPassword456"}
    )
    assert res.status_code == 401
    data = res.get_json()
    assert "Invalid credentials" in data["error"]


def test_login_nonexistent_user(client):
    # Attempt to log in with a username that does not exist
    res = client.post(
        "/login", json={"identifier": "nonexistentuser", "password": "password123"}
    )
    assert res.status_code == 401
    data = res.get_json()
    assert "Invalid credentials" in data["error"]


def test_login_missing_fields(client):
    # Attempt to log in with missing fields (only a password provided)
    res = client.post("/login", json={"password": "password123"})
    assert res.status_code == 400
    data = res.get_json()
    assert "Missing required fields" in data["msg"]

    # Attempt to log in with only the identifier provided
    res2 = client.post("/login", json={"identifier": "testuser"})
    assert res2.status_code == 400
    data2 = res2.get_json()
    assert "Missing required fields" in data2["msg"]


def test_login_empty_payload(client):
    # Attempt to log in with no body at all
    res = client.post("/login", json={})
    assert res.status_code == 400
    data = res.get_json()
    assert "Missing required fields" in data["msg"]

    # Attempt to log in with no JSON body
    res2 = client.post("/login")  # No JSON content at all
    assert res2.status_code == 415  # Unsupported Media Type
    data2 = res2.get_json()
    assert "Unsupported request format" in data2["msg"]
