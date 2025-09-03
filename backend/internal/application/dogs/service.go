package dogs

import (
	"context"

	"github.com/tnosaj/sar-training/backend/internal/application/dto"
	"github.com/tnosaj/sar-training/backend/internal/domain/common"
	"github.com/tnosaj/sar-training/backend/internal/domain/dog"
	logx "github.com/tnosaj/sar-training/backend/internal/infra/log"
)

type Service struct{ repo dog.Repository }

func NewService(r dog.Repository) *Service {
	logx.Std.Trace("starting dogs service")
	return &Service{repo: r}
}

func (s *Service) Create(ctx context.Context, cmd CreateDogCommand) (*dto.Dog, error) {
	logx.Std.Tracef("create dog %v", cmd)
	if cmd.Name == "" {
		return nil, common.ErrValidation
	}
	d := &dog.Dog{Name: cmd.Name, Callname: cmd.Callname, Birthdate: cmd.Birthdate}
	if err := s.repo.Create(ctx, d); err != nil {
		logx.Std.Errorf("create dog failed: %s", err)
		return nil, err
	}
	return toDTO(d), nil
}

func (s *Service) Update(ctx context.Context, cmd UpdateDogCommand) (*dto.Dog, error) {
	logx.Std.Tracef("update dog %v", cmd)
	if cmd.Name == "" {
		return nil, common.ErrValidation
	}
	d := &dog.Dog{ID: dog.DogID(cmd.ID), Name: cmd.Name, Callname: cmd.Callname, Birthdate: cmd.Birthdate}
	if err := s.repo.Update(ctx, d); err != nil {
		logx.Std.Errorf("update dog failed: %s", err)
		return nil, err
	}
	return toDTO(d), nil
}

func (s *Service) Delete(ctx context.Context, cmd DeleteDogCommand) error {
	logx.Std.Tracef("delete dog %v", cmd)
	if cmd.ID == 0 {
		return common.ErrValidation
	}
	err := s.repo.Delete(ctx, dog.DogID(cmd.ID))
	if err == common.ErrNotFound {
		return err
	}
	if err != nil {
		logx.Std.Errorf("delete dog failed: %s", err)
		return err
	}
	return nil
}

func (s *Service) List(ctx context.Context) ([]*dto.Dog, error) {
	logx.Std.Trace("list dogs")
	items, err := s.repo.List(ctx)
	if err != nil {
		logx.Std.Errorf("list dogs failed: %s", err)
		return nil, err
	}
	out := make([]*dto.Dog, 0, len(items))
	for _, it := range items {
		out = append(out, toDTO(it))
	}
	return out, nil
}

func toDTO(d *dog.Dog) *dto.Dog {
	return &dto.Dog{ID: int64(d.ID), Name: d.Name, Callname: d.Callname, Birthdate: d.Birthdate}
}
