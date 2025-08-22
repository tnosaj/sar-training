package main

import (
	"context"
	"net/http"
	"time"

	"github.com/tnosaj/sar-training/backend/internal/adapters/httpapi"
	"github.com/tnosaj/sar-training/backend/internal/adapters/sqlite"
	"github.com/tnosaj/sar-training/backend/internal/application/behaviors"
	"github.com/tnosaj/sar-training/backend/internal/application/dogs"
	"github.com/tnosaj/sar-training/backend/internal/application/exercises"
	"github.com/tnosaj/sar-training/backend/internal/application/sessions"
	"github.com/tnosaj/sar-training/backend/internal/application/skills"
	"github.com/tnosaj/sar-training/backend/internal/infra/config"
	logx "github.com/tnosaj/sar-training/backend/internal/infra/log"
)

func main() {
	cfg := config.Load()

	db, err := sqlite.Open(cfg.DBPath)
	if err != nil { panic(err) }
	defer db.Close()
	if err := sqlite.ApplyMigrations(db); err != nil { panic(err) }

	// repos
	skRepo := sqlite.NewSkillsRepo(db.DB)
	bhRepo := sqlite.NewBehaviorsRepo(db.DB)
	exRepo := sqlite.NewExercisesRepo(db.DB)
	dgRepo := sqlite.NewDogsRepo(db.DB)
	snRepo := sqlite.NewSessionsRepo(db.DB)

	// services
	skSvc := skills.NewService(skRepo)
	bhSvc := behaviors.NewService(bhRepo)
	exSvc := exercises.NewService(exRepo)
	dgSvc := dogs.NewService(dgRepo)
	snSvc := sessions.NewService(snRepo)

	// handlers
	skH := httpapi.NewSkillsHandler(skSvc)
	bhH := httpapi.NewBehaviorsHandler(bhSvc)
	exH := httpapi.NewExercisesHandler(exSvc)
	dgH := httpapi.NewDogsHandler(dgSvc)
	snH := httpapi.NewSessionsHandler(snSvc)

	r := httpapi.NewRouter(health(db), skH, bhH, exH, dgH, snH)

	addr := ":" + cfg.Port
	logx.Std.Printf("listening on %s", addr)
	if err := http.ListenAndServe(addr, r); err != nil && err != http.ErrServerClosed {
		panic(err)
	}
}

func health(db *sqlite.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), time.Second)
		defer cancel()
		if err := db.PingContext(ctx); err != nil {
			http.Error(w, "unhealthy", http.StatusServiceUnavailable)
			return
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"ok":true}`))
	}
}
