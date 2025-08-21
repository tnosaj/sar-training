// Dog Training Tracker — JSON API with SQLite (concrete impl) and storage interface
//
// Quickstart:
//
//	go mod init example.com/dogtracker
//	go get github.com/mattn/go-sqlite3
//	go run .
//
// Environment:
//
//	PORT=8080 (default)
//	DB_PATH=./dogtracker.db (default)
//
// Endpoints (see cURL examples in chat):
//
//	GET  /health
//	POST /skills                   {name, description}
//	GET  /skills                   -> list skills
//	POST /behaviors                {skill_id, name, description}
//	GET  /behaviors?skill_id=ID    -> list behaviors (optionally by skill)
//	POST /exercises                {name, description}
//	GET  /exercises                -> list exercises (optionally by behavior_id)
//	POST /behavior-exercises       {behavior_id, exercise_id, strength}
//	POST /dogs                     {name, callname, birthdate, notes}
//	GET  /dogs                     -> list dogs
//	POST /sessions                 {started_at?, location, notes}
//	GET  /sessions                 -> list sessions
//	POST /sessions/{id}/dogs       {dog_id}
//	GET  /sessions/{id}/dogs       -> list dogs in session
//	POST /sessions/{id}/rounds     {dog_id, exercise_id, planned_behavior_id, exhibited_behavior_id?, exhibited_free_text?, outcome, score?, notes?, started_at?, ended_at?, round_number?}
//	GET  /sessions/{id}/rounds     -> list rounds in session
//	GET  /dogs/{id}/rounds         -> list rounds for a dog
package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

// ===== Models =====

type Skill struct {
	ID          int64   `json:"id"`
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
}

type Behavior struct {
	ID          int64   `json:"id"`
	SkillID     int64   `json:"skill_id"`
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
}

type Exercise struct {
	ID          int64   `json:"id"`
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
}

type BehaviorExercise struct {
	BehaviorID int64  `json:"behavior_id"`
	ExerciseID int64  `json:"exercise_id"`
	Strength   *int16 `json:"strength,omitempty"`
}

type Dog struct {
	ID        int64      `json:"id"`
	Name      string     `json:"name"`
	Callname  *string    `json:"callname,omitempty"`
	Birthdate *time.Time `json:"birthdate,omitempty"`
	Notes     *string    `json:"notes,omitempty"`
}

type TrainingSession struct {
	ID        int64      `json:"id"`
	StartedAt time.Time  `json:"started_at"`
	EndedAt   *time.Time `json:"ended_at,omitempty"`
	Location  *string    `json:"location,omitempty"`
	Notes     *string    `json:"notes,omitempty"`
}

type SessionDog struct {
	SessionID int64 `json:"session_id"`
	DogID     int64 `json:"dog_id"`
}

type Outcome string

const (
	OutcomeSuccess Outcome = "success"
	OutcomePartial Outcome = "partial"
	OutcomeFail    Outcome = "fail"
)

type Round struct {
	ID                  int64      `json:"id"`
	SessionID           int64      `json:"session_id"`
	DogID               int64      `json:"dog_id"`
	RoundNumber         int        `json:"round_number"`
	ExerciseID          int64      `json:"exercise_id"`
	PlannedBehaviorID   int64      `json:"planned_behavior_id"`
	ExhibitedBehaviorID *int64     `json:"exhibited_behavior_id,omitempty"`
	Outcome             Outcome    `json:"outcome"`
	Score               *int16     `json:"score,omitempty"`
	Notes               *string    `json:"notes,omitempty"`
	StartedAt           *time.Time `json:"started_at,omitempty"`
	EndedAt             *time.Time `json:"ended_at,omitempty"`
	ExhibitedFreeText   *string    `json:"exhibited_free_text,omitempty"`
}

