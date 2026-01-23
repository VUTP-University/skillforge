from flask_jwt_extended import create_access_token


def generate_token(identify):
    return create_access_token(identify=identify)
