package httpapi

import (
	"net/http"

	"github.com/go-chi/chi/middleware"
	"github.com/go-chi/chi/v5"
)

func NewRouter(
	health http.HandlerFunc,
	skills *SkillsHandler,
	behaviors *BehaviorsHandler,
	exercises *ExercisesHandler,
	dogs *DogsHandler,
	sessions *SessionsHandler,
	users *UsersHandler,
) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.Recoverer)
	r.Use(middleware.StripSlashes)
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
			w.Header().Set("Content-Type", "application/json")
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
	r.Post("/auth/register", users.handleRegister) // keep or remove after seeding
	r.Post("/auth/login", users.handleLogin)
	r.Post("/auth/logout", users.handleLogout)
	r.Get("/auth/me", users.handleMe)

	r.Group(func(protected chi.Router) {
		protected.Use(users.authRequired)

		protected.Route("/skills", func(r chi.Router) {
			r.Get("/", skills.List)
			r.Post("/", skills.Create)
			r.Put("/{id}", skills.Update)
			r.Delete("/{id}", skills.Delete)
		})

		protected.Route("/behaviors", func(r chi.Router) {
			r.Get("/", behaviors.List)
			r.Post("/", behaviors.Create)
		})

		protected.Route("/exercises", func(r chi.Router) {
			r.Get("/", exercises.List)
			r.Post("/", exercises.Create)
		})
		protected.Route("/behavior-exercises", func(r chi.Router) {
			r.Post("/", exercises.LinkBehaviorExercise)
		})

		protected.Route("/dogs", func(r chi.Router) {
			r.Get("/", dogs.List)
			r.Post("/", dogs.Create)
			r.Put("/{id}", dogs.Update)
			r.Delete("/{id}", dogs.Delete)
			// rounds across sessions for a dog
			r.Get("/{id}/rounds", sessions.ListRoundsByDog)
		})

		protected.Route("/sessions", func(r chi.Router) {
			r.Get("/", sessions.List)
			r.Post("/", sessions.Create)
			r.Put("/{id}", sessions.Update)
			r.Patch("/{id}", sessions.Close)
			r.Get("/{id}/dogs", sessions.ListDogs)
			r.Post("/{id}/dogs", sessions.AddDog)
			r.Get("/{id}/rounds", sessions.ListRounds)
			r.Post("/{id}/rounds", sessions.CreateRound)
		})
	})

	return r
}
