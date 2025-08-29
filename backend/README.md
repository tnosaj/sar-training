# Dog Training Tracker — Hexagonal/DDD Backend

This is a hexagonal + DDD split of the Go backend with SQLite (github.com/mattn/go-sqlite3).

## Run
```bash
export PORT=8080
export DB_PATH=./dogtracker.db
go mod tidy
go run ./cmd/server
```

## Endpoints
- `GET /health`
- Skills: `GET/POST /skills`, `PUT/DELETE /skills/{id}`
- Behaviors: `GET/POST /behaviors` (optional `?skill_id=...`)
- Exercises: `GET/POST /exercises`, Link: `POST /behavior-exercises`
- Dogs: `GET/POST /dogs`
- Sessions:
  - `GET/POST /sessions`
  - `GET/POST /sessions/{id}/dogs`
  - `GET/POST /sessions/{id}/rounds`

CORS is open for dev. Adjust in production or place behind a reverse proxy.
