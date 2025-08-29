package sqlite

import (
	"context"
	"database/sql"
	"time"

	"github.com/tnosaj/sar-training/backend/internal/domain/exercise"
)

type ExercisesRepo struct { db *sql.DB }
func NewExercisesRepo(db *sql.DB) *ExercisesRepo { return &ExercisesRepo{db: db} }

func (r *ExercisesRepo) Create(ctx context.Context, e *exercise.Exercise) error {
	res, err := r.db.ExecContext(ctx, `INSERT INTO exercises (name, description, created_at, updated_at) VALUES (?, ?, ?, ?)`,
		e.Name, e.Description, e.CreatedAt.Format(time.RFC3339), e.UpdatedAt.Format(time.RFC3339))
	if err != nil { return err }
	id, _ := res.LastInsertId()
	e.ID = exercise.ExerciseID(id)
	return nil
}

func (r *ExercisesRepo) List(ctx context.Context) ([]*exercise.Exercise, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT id, name, description, created_at, updated_at FROM exercises ORDER BY id DESC`)
	if err != nil { return nil, err }
	defer rows.Close()
	var out []*exercise.Exercise
	for rows.Next() {
		var e exercise.Exercise
		var c,u string
		if err := rows.Scan(&e.ID, &e.Name, &e.Description, &c, &u); err != nil { return nil, err }
		e.CreatedAt, _ = time.Parse(time.RFC3339, c)
		e.UpdatedAt, _ = time.Parse(time.RFC3339, u)
		out = append(out, &e)
	}
	return out, rows.Err()
}

func (r *ExercisesRepo) Get(ctx context.Context, id exercise.ExerciseID) (*exercise.Exercise, error) {
	row := r.db.QueryRowContext(ctx, `SELECT id, name, description, created_at, updated_at FROM exercises WHERE id=?`, id)
	var e exercise.Exercise
	var c,u string
	if err := row.Scan(&e.ID, &e.Name, &e.Description, &c, &u); err != nil { return nil, err }
	e.CreatedAt, _ = time.Parse(time.RFC3339, c)
	e.UpdatedAt, _ = time.Parse(time.RFC3339, u)
	return &e, nil
}

func (r *ExercisesRepo) LinkBehavior(ctx context.Context, behaviorID int64, exerciseID int64, strength int) error {
	_, err := r.db.ExecContext(ctx, `INSERT OR REPLACE INTO behavior_exercises (behavior_id, exercise_id, strength) VALUES (?, ?, ?)`,
		behaviorID, exerciseID, strength)
	return err
}