type DogBehaviorProficiency struct {
	DogID       int64     `json:"dog_id"`
	BehaviorID  int64     `json:"behavior_id"`
	Level       int16     `json:"level"`
	LastRoundID *int64    `json:"last_round_id,omitempty"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// ===== Storage Interface =====

type Store interface {
	Ping(ctx context.Context) error
	AutoMigrate(ctx context.Context) error

	CreateSkill(ctx context.Context, s *Skill) error
	ListSkills(ctx context.Context) ([]Skill, error)

	CreateBehavior(ctx context.Context, b *Behavior) error
	ListBehaviors(ctx context.Context, skillID *int64) ([]Behavior, error)

	CreateExercise(ctx context.Context, e *Exercise) error
	ListExercises(ctx context.Context, behaviorID *int64) ([]Exercise, error)
	LinkBehaviorExercise(ctx context.Context, be *BehaviorExercise) error

	CreateDog(ctx context.Context, d *Dog) error
	ListDogs(ctx context.Context) ([]Dog, error)

	CreateSession(ctx context.Context, s *TrainingSession) error
	ListSessions(ctx context.Context) ([]TrainingSession, error)
	AddDogToSession(ctx context.Context, sd *SessionDog) error
	ListSessionDogs(ctx context.Context, sessionID int64) ([]Dog, error)

	CreateRound(ctx context.Context, r *Round) error
	ListSessionRounds(ctx context.Context, sessionID int64) ([]Round, error)
	ListDogRounds(ctx context.Context, dogID int64) ([]Round, error)
}

// ===== SQLite implementation =====

type sqliteStore struct{ db *sql.DB }

func newSQLite(path string) (*sqliteStore, error) {
	dsn := path
	db, err := sql.Open("sqlite3", dsn)
	if err != nil {
		return nil, err
	}
	// Enforce foreign keys
	if _, err := db.Exec("PRAGMA foreign_keys = ON"); err != nil {
		_ = db.Close()
		return nil, err
	}
	return &sqliteStore{db: db}, nil
}

func (s *sqliteStore) Ping(ctx context.Context) error { return s.db.PingContext(ctx) }

func (s *sqliteStore) AutoMigrate(ctx context.Context) error {
	sql := `
CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);
CREATE TABLE IF NOT EXISTS behaviors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  skill_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  UNIQUE (skill_id, name),
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);
CREATE TABLE IF NOT EXISTS behavior_exercise (
  behavior_id INTEGER NOT NULL,
  exercise_id INTEGER NOT NULL,
  strength INTEGER,
  PRIMARY KEY (behavior_id, exercise_id),
  FOREIGN KEY (behavior_id) REFERENCES behaviors(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS dogs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  callname TEXT,
  birthdate TEXT,
  notes TEXT
);
CREATE TABLE IF NOT EXISTS training_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  location TEXT,
  notes TEXT
);
CREATE TABLE IF NOT EXISTS session_dogs (
  session_id INTEGER NOT NULL,
  dog_id INTEGER NOT NULL,
  PRIMARY KEY (session_id, dog_id),
  FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS rounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  dog_id INTEGER NOT NULL,
  round_number INTEGER NOT NULL,
  exercise_id INTEGER NOT NULL,
  planned_behavior_id INTEGER NOT NULL,
  exhibited_behavior_id INTEGER,
  outcome TEXT NOT NULL CHECK (outcome IN ('success','partial','fail')),
  score INTEGER,
  notes TEXT,
  started_at TEXT,
  ended_at TEXT,
  exhibited_free_text TEXT,
  UNIQUE (session_id, dog_id, round_number),
  FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE RESTRICT,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE RESTRICT,
  FOREIGN KEY (planned_behavior_id) REFERENCES behaviors(id) ON DELETE RESTRICT,
  FOREIGN KEY (exhibited_behavior_id) REFERENCES behaviors(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS dog_behavior_proficiency (
  dog_id INTEGER NOT NULL,
  behavior_id INTEGER NOT NULL,
  level INTEGER NOT NULL,
  last_round_id INTEGER,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (dog_id, behavior_id),
  FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE,
  FOREIGN KEY (behavior_id) REFERENCES behaviors(id) ON DELETE CASCADE,
  FOREIGN KEY (last_round_id) REFERENCES rounds(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_rounds_session ON rounds(session_id);
CREATE INDEX IF NOT EXISTS idx_rounds_dog ON rounds(dog_id);
CREATE INDEX IF NOT EXISTS idx_rounds_planned ON rounds(planned_behavior_id);
CREATE INDEX IF NOT EXISTS idx_rounds_exhibited ON rounds(exhibited_behavior_id);
CREATE INDEX IF NOT EXISTS idx_behavior_exercise_ex ON behavior_exercise(exercise_id);
`
	_, err := s.db.ExecContext(ctx, sql)
	return err
}

// --- helpers ---
func nullableTimePtr(s *string) (*time.Time, error) {
	if s == nil || *s == "" {
		return nil, nil
	}
	t, err := time.Parse(time.RFC3339, *s)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

// --- Skills ---
func (s *sqliteStore) CreateSkill(ctx context.Context, sk *Skill) error {
	res, err := s.db.ExecContext(ctx, `INSERT INTO skills(name, description) VALUES(?, ?)`, sk.Name, sk.Description)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	sk.ID = id
	return nil
}
func (s *sqliteStore) ListSkills(ctx context.Context) ([]Skill, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT id, name, description FROM skills ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Skill
	for rows.Next() {
		var sk Skill
		var desc sql.NullString
		if err := rows.Scan(&sk.ID, &sk.Name, &desc); err != nil {
			return nil, err
		}
		if desc.Valid {
			sk.Description = &desc.String
		}
		out = append(out, sk)
	}
	return out, rows.Err()
}

// --- Behaviors ---
func (s *sqliteStore) CreateBehavior(ctx context.Context, b *Behavior) error {
	res, err := s.db.ExecContext(ctx, `INSERT INTO behaviors(skill_id, name, description) VALUES(?, ?, ?)`, b.SkillID, b.Name, b.Description)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	b.ID = id
	return nil
}
func (s *sqliteStore) ListBehaviors(ctx context.Context, skillID *int64) ([]Behavior, error) {
	var rows *sql.Rows
	var err error
	if skillID != nil {
		rows, err = s.db.QueryContext(ctx, `SELECT id, skill_id, name, description FROM behaviors WHERE skill_id=? ORDER BY name`, *skillID)
	} else {
		rows, err = s.db.QueryContext(ctx, `SELECT id, skill_id, name, description FROM behaviors ORDER BY name`)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Behavior
	for rows.Next() {
		var b Behavior
		var desc sql.NullString
		if err := rows.Scan(&b.ID, &b.SkillID, &b.Name, &desc); err != nil {
			return nil, err
		}
		if desc.Valid {
			b.Description = &desc.String
		}
		out = append(out, b)
	}
	return out, rows.Err()
}

// --- Exercises ---
func (s *sqliteStore) CreateExercise(ctx context.Context, e *Exercise) error {
	res, err := s.db.ExecContext(ctx, `INSERT INTO exercises(name, description) VALUES(?, ?)`, e.Name, e.Description)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	e.ID = id
	return nil
}
func (s *sqliteStore) ListExercises(ctx context.Context, behaviorID *int64) ([]Exercise, error) {
	var rows *sql.Rows
	var err error
	if behaviorID != nil {
		rows, err = s.db.QueryContext(ctx, `SELECT e.id, e.name, e.description FROM exercises e JOIN behavior_exercise be ON be.exercise_id=e.id WHERE be.behavior_id=? ORDER BY e.name`, *behaviorID)
	} else {
		rows, err = s.db.QueryContext(ctx, `SELECT id, name, description FROM exercises ORDER BY name`)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Exercise
	for rows.Next() {
		var e Exercise
		var desc sql.NullString
		if err := rows.Scan(&e.ID, &e.Name, &desc); err != nil {
			return nil, err
		}
		if desc.Valid {
			e.Description = &desc.String
		}
		out = append(out, e)
	}
	return out, rows.Err()
}
func (s *sqliteStore) LinkBehaviorExercise(ctx context.Context, be *BehaviorExercise) error {
	_, err := s.db.ExecContext(ctx, `INSERT OR REPLACE INTO behavior_exercise(behavior_id, exercise_id, strength) VALUES(?, ?, ?)`, be.BehaviorID, be.ExerciseID, be.Strength)
	return err
}

// --- Dogs ---
func (s *sqliteStore) CreateDog(ctx context.Context, d *Dog) error {
	var bdate *string
	if d.Birthdate != nil {
		str := d.Birthdate.UTC().Format(time.RFC3339)
		bdate = &str
	}
	res, err := s.db.ExecContext(ctx, `INSERT INTO dogs(name, callname, birthdate, notes) VALUES(?, ?, ?, ?)`, d.Name, d.Callname, bdate, d.Notes)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	d.ID = id
	return nil
}
func (s *sqliteStore) ListDogs(ctx context.Context) ([]Dog, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT id, name, callname, birthdate, notes FROM dogs ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Dog
	for rows.Next() {
		var d Dog
		var call, bdate, notes sql.NullString
		if err := rows.Scan(&d.ID, &d.Name, &call, &bdate, &notes); err != nil {
			return nil, err
		}
		if call.Valid {
			d.Callname = &call.String
		}
		if notes.Valid {
			d.Notes = &notes.String
		}
		if bdate.Valid && bdate.String != "" {
			if t, err := time.Parse(time.RFC3339, bdate.String); err == nil {
				d.Birthdate = &t
			}
		}
		out = append(out, d)
	}
	return out, rows.Err()
}

// --- Sessions ---
func (s *sqliteStore) CreateSession(ctx context.Context, ts *TrainingSession) error {
	if ts.StartedAt.IsZero() {
		ts.StartedAt = time.Now().UTC()
	}
	var ended *string
	if ts.EndedAt != nil {
		str := ts.EndedAt.UTC().Format(time.RFC3339)
		ended = &str
	}
	res, err := s.db.ExecContext(ctx, `INSERT INTO training_sessions(started_at, ended_at, location, notes) VALUES(?, ?, ?, ?)`, ts.StartedAt.UTC().Format(time.RFC3339), ended, ts.Location, ts.Notes)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	ts.ID = id
	return nil
}
func (s *sqliteStore) ListSessions(ctx context.Context) ([]TrainingSession, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT id, started_at, ended_at, location, notes FROM training_sessions ORDER BY started_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []TrainingSession
	for rows.Next() {
		var ts TrainingSession
		var started, ended, loc, notes sql.NullString
		if err := rows.Scan(&ts.ID, &started, &ended, &loc, &notes); err != nil {
			return nil, err
		}
		if started.Valid {
			t, _ := time.Parse(time.RFC3339, started.String)
			ts.StartedAt = t
		}
		if ended.Valid && ended.String != "" {
			t, _ := time.Parse(time.RFC3339, ended.String)
			ts.EndedAt = &t
		}
		if loc.Valid {
			ts.Location = &loc.String
		}
		if notes.Valid {
			ts.Notes = &notes.String
		}
		out = append(out, ts)
	}
	return out, rows.Err()
}
func (s *sqliteStore) AddDogToSession(ctx context.Context, sd *SessionDog) error {
	_, err := s.db.ExecContext(ctx, `INSERT OR IGNORE INTO session_dogs(session_id, dog_id) VALUES(?, ?)`, sd.SessionID, sd.DogID)
	return err
}
func (s *sqliteStore) ListSessionDogs(ctx context.Context, sessionID int64) ([]Dog, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT d.id, d.name, d.callname, d.birthdate, d.notes FROM dogs d JOIN session_dogs sd ON sd.dog_id=d.id WHERE sd.session_id=? ORDER BY d.name`, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Dog
	for rows.Next() {
		var d Dog
		var call, bdate, notes sql.NullString
		if err := rows.Scan(&d.ID, &d.Name, &call, &bdate, &notes); err != nil {
			return nil, err
		}
		if call.Valid {
			d.Callname = &call.String
		}
		if notes.Valid {
			d.Notes = &notes.String
		}
		if bdate.Valid && bdate.String != "" {
			if t, err := time.Parse(time.RFC3339, bdate.String); err == nil {
				d.Birthdate = &t
			}
		}
		out = append(out, d)
	}
	return out, rows.Err()
}

// --- Rounds ---
func (s *sqliteStore) nextRoundNumber(ctx context.Context, sessionID, dogID int64) (int, error) {
	row := s.db.QueryRowContext(ctx, `SELECT COALESCE(MAX(round_number),0)+1 FROM rounds WHERE session_id=? AND dog_id=?`, sessionID, dogID)
	var n int
	if err := row.Scan(&n); err != nil {
		return 0, err
	}
	return n, nil
}

func (s *sqliteStore) CreateRound(ctx context.Context, r *Round) error {
	if r.RoundNumber <= 0 {
		n, err := s.nextRoundNumber(ctx, r.SessionID, r.DogID)
		if err != nil {
			return err
		}
		r.RoundNumber = n
	}
	// Validate outcome
	switch r.Outcome {
	case OutcomeSuccess, OutcomePartial, OutcomeFail:
	default:
		return errors.New("invalid outcome")
	}
	var startStr, endStr *string
	if r.StartedAt != nil {
		s := r.StartedAt.UTC().Format(time.RFC3339)
		startStr = &s
	}
	if r.EndedAt != nil {
		s := r.EndedAt.UTC().Format(time.RFC3339)
		endStr = &s
	}

	res, err := s.db.ExecContext(ctx, `
INSERT INTO rounds(
  session_id, dog_id, round_number, exercise_id,
  planned_behavior_id, exhibited_behavior_id, outcome, score, notes,
  started_at, ended_at, exhibited_free_text
) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`, r.SessionID, r.DogID, r.RoundNumber, r.ExerciseID, r.PlannedBehaviorID, r.ExhibitedBehaviorID, string(r.Outcome), r.Score, r.Notes, startStr, endStr, r.ExhibitedFreeText)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	r.ID = id

	// Simple proficiency rule: on success with score >=8, set at least level 4
	if r.Outcome == OutcomeSuccess && r.Score != nil && *r.Score >= 8 {
		_, _ = s.db.ExecContext(ctx, `
INSERT INTO dog_behavior_proficiency(dog_id, behavior_id, level, last_round_id, updated_at)
VALUES(?, ?, ?, ?, ?)
ON CONFLICT(dog_id, behavior_id) DO UPDATE SET
  level=MAX(level, excluded.level),
  last_round_id=excluded.last_round_id,
  updated_at=excluded.updated_at
`, r.DogID, r.PlannedBehaviorID, 4, r.ID, time.Now().UTC().Format(time.RFC3339))
	}
	return nil
}

func (s *sqliteStore) ListSessionRounds(ctx context.Context, sessionID int64) ([]Round, error) {
	rows, err := s.db.QueryContext(ctx, `
SELECT id, session_id, dog_id, round_number, exercise_id, planned_behavior_id, exhibited_behavior_id, outcome, score, notes, started_at, ended_at, exhibited_free_text
FROM rounds WHERE session_id=? ORDER BY dog_id, round_number
`, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanRounds(rows)
}

func (s *sqliteStore) ListDogRounds(ctx context.Context, dogID int64) ([]Round, error) {
	rows, err := s.db.QueryContext(ctx, `
SELECT id, session_id, dog_id, round_number, exercise_id, planned_behavior_id, exhibited_behavior_id, outcome, score, notes, started_at, ended_at, exhibited_free_text
FROM rounds WHERE dog_id=? ORDER BY session_id, round_number
`, dogID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanRounds(rows)
}

func scanRounds(rows *sql.Rows) ([]Round, error) {
	var out []Round
	for rows.Next() {
		var r Round
		var exhibited sql.NullInt64
		var score sql.NullInt64
		var notes, sstart, send, free sql.NullString
		var outcome string
		if err := rows.Scan(&r.ID, &r.SessionID, &r.DogID, &r.RoundNumber, &r.ExerciseID, &r.PlannedBehaviorID, &exhibited, &outcome, &score, &notes, &sstart, &send, &free); err != nil {
			return nil, err
		}
		if exhibited.Valid {
			v := exhibited.Int64
			r.ExhibitedBehaviorID = &v
		}
		if score.Valid {
			v := int16(score.Int64)
			r.Score = &v
		}
		if notes.Valid {
			r.Notes = &notes.String
		}
		if sstart.Valid && sstart.String != "" {
			if t, err := time.Parse(time.RFC3339, sstart.String); err == nil {
				r.StartedAt = &t
			}
		}
		if send.Valid && send.String != "" {
			if t, err := time.Parse(time.RFC3339, send.String); err == nil {
				r.EndedAt = &t
			}
		}
		if free.Valid {
			r.ExhibitedFreeText = &free.String
		}
		r.Outcome = Outcome(outcome)
		out = append(out, r)
	}
	return out, rows.Err()
}

// ===== HTTP API =====

type api struct{ store Store }

func (a *api) routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", a.handleHealth)
	mux.HandleFunc("/skills", a.handleSkills)
	mux.HandleFunc("/behaviors", a.handleBehaviors)
	mux.HandleFunc("/exercises", a.handleExercises)
	mux.HandleFunc("/behavior-exercises", a.handleBehaviorExercises)
	mux.HandleFunc("/dogs", a.handleDogs)
	mux.HandleFunc("/sessions", a.handleSessions)
	mux.HandleFunc("/sessions/", a.handleSessionSubroutes) // /sessions/{id}/...
	mux.HandleFunc("/dogs/", a.handleDogSubroutes)         // /dogs/{id}/...
	return withJSON(mux)
}

func withJSON(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		// Allow simple CORS for dev
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (a *api) handleHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}
	if err := a.store.Ping(r.Context()); err != nil {
		http.Error(w, `{"status":"degraded"}`, 500)
		return
	}
	_, _ = w.Write([]byte(`{"status":"ok"}`))
}

// --- Skills ---
func (a *api) handleSkills(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		var in struct {
			Name        string  `json:"name"`
			Description *string `json:"description"`
		}
		if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
			badRequest(w, err)
			return
		}
		if strings.TrimSpace(in.Name) == "" {
			badRequestStr(w, "name is required")
			return
		}
		sk := &Skill{Name: in.Name, Description: in.Description}
		if err := a.store.CreateSkill(r.Context(), sk); err != nil {
			serverErr(w, err)
			return
		}
		json.NewEncoder(w).Encode(sk)
	case http.MethodGet:
		items, err := a.store.ListSkills(r.Context())
		if err != nil {
			serverErr(w, err)
			return
		}
		json.NewEncoder(w).Encode(items)
	default:
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
	}
}

// --- Behaviors ---
func (a *api) handleBehaviors(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		var in struct {
			SkillID     int64   `json:"skill_id"`
			Name        string  `json:"name"`
			Description *string `json:"description"`
		}
		if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
			badRequest(w, err)
			return
		}
		if in.SkillID == 0 || strings.TrimSpace(in.Name) == "" {
			badRequestStr(w, "skill_id and name are required")
			return
		}
		b := &Behavior{SkillID: in.SkillID, Name: in.Name, Description: in.Description}
		if err := a.store.CreateBehavior(r.Context(), b); err != nil {
			serverErr(w, err)
			return
		}
		json.NewEncoder(w).Encode(b)
	case http.MethodGet:
		var skillID *int64
		if v := r.URL.Query().Get("skill_id"); v != "" {
			if id, err := strconv.ParseInt(v, 10, 64); err == nil {
				skillID = &id
			} else {
				badRequestStr(w, "invalid skill_id")
				return
			}
		}
		items, err := a.store.ListBehaviors(r.Context(), skillID)
		if err != nil {
			serverErr(w, err)
			return
		}
		json.NewEncoder(w).Encode(items)
	default:
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
	}
}

