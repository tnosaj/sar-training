package exercise

import "context"

type Repository interface {
	Create(ctx context.Context, e *Exercise) error
	List(ctx context.Context) ([]*Exercise, error)
	Get(ctx context.Context, id ExerciseID) (*Exercise, error)
	LinkBehavior(ctx context.Context, behaviorID int64, exerciseID int64, strength int) error
}
