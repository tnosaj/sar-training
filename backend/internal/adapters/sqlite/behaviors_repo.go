package sqlite

import (
	"context"
	"database/sql"
	"time"

	"github.com/tnosaj/sar-training/backend/internal/domain/behavior"
	logx "github.com/tnosaj/sar-training/backend/internal/infra/log"
)

type BehaviorsRepo struct{ db *sql.DB }

func NewBehaviorsRepo(db *sql.DB) *BehaviorsRepo {
	logx.Std.Trace("starting behaviors repo")
	return &BehaviorsRepo{db: db}
}

func (r *BehaviorsRepo) Create(ctx context.Context, b *behavior.Behavior) error {
	res, err := r.db.ExecContext(ctx, `INSERT INTO behaviors (skill_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
		b.SkillID, b.Name, b.Description, b.CreatedAt.Format(time.RFC3339), b.UpdatedAt.Format(time.RFC3339))
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	b.ID = behavior.BehaviorID(id)
	return nil
}

func (r *BehaviorsRepo) List(ctx context.Context, skillID *int64) ([]*behavior.Behavior, error) {
	query := `SELECT id, skill_id, name, description, created_at, updated_at FROM behaviors`
	args := []any{}
	if skillID != nil {
		query += ` WHERE skill_id = ?`
		args = append(args, *skillID)
	}
	query += ` ORDER BY id DESC`
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*behavior.Behavior
	for rows.Next() {
		var b behavior.Behavior
		var c, u string
		if err := rows.Scan(&b.ID, &b.SkillID, &b.Name, &b.Description, &c, &u); err != nil {
			return nil, err
		}
		b.CreatedAt, _ = time.Parse(time.RFC3339, c)
		b.UpdatedAt, _ = time.Parse(time.RFC3339, u)
		out = append(out, &b)
	}
	return out, rows.Err()
}

func (r *BehaviorsRepo) Get(ctx context.Context, id behavior.BehaviorID) (*behavior.Behavior, error) {
	row := r.db.QueryRowContext(ctx, `SELECT id, skill_id, name, description, created_at, updated_at FROM behaviors WHERE id=?`, id)
	var b behavior.Behavior
	var c, u string
	if err := row.Scan(&b.ID, &b.SkillID, &b.Name, &b.Description, &c, &u); err != nil {
		return nil, err
	}
	b.CreatedAt, _ = time.Parse(time.RFC3339, c)
	b.UpdatedAt, _ = time.Parse(time.RFC3339, u)
	return &b, nil
}