// --- Exercises ---
func (a *api) handleExercises(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		var in struct {
			Name        string  `json:"name"`
			Description *string `json:"description"`
		}
		if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
			badRequest(w, err)
			return
		}
		if strings.TrimSpace(in.Name) == "" {
			badRequestStr(w, "name is required")
			return
		}
		e := &Exercise{Name: in.Name, Description: in.Description}
		if err := a.store.CreateExercise(r.Context(), e); err != nil {
			serverErr(w, err)
			return
		}
		json.NewEncoder(w).Encode(e)
	case http.MethodGet:
		var behaviorID *int64
		if v := r.URL.Query().Get("behavior_id"); v != "" {
			if id, err := strconv.ParseInt(v, 10, 64); err == nil {
				behaviorID = &id
			} else {
				badRequestStr(w, "invalid behavior_id")
				return
			}
		}
		items, err := a.store.ListExercises(r.Context(), behaviorID)
		if err != nil {
			serverErr(w, err)
			return
		}
		json.NewEncoder(w).Encode(items)
	default:
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
	}
}

// --- Behavior-Exercise link ---
func (a *api) handleBehaviorExercises(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}
	var in BehaviorExercise
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		badRequest(w, err)
		return
	}
	if in.BehaviorID == 0 || in.ExerciseID == 0 {
		badRequestStr(w, "behavior_id and exercise_id are required")
		return
	}
	if err := a.store.LinkBehaviorExercise(r.Context(), &in); err != nil {
		serverErr(w, err)
		return
	}
	json.NewEncoder(w).Encode(in)
}

