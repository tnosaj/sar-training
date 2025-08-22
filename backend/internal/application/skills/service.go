package skills

import (
	"context"
	"time"

	"github.com/tnosaj/sar-training/backend/internal/application/dto"
	"github.com/tnosaj/sar-training/backend/internal/domain/common"
	"github.com/tnosaj/sar-training/backend/internal/domain/skill"
)

type Service struct { repo skill.Repository }

func NewService(r skill.Repository) *Service { return &Service{repo: r} }

func (s *Service) Create(ctx context.Context, cmd CreateSkillCommand) (*dto.Skill, error) {
	if cmd.Name == "" { return nil, common.ErrValidation }
	exists, err := s.repo.ExistsByName(ctx, cmd.Name)
	if err != nil { return nil, err }
	if exists { return nil, common.ErrConflict }
	now := time.Now().UTC()
	ent := &skill.Skill{Name: cmd.Name, Description: cmd.Description, CreatedAt: now, UpdatedAt: now}
	if err := s.repo.Create(ctx, ent); err != nil { return nil, err }
	return toDTO(ent), nil
}

func (s *Service) List(ctx context.Context, _ ListSkillsQuery) ([]*dto.Skill, error) {
	items, err := s.repo.List(ctx); if err != nil { return nil, err }
	out := make([]*dto.Skill, 0, len(items))
	for _, it := range items { out = append(out, toDTO(it)) }
	return out, nil
}

func (s *Service) Update(ctx context.Context, cmd UpdateSkillCommand) (*dto.Skill, error) {
	if cmd.ID <= 0 || cmd.Name == "" { return nil, common.ErrValidation }
	ent, err := s.repo.Get(ctx, skill.SkillID(cmd.ID))
	if err != nil { return nil, err }
	ent.Name = cmd.Name
	ent.Description = cmd.Description
	ent.UpdatedAt = time.Now().UTC()
	if err := s.repo.Update(ctx, ent); err != nil { return nil, err }
	return toDTO(ent), nil
}

func (s *Service) Delete(ctx context.Context, id int64) error {
	return s.repo.Delete(ctx, skill.SkillID(id))
}

func toDTO(skl *skill.Skill) *dto.Skill {
	return &dto.Skill{
		ID: int64(skl.ID), Name: skl.Name,
		Description: skl.Description,
		CreatedAt: skl.CreatedAt.Format(time.RFC3339),
		UpdatedAt: skl.UpdatedAt.Format(time.RFC3339),
	}
}
