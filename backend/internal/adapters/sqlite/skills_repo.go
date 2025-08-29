package sqlite

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/tnosaj/sar-training/backend/internal/domain/common"
	"github.com/tnosaj/sar-training/backend/internal/domain/skill"
)

type SkillsRepo struct { db *sql.DB }
func NewSkillsRepo(db *sql.DB) *SkillsRepo { return &SkillsRepo{db: db} }

func (r *SkillsRepo) Create(ctx context.Context, s *skill.Skill) error {
	res, err := r.db.ExecContext(ctx, `INSERT INTO skills (name, description, created_at, updated_at) VALUES (?, ?, ?, ?)`,
		s.Name, s.Description, s.CreatedAt.Format(time.RFC3339), s.UpdatedAt.Format(time.RFC3339))
	if err != nil { return err }
	id, _ := res.LastInsertId()
	s.ID = skill.SkillID(id)
	return nil
}

func (r *SkillsRepo) Get(ctx context.Context, id skill.SkillID) (*skill.Skill, error) {
	row := r.db.QueryRowContext(ctx, `SELECT id, name, description, created_at, updated_at FROM skills WHERE id=?`, id)
	var out skill.Skill
	var c,u string
	if err := row.Scan(&out.ID, &out.Name, &out.Description, &c, &u); err != nil {
		if errors.Is(err, sql.ErrNoRows) { return nil, common.ErrNotFound }
		return nil, err
	}
	out.CreatedAt, _ = time.Parse(time.RFC3339, c)
	out.UpdatedAt, _ = time.Parse(time.RFC3339, u)
	return &out, nil
}

func (r *SkillsRepo) List(ctx context.Context) ([]*skill.Skill, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT id, name, description, created_at, updated_at FROM skills ORDER BY id DESC`)
	if err != nil { return nil, err }
	defer rows.Close()
	var out []*skill.Skill
	for rows.Next() {
		var s skill.Skill
		var c,u string
		if err := rows.Scan(&s.ID, &s.Name, &s.Description, &c, &u); err != nil { return nil, err }
		s.CreatedAt, _ = time.Parse(time.RFC3339, c)
		s.UpdatedAt, _ = time.Parse(time.RFC3339, u)
		out = append(out, &s)
	}
	return out, rows.Err()
}

func (r *SkillsRepo) Update(ctx context.Context, s *skill.Skill) error {
	_, err := r.db.ExecContext(ctx, `UPDATE skills SET name=?, description=?, updated_at=? WHERE id=?`,
		s.Name, s.Description, s.UpdatedAt.Format(time.RFC3339), s.ID)
	return err
}

func (r *SkillsRepo) Delete(ctx context.Context, id skill.SkillID) error {
	res, err := r.db.ExecContext(ctx, `DELETE FROM skills WHERE id=?`, id)
	if err != nil { return err }
	a, _ := res.RowsAffected()
	if a == 0 { return common.ErrNotFound }
	return nil
}

func (r *SkillsRepo) ExistsByName(ctx context.Context, name string) (bool, error) {
	row := r.db.QueryRowContext(ctx, `SELECT 1 FROM skills WHERE name=? LIMIT 1`, name)
	var one int
	if err := row.Scan(&one); err != nil {
		if errors.Is(err, sql.ErrNoRows) { return false, nil }
		return false, err
	}
	return true, nil
}