// --- Dogs ---
func (a *api) handleDogs(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		var in struct {
			Name      string  `json:"name"`
			Callname  *string `json:"callname"`
			Birthdate *string `json:"birthdate"`
			Notes     *string `json:"notes"`
		}
		if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
			badRequest(w, err)
			return
		}
		if strings.TrimSpace(in.Name) == "" {
			badRequestStr(w, "name is required")
			return
		}
		bd, err := nullableTimePtr(in.Birthdate)
		if err != nil {
			badRequestStr(w, "birthdate must be RFC3339")
			return
		}
		d := &Dog{Name: in.Name, Callname: in.Callname, Birthdate: bd, Notes: in.Notes}
		if err := a.store.CreateDog(r.Context(), d); err != nil {
			serverErr(w, err)
			return
		}
		json.NewEncoder(w).Encode(d)
	case http.MethodGet:
		items, err := a.store.ListDogs(r.Context())
		if err != nil {
			serverErr(w, err)
			return
		}
		json.NewEncoder(w).Encode(items)
	default:
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
	}
}

// --- Sessions & subroutes ---
func (a *api) handleSessions(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		var in struct {
			StartedAt *string `json:"started_at"`
			EndedAt   *string `json:"ended_at"`
			Location  *string `json:"location"`
			Notes     *string `json:"notes"`
		}
		if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
			badRequest(w, err)
			return
		}
		var st *time.Time
		var et *time.Time
		var err error
		if in.StartedAt != nil {
			st, err = nullableTimePtr(in.StartedAt)
			if err != nil {
				badRequestStr(w, "started_at must be RFC3339")
				return
			}
		}
		if in.EndedAt != nil {
			et, err = nullableTimePtr(in.EndedAt)
			if err != nil {
				badRequestStr(w, "ended_at must be RFC3339")
				return
			}
		}
		ts := &TrainingSession{Location: in.Location, Notes: in.Notes}
		if st != nil {
			ts.StartedAt = *st
		}
		if et != nil {
			ts.EndedAt = et
		}
		if err := a.store.CreateSession(r.Context(), ts); err != nil {
			serverErr(w, err)
			return
		}
		json.NewEncoder(w).Encode(ts)
	case http.MethodGet:
		items, err := a.store.ListSessions(r.Context())
		if err != nil {
			serverErr(w, err)
			return
		}
		json.NewEncoder(w).Encode(items)
	default:
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
	}
}

