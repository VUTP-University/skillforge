import pytest
from backend.extensions import db
from backend.models.user import User
from backend.models.user_role import UserRole


@pytest.fixture
def user(app):
    """Fixture to create a test user"""
    with app.app_context():
        user = User(
            email="test@example.com", password="Test123!@#", username="testuser"
        )
        user.set_password("Test123!@#")
        db.session.add(user)
        db.session.commit()
        yield user


def test_user_role_creation(app, user):
    """Test creating a UserRole for a user"""
    with app.app_context():
        # Create a role for the user with a specific role value
        role = UserRole(id=user.id, role="Admin")
        db.session.add(role)
        db.session.commit()

        # Verify the role was created
        retrieved_role = UserRole.query.filter_by(id=user.id).first()
        assert retrieved_role is not None
        assert retrieved_role.role == "Admin"
        assert retrieved_role.id == user.id


def test_user_role_relationship(app, user):
    """Test the 1:1 relationship between User and UserRole"""
    with app.app_context():
        # Create a role for the user
        role = UserRole(id=user.id, role="Admin")
        db.session.add(role)
        db.session.commit()

        # Test accessing role from user
        retrieved_user = User.query.filter_by(id=user.id).first()
        assert retrieved_user.role is not None
        assert retrieved_user.role.role == "Admin"

        # Test accessing user from role
        retrieved_role = UserRole.query.filter_by(id=user.id).first()
        assert retrieved_role.user is not None
        assert retrieved_role.user.username == "testuser"


def test_user_role_cascade_delete(app):
    """Test that UserRole is deleted when User is deleted (cascade)"""
    with app.app_context():
        # Create a user
        user = User(
            email="test@example.com", password="Test123!@#", username="testuser"
        )
        user.set_password("Test123!@#")
        db.session.add(user)
        db.session.commit()

        # Create a role for the user
        role = UserRole(id=user.id, role="Moderator")
        db.session.add(role)
        db.session.commit()

        user_id = user.id

        # Delete the user
        db.session.delete(user)
        db.session.commit()

        # Verify the role was also deleted
        retrieved_role = UserRole.query.filter_by(id=user_id).first()
        assert retrieved_role is None


def test_user_role_default_value(app, user):
    """Test that UserRole has a default value of 'User'"""
    with app.app_context():
        # Create a role without specifying the role field
        role = UserRole(id=user.id)
        db.session.add(role)
        db.session.commit()

        # Verify the default role is "User"
        retrieved_role = UserRole.query.filter_by(id=user.id).first()
        assert retrieved_role.role == "User"


def test_user_role_primary_key_type(app, user):
    """Test that UserRole uses String(36) for primary key to match User.id"""
    with app.app_context():
        # Verify user.id is a string UUID
        assert isinstance(user.id, str)
        assert len(user.id) == 36  # UUID format

        # Create a role using the same id
        role = UserRole(id=user.id, role="Admin")
        db.session.add(role)
        db.session.commit()

        # Verify role.id matches and is also a string
        retrieved_role = UserRole.query.filter_by(id=user.id).first()
        assert retrieved_role.id == user.id
        assert isinstance(retrieved_role.id, str)
