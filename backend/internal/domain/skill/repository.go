package skill

import "context"

type Repository interface {
	Create(ctx context.Context, s *Skill) error
	Get(ctx context.Context, id SkillID) (*Skill, error)
	List(ctx context.Context) ([]*Skill, error)
	Update(ctx context.Context, s *Skill) error
	Delete(ctx context.Context, id SkillID) error
	ExistsByName(ctx context.Context, name string) (bool, error)
}
