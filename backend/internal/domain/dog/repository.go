package dog

import "context"

type Repository interface {
	Create(ctx context.Context, d *Dog) error
	List(ctx context.Context) ([]*Dog, error)
	Get(ctx context.Context, id DogID) (*Dog, error)
}
