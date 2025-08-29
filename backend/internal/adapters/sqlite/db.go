package sqlite

import (
	"context"
	"database/sql"
	_ "github.com/mattn/go-sqlite3"
)

type DB struct { *sql.DB }

func Open(path string) (*DB, error) {
	dsn := path + "?_busy_timeout=5000&_fk=1"
	sdb, err := sql.Open("sqlite3", dsn)
	if err != nil { return nil, err }
	if _, err := sdb.Exec(`PRAGMA foreign_keys = ON;`); err != nil { return nil, err }
	return &DB{DB: sdb}, nil
}

func (db *DB) PingContext(ctx context.Context) error { return db.DB.PingContext(ctx) }
