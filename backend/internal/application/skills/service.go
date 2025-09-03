package skills

import (
	"context"
	"time"

	"github.com/tnosaj/sar-training/backend/internal/application/dto"
	"github.com/tnosaj/sar-training/backend/internal/domain/common"
	"github.com/tnosaj/sar-training/backend/internal/domain/skill"
	logx "github.com/tnosaj/sar-training/backend/internal/infra/log"
)

type Service struct{ repo skill.Repository }

func NewService(r skill.Repository) *Service {
	logx.Std.Trace("starting skills service")
	return &Service{repo: r}
}

func (s *Service) Create(ctx context.Context, cmd CreateSkillCommand) (*dto.Skill, error) {
	logx.Std.Tracef("create skill %v", cmd)
	if cmd.Name == "" {
		return nil, common.ErrValidation
	}
	exists, err := s.repo.ExistsByName(ctx, cmd.Name)
	if err != nil {
		logx.Std.Errorf("get skill failed: %s", err)
		return nil, err
	}
	if exists {
		return nil, common.ErrConflict
	}
	now := time.Now().UTC()
	ent := &skill.Skill{Name: cmd.Name, Description: cmd.Description, CreatedAt: now, UpdatedAt: now}
	if err := s.repo.Create(ctx, ent); err != nil {
		logx.Std.Errorf("create skill failed: %s", err)
		return nil, err
	}
	return toDTO(ent), nil
}

func (s *Service) List(ctx context.Context, _ ListSkillsQuery) ([]*dto.Skill, error) {
	logx.Std.Trace("list skills")
	items, err := s.repo.List(ctx)
	if err != nil {
		logx.Std.Errorf("list skill failed: %s", err)
		return nil, err
	}
	out := make([]*dto.Skill, 0, len(items))
	for _, it := range items {
		out = append(out, toDTO(it))
	}
	return out, nil
}

func (s *Service) Update(ctx context.Context, cmd UpdateSkillCommand) (*dto.Skill, error) {
	logx.Std.Tracef("update skill %v", cmd)
	if cmd.ID <= 0 || cmd.Name == "" {
		return nil, common.ErrValidation
	}
	ent, err := s.repo.Get(ctx, skill.SkillID(cmd.ID))
	if err != nil {
		logx.Std.Errorf("get skill failed: %s", err)
		return nil, err
	}
	ent.Name = cmd.Name
	ent.Description = cmd.Description
	ent.UpdatedAt = time.Now().UTC()
	if err := s.repo.Update(ctx, ent); err != nil {
		logx.Std.Errorf("update skill failed: %s", err)
		return nil, err
	}
	return toDTO(ent), nil
}

func (s *Service) Delete(ctx context.Context, id int64) error {
	logx.Std.Tracef("delete skill %d", id)
	err := s.repo.Delete(ctx, skill.SkillID(id))
	if err != nil {
		logx.Std.Errorf("delete skill failed: %s", err)
	}
	return err
}

func toDTO(skl *skill.Skill) *dto.Skill {
	return &dto.Skill{
		ID: int64(skl.ID), Name: skl.Name,
		Description: skl.Description,
		CreatedAt:   skl.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   skl.UpdatedAt.Format(time.RFC3339),
	}
}
