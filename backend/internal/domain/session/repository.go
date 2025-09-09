package session

import "context"

type Repository interface {
	CreateSession(ctx context.Context, s *Session) error
	UpdateSession(ctx context.Context, s *Session) error
	CloseSession(ctx context.Context, s *Session) error
	ListSessions(ctx context.Context) ([]*Session, error)

	AddDog(ctx context.Context, sessionID int64, dogID int64) error
	ListDogs(ctx context.Context, sessionID int64) ([]struct {
		ID   int64
		Name string
	}, error)

	CreateRound(ctx context.Context, r *Round) error
	ListRounds(ctx context.Context, sessionID int64) ([]*Round, error)
	ListRoundsByDog(ctx context.Context, dogID int64) ([]*Round, error)
}
