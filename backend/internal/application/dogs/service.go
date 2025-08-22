package dogs

import (
	"context"

	"github.com/tnosaj/sar-training/backend/internal/application/dto"
	"github.com/tnosaj/sar-training/backend/internal/domain/common"
	"github.com/tnosaj/sar-training/backend/internal/domain/dog"
)

type Service struct { repo dog.Repository }

func NewService(r dog.Repository) *Service { return &Service{repo: r} }

func (s *Service) Create(ctx context.Context, cmd CreateDogCommand) (*dto.Dog, error) {
	if cmd.Name == "" { return nil, common.ErrValidation }
	d := &dog.Dog{Name: cmd.Name, Callname: cmd.Callname, Birthdate: cmd.Birthdate}
	if err := s.repo.Create(ctx, d); err != nil { return nil, err }
	return toDTO(d), nil
}

func (s *Service) List(ctx context.Context) ([]*dto.Dog, error) {
	items, err := s.repo.List(ctx); if err != nil { return nil, err }
	out := make([]*dto.Dog, 0, len(items))
	for _, it := range items { out = append(out, toDTO(it)) }
	return out, nil
}

func toDTO(d *dog.Dog) *dto.Dog {
	return &dto.Dog{ ID: int64(d.ID), Name: d.Name, Callname: d.Callname, Birthdate: d.Birthdate }
}
