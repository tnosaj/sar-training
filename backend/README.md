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

## example curls

### Health

```
curl -s http://localhost:8080/health
```

### Skills

#### Create a skill:

```
curl -sX POST http://localhost:8080/skills \
  -H 'Content-Type: application/json' \
  -d '{"name":"Obedience","description":"Core obedience skillset"}'
```

#### List skills:

```
curl -s http://localhost:8080/skills | jq
```

### Behaviors

#### Create a behavior under a skill (use the skill ID from above):

```
curl -sX POST http://localhost:8080/behaviors \
  -H 'Content-Type: application/json' \
  -d '{"skill_id":1,"name":"Sit","description":"Sit on cue"}'
```

#### List behaviors (all or by skill):

```
curl -s 'http://localhost:8080/behaviors'
```

```
curl -s 'http://localhost:8080/behaviors?skill_id=1' | jq
```

### Exercises

#### Create exercises:

```
curl -sX POST http://localhost:8080/exercises \
  -H 'Content-Type: application/json' \
  -d '{"name":"Lure into Sit","description":"Use lure to shape sit"}'
```

```
curl -sX POST http://localhost:8080/exercises \
  -H 'Content-Type: application/json' \
  -d '{"name":"Duration Hold","description":"Hold sit for duration"}'
```


#### List exercises (all or those linked to a behavior):

```
curl -s http://localhost:8080/exercises | jq
```

```
curl -s 'http://localhost:8080/exercises?behavior_id=1' | jq
```


#### Link exercise ↔ behavior:


```
# Link behavior 1 to exercise 1 with strength 5
curl -sX POST http://localhost:8080/behavior-exercises \
  -H 'Content-Type: application/json' \
  -d '{"behavior_id":1,"exercise_id":1,"strength":5}'
```

### Dogs

#### Create dogs:

```
curl -sX POST http://localhost:8080/dogs \
  -H 'Content-Type: application/json' \
  -d '{"name":"Kira","callname":"Kiki","birthdate":"2019-04-12T00:00:00Z"}'
```

```
curl -sX POST http://localhost:8080/dogs \
  -H 'Content-Type: application/json' \
  -d '{"name":"Rex"}'
```

#### List dogs:

```
curl -s http://localhost:8080/dogs | jq
```

### Training sessions

#### Create a session:

```
curl -sX POST http://localhost:8080/sessions \
  -H 'Content-Type: application/json' \
  -d '{"location":"Training field","notes":"Evening work"}'
```

#### List sessions:

```
curl -s http://localhost:8080/sessions | jq
```

#### Add dogs to a session:

```
# Add dog 1 to session 1
curl -sX POST http://localhost:8080/sessions/1/dogs \
  -H 'Content-Type: application/json' \
  -d '{"dog_id":1}'
```

#### List session’s dogs:

```
curl -s http://localhost:8080/sessions/1/dogs | jq
```

### Rounds (planned vs exhibited)

#### Create a round (let server auto-increment round_number).

Here we plan to train behavior 1 with exercise 1; dog 1 exhibits behavior 1 successfully:

```
curl -sX POST http://localhost:8080/sessions/1/rounds \
  -H 'Content-Type: application/json' \
  -d '{
    "dog_id": 1,
    "exercise_id": 1,
    "planned_behavior_id": 1,
    "exhibited_behavior_id": 1,
    "outcome": "success",
    "score": 9,
    "notes": "Great focus",
    "started_at": "2025-08-20T18:05:00Z",
    "ended_at": "2025-08-20T18:07:00Z"
  }'
```

Create another round where the exhibited behavior differs (e.g., planned “Sit” but dog offers “Down” which is behavior 2 or free text):

```
# If you already created behavior 2 as \"Down\"
curl -sX POST http://localhost:8080/sessions/1/rounds \
  -H 'Content-Type: application/json' \
  -d '{
    "dog_id": 1,
    "exercise_id": 2,
    "planned_behavior_id": 1,
    "exhibited_behavior_id": 2,
    "outcome": "partial",
    "score": 6,
    "notes": "Offered down instead of sit"
  }'
```

Or, if the exhibited behavior isn't yet in taxonomy:

```
curl -sX POST http://localhost:8080/sessions/1/rounds \
  -H 'Content-Type: application/json' \
  -d '{
    "dog_id": 1,
    "exercise_id": 2,
    "planned_behavior_id": 1,
    "outcome": "partial",
    "score": 6,
    "exhibited_free_text": "Offered down",
    "notes": "Promote to Behavior later"
  }'
```

#### List rounds in a session:

```
curl -s http://localhost:8080/sessions/1/rounds | jq
```

#### List rounds for a dog:

```
curl -s http://localhost:8080/dogs/1/rounds | jq
```
