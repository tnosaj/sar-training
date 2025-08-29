package sqlite

import (
	"embed"
	"fmt"
	"io/fs"
)

//go:embed migrations/*.sql
var migrationFS embed.FS

func ApplyMigrations(db *DB) error {
	entries, err := fs.ReadDir(migrationFS, "migrations")
	if err != nil { return err }
	for _, e := range entries {
		if e.IsDir() { continue }
		b, err := migrationFS.ReadFile("migrations/" + e.Name())
		if err != nil { return err }
		if _, err := db.Exec(string(b)); err != nil { return fmt.Errorf("migration %s: %w", e.Name(), err) }
	}
	return nil
}
