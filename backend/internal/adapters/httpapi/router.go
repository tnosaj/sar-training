package httpapi

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

func NewRouter(
	health http.HandlerFunc,
	skills *SkillsHandler,
	behaviors *BehaviorsHandler,
	exercises *ExercisesHandler,
	dogs *DogsHandler,
	sessions *SessionsHandler,
) http.Handler {
	r := chi.NewRouter()

	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
			if req.Method == http.MethodOptions {
				w.WriteHeader(200)
				return
			}
			next.ServeHTTP(w, req)
		})
	})

	r.Get("/health", health)

	r.Route("/skills", func(r chi.Router) {
		r.Get("/", skills.List)
		r.Post("/", skills.Create)
		r.Put("/{id}", skills.Update)
		r.Delete("/{id}", skills.Delete)
	})

	r.Route("/behaviors", func(r chi.Router) {
		r.Get("/", behaviors.List)
		r.Post("/", behaviors.Create)
	})

	r.Route("/exercises", func(r chi.Router) {
		r.Get("/", exercises.List)
		r.Post("/", exercises.Create)
	})
	r.Route("/behavior-exercises", func(r chi.Router) {
		r.Post("/", exercises.LinkBehaviorExercise)
	})

	r.Route("/dogs", func(r chi.Router) {
		r.Get("/", dogs.List)
		r.Post("/", dogs.Create)
		r.Put("/{id}", dogs.Update)
		r.Delete("/{id}", dogs.Delete)
		// rounds across sessions for a dog
		r.Get("/{id}/rounds", sessions.ListRoundsByDog)
	})

	r.Route("/sessions", func(r chi.Router) {
		r.Get("/", sessions.List)
		r.Post("/", sessions.Create)
		r.Get("/{id}/dogs", sessions.ListDogs)
		r.Post("/{id}/dogs", sessions.AddDog)
		r.Get("/{id}/rounds", sessions.ListRounds)
		r.Post("/{id}/rounds", sessions.CreateRound)
	})

	return r
}