func (a *api) handleSessionSubroutes(w http.ResponseWriter, r *http.Request) {
	// Expect /sessions/{id}/dogs or /sessions/{id}/rounds
	path := strings.TrimPrefix(r.URL.Path, "/sessions/")
	parts := strings.Split(path, "/")
	if len(parts) < 2 {
		http.NotFound(w, r)
		return
	}
	id, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil {
		badRequestStr(w, "invalid session id")
		return
	}
	sub := parts[1]
	switch sub {
	case "dogs":
		a.handleSessionDogs(w, r, id)
	case "rounds":
		a.handleSessionRounds(w, r, id)
	default:
		http.NotFound(w, r)
	}
}

func (a *api) handleSessionDogs(w http.ResponseWriter, r *http.Request, sessionID int64) {
	switch r.Method {
	case http.MethodPost:
		var in struct {
			DogID int64 `json:"dog_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
			badRequest(w, err)
			return
		}
		if in.DogID == 0 {
			badRequestStr(w, "dog_id is required")
			return
		}
		sd := &SessionDog{SessionID: sessionID, DogID: in.DogID}
		if err := a.store.AddDogToSession(r.Context(), sd); err != nil {
			serverErr(w, err)
			return
		}
		json.NewEncoder(w).Encode(sd)
	case http.MethodGet:
		items, err := a.store.ListSessionDogs(r.Context(), sessionID)
		if err != nil {
			serverErr(w, err)
			return
		}
		json.NewEncoder(w).Encode(items)
	default:
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
	}
}

func (a *api) handleSessionRounds(w http.ResponseWriter, r *http.Request, sessionID int64) {
	switch r.Method {
	case http.MethodPost:
		var in struct {
			DogID               int64   `json:"dog_id"`
			RoundNumber         *int    `json:"round_number"`
			ExerciseID          int64   `json:"exercise_id"`
			PlannedBehaviorID   int64   `json:"planned_behavior_id"`
			ExhibitedBehaviorID *int64  `json:"exhibited_behavior_id"`
			Outcome             string  `json:"outcome"`
			Score               *int16  `json:"score"`
			Notes               *string `json:"notes"`
			StartedAt           *string `json:"started_at"`
			EndedAt             *string `json:"ended_at"`
			ExhibitedFreeText   *string `json:"exhibited_free_text"`
		}
		if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
			badRequest(w, err)
			return
		}
		if in.DogID == 0 || in.ExerciseID == 0 || in.PlannedBehaviorID == 0 || strings.TrimSpace(in.Outcome) == "" {
			badRequestStr(w, "dog_id, exercise_id, planned_behavior_id, outcome are required")
			return
		}
		var st, et *time.Time
		var err error
		if in.StartedAt != nil {
			st, err = nullableTimePtr(in.StartedAt)
			if err != nil {
				badRequestStr(w, "started_at must be RFC3339")
				return
			}
		}
		if in.EndedAt != nil {
			et, err = nullableTimePtr(in.EndedAt)
			if err != nil {
				badRequestStr(w, "ended_at must be RFC3339")
				return
			}
		}
		round := &Round{
			SessionID:           sessionID,
			DogID:               in.DogID,
			ExerciseID:          in.ExerciseID,
			PlannedBehaviorID:   in.PlannedBehaviorID,
			ExhibitedBehaviorID: in.ExhibitedBehaviorID,
			Outcome:             Outcome(strings.ToLower(in.Outcome)),
			Score:               in.Score,
			Notes:               in.Notes,
			StartedAt:           st,
			EndedAt:             et,
			ExhibitedFreeText:   in.ExhibitedFreeText,
		}
		if in.RoundNumber != nil {
			round.RoundNumber = *in.RoundNumber
		}
		if err := a.store.CreateRound(r.Context(), round); err != nil {
			serverErr(w, err)
			return
		}
		json.NewEncoder(w).Encode(round)
	case http.MethodGet:
		items, err := a.store.ListSessionRounds(r.Context(), sessionID)
		if err != nil {
			serverErr(w, err)
			return
		}
		json.NewEncoder(w).Encode(items)
	default:
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
	}
}

// --- Dog subroutes ---
func (a *api) handleDogSubroutes(w http.ResponseWriter, r *http.Request) {
	// Expect /dogs/{id}/rounds
	path := strings.TrimPrefix(r.URL.Path, "/dogs/")
	parts := strings.Split(path, "/")
	if len(parts) < 2 {
		http.NotFound(w, r)
		return
	}
	id, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil {
		badRequestStr(w, "invalid dog id")
		return
	}
	sub := parts[1]
	switch sub {
	case "rounds":
		if r.Method != http.MethodGet {
			http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
			return
		}
		items, err := a.store.ListDogRounds(r.Context(), id)
		if err != nil {
			serverErr(w, err)
			return
		}
		json.NewEncoder(w).Encode(items)
	default:
		http.NotFound(w, r)
	}
}

// ===== HTTP helpers =====
func badRequest(w http.ResponseWriter, err error) {
	http.Error(w, fmt.Sprintf(`{"error":"%s"}`, escape(err.Error())), http.StatusBadRequest)
}
func badRequestStr(w http.ResponseWriter, s string) {
	http.Error(w, fmt.Sprintf(`{"error":"%s"}`, escape(s)), http.StatusBadRequest)
}
func serverErr(w http.ResponseWriter, err error) {
	log.Println("ERROR:", err)
	http.Error(w, `{"error":"internal"}`, 500)
}
func escape(s string) string {
	b, _ := json.Marshal(s)
	var out string
	_ = json.Unmarshal(b, &out)
	return out
}

// ===== main =====
func main() {
	addr := ":" + envOr("PORT", "8080")
	dbPath := envOr("DB_PATH", "./dogtracker.db")
	st, err := newSQLite(dbPath)
	if err != nil {
		log.Fatal(err)
	}
	ctx := context.Background()
	if err := st.AutoMigrate(ctx); err != nil {
		log.Fatal("migrate:", err)
	}
	api := &api{store: st}
	log.Printf("listening on %s (db=%s)\n", addr, dbPath)
	log.Fatal(http.ListenAndServe(addr, api.routes()))
}

func envOr(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}
