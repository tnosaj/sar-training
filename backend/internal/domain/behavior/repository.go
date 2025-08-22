package behavior

import "context"

type Repository interface {
	Create(ctx context.Context, b *Behavior) error
	List(ctx context.Context, skillID *int64) ([]*Behavior, error)
	Get(ctx context.Context, id BehaviorID) (*Behavior, error)
}
