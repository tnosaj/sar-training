package sqlite

import (
	"context"
	"database/sql"

	"github.com/tnosaj/sar-training/backend/internal/domain/common"
	"github.com/tnosaj/sar-training/backend/internal/domain/session"
	logx "github.com/tnosaj/sar-training/backend/internal/infra/log"
)

type SessionsRepo struct{ db *sql.DB }

func NewSessionsRepo(db *sql.DB) *SessionsRepo {
	logx.Std.Trace("starting sessions repo")
	return &SessionsRepo{db: db}
}

func (r *SessionsRepo) CreateSession(ctx context.Context, s *session.Session) error {
	res, err := r.db.ExecContext(ctx, `INSERT INTO sessions (started_at, ended_at, location, notes) VALUES (?, ?, ?, ?)`,
		s.StartedAt, s.EndedAt, s.Location, s.Notes)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	s.ID = session.SessionID(id)
	return nil
}

func (r *SessionsRepo) UpdateSession(ctx context.Context, s *session.Session) error {
	res, err := r.db.ExecContext(ctx, `UPDATE sessions SET started_at=?, ended_at=?, location=?, notes=? WHERE id=?`,
		s.StartedAt, s.EndedAt, s.Location, s.Notes, s.ID)
	if err != nil {
		return err
	}
	rows, _ := res.RowsAffected()
	if rows == 0 {
		return common.ErrNotFound
	}
	return nil
}

func (r *SessionsRepo) CloseSession(ctx context.Context, s *session.Session) error {
	res, err := r.db.ExecContext(ctx, `UPDATE sessions SET ended_at=? WHERE id=?`,
		s.EndedAt, s.ID)
	if err != nil {
		return err
	}
	rows, _ := res.RowsAffected()
	if rows == 0 {
		return common.ErrNotFound
	}
	return nil
}

func (r *SessionsRepo) ListSessions(ctx context.Context) ([]*session.Session, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT id, started_at, ended_at, location, notes FROM sessions ORDER BY id DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*session.Session
	for rows.Next() {
		var s session.Session
		if err := rows.Scan(&s.ID, &s.StartedAt, &s.EndedAt, &s.Location, &s.Notes); err != nil {
			return nil, err
		}
		out = append(out, &s)
	}
	return out, rows.Err()
}

func (r *SessionsRepo) AddDog(ctx context.Context, sessionID int64, dogID int64) error {
	_, err := r.db.ExecContext(ctx, `INSERT OR IGNORE INTO session_dogs (session_id, dog_id) VALUES (?, ?)`, sessionID, dogID)
	return err
}

func (r *SessionsRepo) ListDogs(ctx context.Context, sessionID int64) ([]struct {
	ID   int64
	Name string
}, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT d.id, d.name FROM dogs d JOIN session_dogs sd ON sd.dog_id=d.id WHERE sd.session_id=? ORDER BY d.name`, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []struct {
		ID   int64
		Name string
	}
	for rows.Next() {
		var id int64
		var name string
		if err := rows.Scan(&id, &name); err != nil {
			return nil, err
		}
		out = append(out, struct {
			ID   int64
			Name string
		}{ID: id, Name: name})
	}
	return out, rows.Err()
}

func (r *SessionsRepo) CreateRound(ctx context.Context, ro *session.Round) error {
	var next int64 = 1
	row := r.db.QueryRowContext(ctx, `SELECT COALESCE(MAX(round_number),0)+1 FROM rounds WHERE session_id=?`, ro.SessionID)
	_ = row.Scan(&next)
	res, err := r.db.ExecContext(ctx, `INSERT INTO rounds (session_id, round_number, dog_id, exercise_id, planned_behavior_id, exhibited_behavior_id, exhibited_free_text, outcome, score, notes, started_at, ended_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		ro.SessionID, next, ro.DogID, ro.ExerciseID, ro.PlannedBehaviorID, ro.ExhibitedBehaviorID, ro.ExhibitedFreeText, ro.Outcome, ro.Score, ro.Notes, ro.StartedAt, ro.EndedAt)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	ro.ID = id
	ro.RoundNumber = next
	return nil
}

func (r *SessionsRepo) ListRounds(ctx context.Context, sessionID int64) ([]*session.Round, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT id, session_id, round_number, dog_id, exercise_id, planned_behavior_id, exhibited_behavior_id, exhibited_free_text, outcome, score, notes, started_at, ended_at FROM rounds WHERE session_id=? ORDER BY round_number ASC`, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*session.Round
	for rows.Next() {
		var ro session.Round
		if err := rows.Scan(&ro.ID, &ro.SessionID, &ro.RoundNumber, &ro.DogID, &ro.ExerciseID, &ro.PlannedBehaviorID, &ro.ExhibitedBehaviorID, &ro.ExhibitedFreeText, &ro.Outcome, &ro.Score, &ro.Notes, &ro.StartedAt, &ro.EndedAt); err != nil {
			return nil, err
		}
		out = append(out, &ro)
	}
	return out, rows.Err()
}

func (r *SessionsRepo) ListRoundsByDog(ctx context.Context, dogID int64) ([]*session.Round, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT id, session_id, round_number, dog_id, exercise_id, planned_behavior_id, exhibited_behavior_id, outcome, score, notes, started_at, ended_at, exhibited_free_text FROM rounds WHERE dog_id=? ORDER BY session_id ASC, round_number ASC`, dogID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*session.Round
	for rows.Next() {
		var ro session.Round
		var exhibited sql.NullInt64
		var score sql.NullInt64
		var notes sql.NullString
		var sstart sql.NullString
		var send sql.NullString
		var free sql.NullString
		if err := rows.Scan(&ro.ID, &ro.SessionID, &ro.RoundNumber, &ro.DogID, &ro.ExerciseID, &ro.PlannedBehaviorID, &exhibited, &ro.Outcome, &score, &notes, &sstart, &send, &free); err != nil {
			return nil, err
		}
		if exhibited.Valid {
			v := exhibited.Int64
			ro.ExhibitedBehaviorID = &v
		}
		if score.Valid {
			v := int(score.Int64)
			ro.Score = &v
		}
		if notes.Valid {
			ro.Notes = &notes.String
		}
		if sstart.Valid {
			ro.StartedAt = &sstart.String
		}
		if send.Valid {
			ro.EndedAt = &send.String
		}
		if free.Valid {
			ro.ExhibitedFreeText = &free.String
		}
		out = append(out, &ro)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return out, nil
}
