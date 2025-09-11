package users

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/tnosaj/sar-training/backend/internal/application/dto"
	"github.com/tnosaj/sar-training/backend/internal/domain/common"
	"github.com/tnosaj/sar-training/backend/internal/domain/user"
	logx "github.com/tnosaj/sar-training/backend/internal/infra/log"
)

type Service struct{ repo user.Repository }

func NewService(r user.Repository) *Service {
	logx.Std.Trace("starting users service")
	return &Service{repo: r}
}

func (s *Service) CreateUser(ctx context.Context, cmd CreateUserCommand) (*dto.User, error) {
	logx.Std.Tracef("create user %v", cmd)
	if cmd.Email == "" || cmd.PasswordHash == "" {
		return nil, common.ErrValidation
	}

	_, err := s.repo.GetUserByEmail(ctx, cmd.Email)
	if !errors.Is(err, sql.ErrNoRows) {
		if err == nil {
			logx.Std.Errorf("user %s exists", cmd.Email)
			return nil, errors.New("user exists")
		}
		logx.Std.Errorf("get user failed: %s", err)
		return nil, err
	}
	ent := &user.User{
		Email:        cmd.Email,
		PasswordHash: cmd.PasswordHash,
		CreatedAt:    time.Now().UTC().GoString(),
	}
	if err := s.repo.CreateUser(ctx, ent); err != nil {
		logx.Std.Errorf("create user failed: %s", err)
		return nil, err
	}
	return toDTO(ent), nil
}

func (s *Service) GetUserByEmail(ctx context.Context, cmd GetUserByEmailCommand) (*dto.User, error) {
	logx.Std.Tracef("create user %v", cmd)
	if cmd.Email == "" {
		return nil, common.ErrValidation
	}
	user, err := s.repo.GetUserByEmail(ctx, cmd.Email)
	if err != nil {
		logx.Std.Errorf("get user failed: %s", err)
		return nil, err
	}
	return toDTO(user), nil
}

func (s *Service) GetUserByID(ctx context.Context, cmd GetUserByIDCommand) (*dto.User, error) {
	logx.Std.Tracef("create user %v", cmd)
	// should do some check to make sure cmd.ID is not empty
	user, err := s.repo.GetUserByID(ctx, cmd.ID)
	if err != nil {
		logx.Std.Errorf("get user failed: %s", err)
		return nil, err
	}
	return toDTO(user), nil
}

func (s *Service) List(ctx context.Context) ([]*dto.User, error) {
	logx.Std.Trace("list users")
	items, err := s.repo.ListUsers(ctx)
	if err != nil {
		logx.Std.Errorf("list user failed: %s", err)
		return nil, err
	}
	out := make([]*dto.User, 0, len(items))
	for _, it := range items {
		out = append(out, toDTO(it))
	}
	return out, nil
}

// func (s *Service) Update(ctx context.Context, cmd UpdateUserCommand) (*dto.User, error) {
// 	logx.Std.Tracef("update user %v", cmd)
// 	if cmd.ID <= 0 || cmd.Name == "" {
// 		return nil, common.ErrValidation
// 	}
// 	ent, err := s.repo.Get(ctx, user.userID(cmd.ID))
// 	if err != nil {
// 		logx.Std.Errorf("get user failed: %s", err)
// 		return nil, err
// 	}
// 	ent.Name = cmd.Name
// 	ent.Description = cmd.Description
// 	ent.UpdatedAt = time.Now().UTC()
// 	if err := s.repo.Update(ctx, ent); err != nil {
// 		logx.Std.Errorf("update user failed: %s", err)
// 		return nil, err
// 	}
// 	return toDTO(ent), nil
// }

func toDTO(usr *user.User) *dto.User {
	return &dto.User{
		ID: int64(usr.ID), Email: usr.Email,
		PasswordHash: usr.PasswordHash,
		CreatedAt:    usr.CreatedAt,
		IsAdmin:      usr.IsAdmin,
	}
}
