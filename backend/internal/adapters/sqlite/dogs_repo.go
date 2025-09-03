package sqlite

import (
	"context"
	"database/sql"

	"github.com/tnosaj/sar-training/backend/internal/domain/common"
	"github.com/tnosaj/sar-training/backend/internal/domain/dog"
	logx "github.com/tnosaj/sar-training/backend/internal/infra/log"
)

type DogsRepo struct{ db *sql.DB }

func NewDogsRepo(db *sql.DB) *DogsRepo {
	logx.Std.Trace("starting dogs repo")
	return &DogsRepo{db: db}
}

func (r *DogsRepo) Create(ctx context.Context, d *dog.Dog) error {
	res, err := r.db.ExecContext(ctx, `INSERT INTO dogs (name, callname, birthdate) VALUES (?, ?, ?)`, d.Name, d.Callname, d.Birthdate)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	d.ID = dog.DogID(id)
	return nil
}

func (r *DogsRepo) Update(ctx context.Context, d *dog.Dog) error {
	_, err := r.db.ExecContext(ctx, `UPDATE dogs set name=?, callname=?, birthdate=? WHERE id=?`, d.Name, *d.Callname, *d.Birthdate, d.ID)
	return err
}

func (r *DogsRepo) Delete(ctx context.Context, id dog.DogID) error {
	res, err := r.db.ExecContext(ctx, `DELETE from dogs WHERE id=?`, id)
	rows, _ := res.RowsAffected()
	if rows == 0 {
		return common.ErrNotFound
	}
	return err
}

func (r *DogsRepo) List(ctx context.Context) ([]*dog.Dog, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT id, name, callname, birthdate FROM dogs ORDER BY id DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*dog.Dog
	for rows.Next() {
		var d dog.Dog
		if err := rows.Scan(&d.ID, &d.Name, &d.Callname, &d.Birthdate); err != nil {
			return nil, err
		}
		out = append(out, &d)
	}
	return out, rows.Err()
}

func (r *DogsRepo) Get(ctx context.Context, id dog.DogID) (*dog.Dog, error) {
	row := r.db.QueryRowContext(ctx, `SELECT id, name, callname, birthdate FROM dogs WHERE id=?`, id)
	var d dog.Dog
	if err := row.Scan(&d.ID, &d.Name, &d.Callname, &d.Birthdate); err != nil {
		return nil, err
	}
	return &d, nil
}
