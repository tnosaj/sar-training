package sessions

import (
	"context"
	"time"

	"github.com/tnosaj/sar-training/backend/internal/application/dto"
	"github.com/tnosaj/sar-training/backend/internal/domain/common"
	"github.com/tnosaj/sar-training/backend/internal/domain/session"
	logx "github.com/tnosaj/sar-training/backend/internal/infra/log"
)

type Service struct{ repo session.Repository }

func NewService(r session.Repository) *Service {
	logx.Std.Trace("starting sessions service")
	return &Service{repo: r}
}

func (s *Service) Create(ctx context.Context, cmd CreateSessionCommand) (*dto.Session, error) {
	logx.Std.Tracef("create session %v", cmd)
	started := cmd.StartedAt
	if started == nil {
		v := time.Now().UTC().Format(time.RFC3339)
		started = &v
	}
	ent := &session.Session{StartedAt: *started, EndedAt: nil, Location: cmd.Location, Notes: cmd.Notes}
	if err := s.repo.CreateSession(ctx, ent); err != nil {
		logx.Std.Errorf("create session failed: %s", err)
		return nil, err
	}
	return toSessionDTO(ent), nil
}

func (s *Service) Update(ctx context.Context, cmd UpdateSessionCommand) (*dto.Session, error) {
	logx.Std.Tracef("update session %v", cmd)
	started := cmd.StartedAt
	if started == nil {
		v := time.Now().UTC().Format(time.RFC3339)
		started = &v
	}
	ent := &session.Session{ID: session.SessionID(cmd.SessionID), StartedAt: *started, EndedAt: cmd.EndedAt, Location: cmd.Location, Notes: cmd.Notes}
	if err := s.repo.UpdateSession(ctx, ent); err != nil {
		logx.Std.Errorf("update session failed: %s", err)
		return nil, err
	}
	return toSessionDTO(ent), nil
}

func (s *Service) Close(ctx context.Context, cmd CloseSessionCommand) (*dto.Session, error) {
	logx.Std.Tracef("close/open session %v", cmd)
	ended := cmd.EndedAt
	if ended == nil {
		v := time.Now().UTC().Format(time.RFC3339)
		ended = &v
	}
	ent := &session.Session{EndedAt: ended, ID: session.SessionID(cmd.SessionID)}
	if err := s.repo.CloseSession(ctx, ent); err != nil {
		logx.Std.Errorf("close session failed: %s", err)
		return nil, err
	}
	return toSessionDTO(ent), nil
}

func (s *Service) List(ctx context.Context) ([]*dto.Session, error) {
	logx.Std.Trace("list session")
	items, err := s.repo.ListSessions(ctx)
	if err != nil {
		logx.Std.Errorf("list sessions failed: %s", err)
		return nil, err
	}
	out := make([]*dto.Session, 0, len(items))
	for _, it := range items {
		out = append(out, toSessionDTO(it))
	}
	return out, nil
}

func (s *Service) AddDog(ctx context.Context, cmd AddDogCommand) error {
	if cmd.SessionID <= 0 || cmd.DogID <= 0 {
		return common.ErrValidation
	}
	err := s.repo.AddDog(ctx, cmd.SessionID, cmd.DogID)
	if err != nil {
		logx.Std.Errorf("add dog failed: %s", err)
	}
	return err
}

func (s *Service) ListDogs(ctx context.Context, sessionID int64) ([]map[string]any, error) {
	logx.Std.Tracef("ListDogs for %d", sessionID)
	rows, err := s.repo.ListDogs(ctx, sessionID)
	if err != nil {
		logx.Std.Errorf("list dogs failed: %s", err)
		return nil, err
	}
	out := make([]map[string]any, 0, len(rows))
	for _, r := range rows {
		out = append(out, map[string]any{"id": r.ID, "name": r.Name})
	}
	return out, nil
}

func (s *Service) ListRounds(ctx context.Context, sessionID int64) ([]*dto.Round, error) {
	logx.Std.Tracef("ListRounds for %d", sessionID)
	rows, err := s.repo.ListRounds(ctx, sessionID)
	if err != nil {
		logx.Std.Errorf("list round failed: %s", err)
		return nil, err
	}
	out := make([]*dto.Round, 0, len(rows))
	for _, r := range rows {
		out = append(out, toRoundDTO(r))
	}
	return out, nil
}

func (s *Service) CreateRound(ctx context.Context, cmd CreateRoundCommand) (*dto.Round, error) {
	logx.Std.Tracef("Create round %v", cmd)
	if cmd.SessionID <= 0 || cmd.DogID <= 0 || cmd.ExerciseID <= 0 || cmd.PlannedBehaviorID <= 0 {
		return nil, common.ErrValidation
	}
	if cmd.Outcome != "success" && cmd.Outcome != "partial" && cmd.Outcome != "fail" {
		return nil, common.ErrValidation
	}
	r := &session.Round{
		SessionID: cmd.SessionID, DogID: cmd.DogID, ExerciseID: cmd.ExerciseID,
		PlannedBehaviorID: cmd.PlannedBehaviorID, ExhibitedBehaviorID: cmd.ExhibitedBehaviorID,
		ExhibitedFreeText: cmd.ExhibitedFreeText, Outcome: cmd.Outcome, Score: cmd.Score,
		Notes: cmd.Notes, StartedAt: cmd.StartedAt, EndedAt: cmd.EndedAt,
	}
	if err := s.repo.CreateRound(ctx, r); err != nil {
		logx.Std.Errorf("create round failed: %s", err)
		return nil, err
	}
	return toRoundDTO(r), nil
}

func toSessionDTO(ses *session.Session) *dto.Session {
	return &dto.Session{ID: int64(ses.ID), StartedAt: ses.StartedAt, EndedAt: ses.EndedAt, Location: ses.Location, Notes: ses.Notes}
}

func toRoundDTO(r *session.Round) *dto.Round {
	return &dto.Round{ID: r.ID, SessionID: r.SessionID, RoundNumber: r.RoundNumber, DogID: r.DogID, ExerciseID: r.ExerciseID, PlannedBehaviorID: r.PlannedBehaviorID, ExhibitedBehaviorID: r.ExhibitedBehaviorID, ExhibitedFreeText: r.ExhibitedFreeText, Outcome: r.Outcome, Score: r.Score, Notes: r.Notes, StartedAt: r.StartedAt, EndedAt: r.EndedAt}
}

func (s *Service) ListRoundsByDog(ctx context.Context, dogID int64) ([]*dto.Round, error) {
	items, err := s.repo.ListRoundsByDog(ctx, dogID)
	if err != nil {
		return nil, err
	}
	out := make([]*dto.Round, 0, len(items))
	for _, r := range items {
		out = append(out, toRoundDTO(r))
	}
	return out, nil
}
