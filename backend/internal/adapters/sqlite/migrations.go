package sqlite

import (
	"embed"
	"fmt"
	"io/fs"

	logx "github.com/tnosaj/sar-training/backend/internal/infra/log"
)

//go:embed migrations/*.sql
var migrationFS embed.FS

func ApplyMigrations(db *DB) error {
	logx.Std.Trace("starting sqlite migrations")
	entries, err := fs.ReadDir(migrationFS, "migrations")
	if err != nil {
		return err
	}
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		b, err := migrationFS.ReadFile("migrations/" + e.Name())
		if err != nil {
			return err
		}
		if _, err := db.Exec(string(b)); err != nil {
			return fmt.Errorf("migration %s: %w", e.Name(), err)
		}
	}
	return nil
}
