# ⚒ SkillForge

Full-stack starter: **Flask REST API** · **React (Vite)** · **PostgreSQL** — all dockerized.

## Stack

| Layer    | Tech                    |
|----------|-------------------------|
| Backend  | Python 3.12 · Flask 3   |
| Frontend | React 18 · Vite 5       |
| Database | PostgreSQL 16 (Docker)  |
| ORM      | SQLAlchemy + Flask-Migrate |

## Quick Start

```bash
# 1. Clone / enter the project
cd skillforge

# 2. Copy env file (edit secrets before production!)
cp backend/.env.example backend/.env

# 3. Start everything
docker compose up --build

# 4. Run first migration (first time only)
docker compose exec backend flask db init
docker compose exec backend flask db migrate -m "initial"
docker compose exec backend flask db upgrade
```

| Service  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:5173       |
| API      | http://localhost:5000/api   |
| DB       | localhost:5432              |

## API Endpoints

```
GET    /api/health
GET    /api/users/
POST   /api/users/       { "username": "...", "email": "..." }
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
```

## Project Structure

```
skillforge/
├── backend/
│   ├── app/
│   │   ├── __init__.py       # App factory
│   │   ├── config.py
│   │   ├── models.py
│   │   └── routes/
│   │       ├── health.py
│   │       └── users.py
│   ├── run.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js
│   └── Dockerfile
└── docker-compose.yml
```

## Development

```bash
# View logs
docker compose logs -f backend

# Shell into backend
docker compose exec backend bash

# New migration after model changes
docker compose exec backend flask db migrate -m "describe change"
docker compose exec backend flask db upgrade
```
