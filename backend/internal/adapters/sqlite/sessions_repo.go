package sqlite

import (
	"context"
	"database/sql"

	"github.com/tnosaj/sar-training/backend/internal/domain/session"
)

type SessionsRepo struct { db *sql.DB }
func NewSessionsRepo(db *sql.DB) *SessionsRepo { return &SessionsRepo{db: db} }

func (r *SessionsRepo) CreateSession(ctx context.Context, s *session.Session) error {
	res, err := r.db.ExecContext(ctx, `INSERT INTO sessions (started_at, ended_at, location, notes) VALUES (?, ?, ?, ?)`,
		s.StartedAt, s.EndedAt, s.Location, s.Notes)
	if err != nil { return err }
	id, _ := res.LastInsertId()
	s.ID = session.SessionID(id)
	return nil
}

func (r *SessionsRepo) ListSessions(ctx context.Context) ([]*session.Session, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT id, started_at, ended_at, location, notes FROM sessions ORDER BY id DESC`)
	if err != nil { return nil, err }
	defer rows.Close()
	var out []*session.Session
	for rows.Next() {
		var s session.Session
		if err := rows.Scan(&s.ID, &s.StartedAt, &s.EndedAt, &s.Location, &s.Notes); err != nil { return nil, err }
		out = append(out, &s)
	}
	return out, rows.Err()
}

func (r *SessionsRepo) AddDog(ctx context.Context, sessionID int64, dogID int64) error {
	_, err := r.db.ExecContext(ctx, `INSERT OR IGNORE INTO session_dogs (session_id, dog_id) VALUES (?, ?)`, sessionID, dogID)
	return err
}

func (r *SessionsRepo) ListDogs(ctx context.Context, sessionID int64) ([]struct{ ID int64; Name string }, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT d.id, d.name FROM dogs d JOIN session_dogs sd ON sd.dog_id=d.id WHERE sd.session_id=? ORDER BY d.name`, sessionID)
	if err != nil { return nil, err }
	defer rows.Close()
	var out []struct{ ID int64; Name string }
	for rows.Next() {
		var id int64; var name string
		if err := rows.Scan(&id, &name); err != nil { return nil, err }
		out = append(out, struct{ ID int64; Name string }{ID: id, Name: name})
	}
	return out, rows.Err()
}

func (r *SessionsRepo) CreateRound(ctx context.Context, ro *session.Round) error {
	var next int64 = 1
	row := r.db.QueryRowContext(ctx, `SELECT COALESCE(MAX(round_number),0)+1 FROM rounds WHERE session_id=?`, ro.SessionID)
	_ = row.Scan(&next)
	res, err := r.db.ExecContext(ctx, `INSERT INTO rounds (session_id, round_number, dog_id, exercise_id, planned_behavior_id, exhibited_behavior_id, exhibited_free_text, outcome, score, notes, started_at, ended_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		ro.SessionID, next, ro.DogID, ro.ExerciseID, ro.PlannedBehaviorID, ro.ExhibitedBehaviorID, ro.ExhibitedFreeText, ro.Outcome, ro.Score, ro.Notes, ro.StartedAt, ro.EndedAt)
	if err != nil { return err }
	id, _ := res.LastInsertId()
	ro.ID = id
	ro.RoundNumber = next
	return nil
}

func (r *SessionsRepo) ListRounds(ctx context.Context, sessionID int64) ([]*session.Round, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT id, session_id, round_number, dog_id, exercise_id, planned_behavior_id, exhibited_behavior_id, exhibited_free_text, outcome, score, notes, started_at, ended_at FROM rounds WHERE session_id=? ORDER BY round_number ASC`, sessionID)
	if err != nil { return nil, err }
	defer rows.Close()
	var out []*session.Round
	for rows.Next() {
		var ro session.Round
		if err := rows.Scan(&ro.ID, &ro.SessionID, &ro.RoundNumber, &ro.DogID, &ro.ExerciseID, &ro.PlannedBehaviorID, &ro.ExhibitedBehaviorID, &ro.ExhibitedFreeText, &ro.Outcome, &ro.Score, &ro.Notes, &ro.StartedAt, &ro.EndedAt); err != nil { return nil, err }
		out = append(out, &ro)
	}
	return out, rows.Err()
}
