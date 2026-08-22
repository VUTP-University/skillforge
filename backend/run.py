from app import create_app
from app.config import get_config

app = create_app(get_config())

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=app.config["DEBUG"])
