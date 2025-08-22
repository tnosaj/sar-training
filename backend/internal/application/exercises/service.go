package exercises

import (
	"context"
	"time"

	"github.com/tnosaj/sar-training/backend/internal/application/dto"
	"github.com/tnosaj/sar-training/backend/internal/domain/common"
	"github.com/tnosaj/sar-training/backend/internal/domain/exercise"
)

type Service struct { repo exercise.Repository }

func NewService(r exercise.Repository) *Service { return &Service{repo: r} }

func (s *Service) Create(ctx context.Context, cmd CreateExerciseCommand) (*dto.Exercise, error) {
	if cmd.Name == "" { return nil, common.ErrValidation }
	now := time.Now().UTC()
	e := &exercise.Exercise{Name: cmd.Name, Description: cmd.Description, CreatedAt: now, UpdatedAt: now}
	if err := s.repo.Create(ctx, e); err != nil { return nil, err }
	return toDTO(e), nil
}

func (s *Service) List(ctx context.Context) ([]*dto.Exercise, error) {
	items, err := s.repo.List(ctx); if err != nil { return nil, err }
	out := make([]*dto.Exercise, 0, len(items))
	for _, it := range items { out = append(out, toDTO(it)) }
	return out, nil
}

func (s *Service) LinkBehavior(ctx context.Context, cmd LinkCommand) error {
	if cmd.BehaviorID <= 0 || cmd.ExerciseID <= 0 { return common.ErrValidation }
	if cmd.Strength < 1 || cmd.Strength > 5 { return common.ErrValidation }
	return s.repo.LinkBehavior(ctx, cmd.BehaviorID, cmd.ExerciseID, cmd.Strength)
}

func toDTO(e *exercise.Exercise) *dto.Exercise {
	return &dto.Exercise{
		ID: int64(e.ID), Name: e.Name, Description: e.Description,
		CreatedAt: e.CreatedAt.Format(time.RFC3339), UpdatedAt: e.UpdatedAt.Format(time.RFC3339),
	}
}
