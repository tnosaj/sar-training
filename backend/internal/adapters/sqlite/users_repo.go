package sqlite

import (
	"context"
	"database/sql"
	"time"

	"github.com/tnosaj/sar-training/backend/internal/domain/user"
	logx "github.com/tnosaj/sar-training/backend/internal/infra/log"
)

type UsersRepo struct{ db *sql.DB }

func NewUsersRepo(db *sql.DB) *UsersRepo {
	logx.Std.Trace("starting skills repo")
	return &UsersRepo{db: db}
}

func (r *UsersRepo) CreateUser(ctx context.Context, user *user.User) error {
	creationTime := time.Now().UTC().Format(time.RFC3339)
	user.CreatedAt = creationTime
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO users(email, password_hash, is_admin, created_at) VALUES(?, ?, ?, ?)`,
		user.Email, user.PasswordHash, boolToInt(user.IsAdmin), user.CreatedAt)
	if err != nil {
		return err
	}
	row := r.db.QueryRowContext(ctx, `SELECT last_insert_rowid()`)
	return row.Scan(&user.ID)
}
func (r *UsersRepo) GetUserByEmail(ctx context.Context, email string) (*user.User, error) {
	row := r.db.QueryRowContext(ctx, `SELECT id, email, password_hash, is_admin, created_at FROM users WHERE email=?`, email)
	var user user.User
	var admin int
	var created string
	err := row.Scan(&user.ID, &user.Email, &user.PasswordHash, &admin, &created)
	if err != nil {
		return nil, err
	}
	user.IsAdmin = admin == 1
	if t, err := time.Parse(time.RFC3339, created); err == nil {
		user.CreatedAt = t.String()
	}
	return &user, nil
}
func (r *UsersRepo) GetUserByID(ctx context.Context, id int64) (*user.User, error) {
	row := r.db.QueryRowContext(ctx, `SELECT id, email, password_hash, is_admin, created_at FROM users WHERE id=?`, id)
	var user user.User
	var admin int
	var created string
	if err := row.Scan(&user.ID, &user.Email, &user.PasswordHash, &admin, &created); err != nil {
		return nil, err
	}
	user.IsAdmin = admin == 1
	if t, err := time.Parse(time.RFC3339, created); err == nil {
		user.CreatedAt = t.String()
	}
	return &user, nil
}

func (r *UsersRepo) ListUsers(ctx context.Context) ([]*user.User, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT id, email, password_hash, is_admin, created_at FROM users`)
	if err != nil {
		logx.Std.Errorf("error in list users query: %s", err)
		return nil, err
	}
	defer rows.Close()
	var out []*user.User
	for rows.Next() {
		var user user.User
		var admin int
		var created string
		if err := rows.Scan(&user.ID, &user.Email, &user.PasswordHash, &admin, &created); err != nil {
			return nil, err
		}
		user.IsAdmin = admin == 1
		if t, err := time.Parse(time.RFC3339, created); err == nil {
			user.CreatedAt = t.String()
		}
		out = append(out, &user)
	}
	return out, nil
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}
