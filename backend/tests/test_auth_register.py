from backend.models.user import User
from backend.models.user_role import UserRole


def test_register_success(client, test_data):
    """
    Test successful registration of a new user.
    """
    res = client.post("/register", json=test_data["valid_user"])

    assert res.status_code == 201
    data = res.get_json()
    assert "User registered successfully" in data["msg"]


def test_register_weak_password(client, test_data):
    """
    Test registration with a weak password.
    """
    res = client.post("/register", json=test_data["weak_password"])

    assert res.status_code == 400
    data = res.get_json()
    assert "password" in data["error"].lower()


def test_register_missing_fields(client, test_data):
    """
    Test registration with missing fields.
    """
    res = client.post("/register", json=test_data["missing_fields"])

    assert res.status_code == 400


def test_register_duplicate_username(client, test_data):
    """
    Test registration with existing username
    """
    client.post("/register", json=test_data["valid_user"])

    res = client.post(
        "/register", json={**test_data["valid_user"], "email": "another@example.com"}
    )

    assert res.status_code == 409


def test_register_user_role(client, app, test_data):
    """
    Test registration and User role assignment.
    """
    res = client.post("/register", json=test_data["valid_user"])
    assert res.status_code == 201

    with app.app_context():
        user = User.query.filter_by(
            username=test_data["valid_user"]["username"]
        ).first()
        assert user is not None

        # Query the UserRole table using the User ID
        user_role = UserRole.query.filter_by(user_id=user.id).first()
        assert user_role is not None
        assert user_role.role == "User"
