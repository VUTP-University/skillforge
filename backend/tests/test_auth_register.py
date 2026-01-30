def test_register_success(client, test_data):
    res = client.post(
        "/register",
        json=test_data["valid_user"]
    )

    assert res.status_code == 201
    data = res.get_json()
    assert "User registered successfully" in data["msg"]


def test_register_weak_password(client, test_data):
    res = client.post(
        "/register",
        json=test_data["weak_password"]
    )

    assert res.status_code == 400
    data = res.get_json()
    assert "password" in data["error"].lower()


def test_register_missing_fields(client, test_data):
    res = client.post(
        "/register",
        json=test_data["missing_fields"]
    )

    assert res.status_code == 400


def test_register_duplicate_username(client, test_data):
    client.post("/register", json=test_data["valid_user"])

    res = client.post("/register", json={
        **test_data["valid_user"],
        "email": "another@example.com"
    })

    assert res.status_code == 409