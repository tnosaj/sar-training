package behaviors

import (
	"context"
	"time"

	"github.com/tnosaj/sar-training/backend/internal/application/dto"
	"github.com/tnosaj/sar-training/backend/internal/domain/behavior"
	"github.com/tnosaj/sar-training/backend/internal/domain/common"
	logx "github.com/tnosaj/sar-training/backend/internal/infra/log"
)

type Service struct{ repo behavior.Repository }

func NewService(r behavior.Repository) *Service {
	logx.Std.Trace("starting behavior service")
	return &Service{repo: r}
}

func (s *Service) Create(ctx context.Context, cmd CreateBehaviorCommand) (*dto.Behavior, error) {
	logx.Std.Tracef("create behavior %v", cmd)
	if cmd.SkillID <= 0 || cmd.Name == "" {
		return nil, common.ErrValidation
	}
	now := time.Now().UTC()
	b := &behavior.Behavior{SkillID: cmd.SkillID, Name: cmd.Name, Description: cmd.Description, CreatedAt: now, UpdatedAt: now}
	if err := s.repo.Create(ctx, b); err != nil {
		logx.Std.Errorf("create behavior failed: %s", err)
		return nil, err
	}
	return toDTO(b), nil
}

func (s *Service) Update(ctx context.Context, cmd UpdateBehaviorCommand) (*dto.Behavior, error) {
	logx.Std.Tracef("update behavior %v", cmd)
	if cmd.SkillID <= 0 || cmd.Name == "" {
		return nil, common.ErrValidation
	}
	now := time.Now().UTC()
	b := &behavior.Behavior{SkillID: cmd.SkillID, Name: cmd.Name, Description: cmd.Description, CreatedAt: now, UpdatedAt: now}
	if err := s.repo.Create(ctx, b); err != nil {
		logx.Std.Errorf("update behavior failed: %s", err)
		return nil, err
	}
	return toDTO(b), nil
}

func (s *Service) Delete(ctx context.Context, cmd DeleteBehaviorCommand) (*dto.Behavior, error) {
	logx.Std.Tracef("delete behavior %v", cmd)
	if cmd.SkillID <= 0 || cmd.Name == "" {
		return nil, common.ErrValidation
	}
	now := time.Now().UTC()
	b := &behavior.Behavior{SkillID: cmd.SkillID, Name: cmd.Name, Description: cmd.Description, CreatedAt: now, UpdatedAt: now}
	if err := s.repo.Create(ctx, b); err != nil {
		logx.Std.Errorf("delete behavior failed: %s", err)
		return nil, err
	}
	return toDTO(b), nil
}

func (s *Service) List(ctx context.Context, q ListBehaviorsQuery) ([]*dto.Behavior, error) {
	logx.Std.Tracef("list behavior %v", q)
	items, err := s.repo.List(ctx, q.SkillID)
	if err != nil {
		logx.Std.Errorf("list behaviors failed: %s", err)
		return nil, err
	}
	out := make([]*dto.Behavior, 0, len(items))
	for _, it := range items {
		out = append(out, toDTO(it))
	}
	return out, nil
}

func toDTO(b *behavior.Behavior) *dto.Behavior {
	return &dto.Behavior{
		ID: int64(b.ID), SkillID: b.SkillID, Name: b.Name, Description: b.Description,
		CreatedAt: b.CreatedAt.Format(time.RFC3339), UpdatedAt: b.UpdatedAt.Format(time.RFC3339),
	}
}
