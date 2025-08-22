package sessions

import (
	"context"
	"time"

	"github.com/tnosaj/sar-training/backend/internal/application/dto"
	"github.com/tnosaj/sar-training/backend/internal/domain/common"
	"github.com/tnosaj/sar-training/backend/internal/domain/session"
)

type Service struct { repo session.Repository }

func NewService(r session.Repository) *Service { return &Service{repo: r} }

func (s *Service) Create(ctx context.Context, cmd CreateSessionCommand) (*dto.Session, error) {
	started := cmd.StartedAt
	if started == nil { v := time.Now().UTC().Format(time.RFC3339); started = &v }
	ent := &session.Session{ StartedAt: *started, EndedAt: nil, Location: cmd.Location, Notes: cmd.Notes }
	if err := s.repo.CreateSession(ctx, ent); err != nil { return nil, err }
	return toSessionDTO(ent), nil
}

func (s *Service) List(ctx context.Context) ([]*dto.Session, error) {
	items, err := s.repo.ListSessions(ctx); if err != nil { return nil, err }
	out := make([]*dto.Session, 0, len(items))
	for _, it := range items { out = append(out, toSessionDTO(it)) }
	return out, nil
}

func (s *Service) AddDog(ctx context.Context, cmd AddDogCommand) error {
	if cmd.SessionID <= 0 || cmd.DogID <= 0 { return common.ErrValidation }
	return s.repo.AddDog(ctx, cmd.SessionID, cmd.DogID)
}

func (s *Service) ListDogs(ctx context.Context, sessionID int64) ([]map[string]any, error) {
	rows, err := s.repo.ListDogs(ctx, sessionID); if err != nil { return nil, err }
	out := make([]map[string]any, 0, len(rows))
	for _, r := range rows { out = append(out, map[string]any{"id": r.ID, "name": r.Name}) }
	return out, nil
}

func (s *Service) ListRounds(ctx context.Context, sessionID int64) ([]*dto.Round, error) {
	rows, err := s.repo.ListRounds(ctx, sessionID); if err != nil { return nil, err }
	out := make([]*dto.Round, 0, len(rows))
	for _, r := range rows { out = append(out, toRoundDTO(r)) }
	return out, nil
}

func (s *Service) CreateRound(ctx context.Context, cmd CreateRoundCommand) (*dto.Round, error) {
	if cmd.SessionID <= 0 || cmd.DogID <= 0 || cmd.ExerciseID <= 0 || cmd.PlannedBehaviorID <= 0 { return nil, common.ErrValidation }
	if cmd.Outcome != "success" && cmd.Outcome != "partial" && cmd.Outcome != "fail" { return nil, common.ErrValidation }
	r := &session.Round{
		SessionID: cmd.SessionID, DogID: cmd.DogID, ExerciseID: cmd.ExerciseID,
		PlannedBehaviorID: cmd.PlannedBehaviorID, ExhibitedBehaviorID: cmd.ExhibitedBehaviorID,
		ExhibitedFreeText: cmd.ExhibitedFreeText, Outcome: cmd.Outcome, Score: cmd.Score,
		Notes: cmd.Notes, StartedAt: cmd.StartedAt, EndedAt: cmd.EndedAt,
	}
	if err := s.repo.CreateRound(ctx, r); err != nil { return nil, err }
	return toRoundDTO(r), nil
}

func toSessionDTO(ses *session.Session) *dto.Session {
	return &dto.Session{ ID: int64(ses.ID), StartedAt: ses.StartedAt, EndedAt: ses.EndedAt, Location: ses.Location, Notes: ses.Notes }
}

func toRoundDTO(r *session.Round) *dto.Round {
	return &dto.Round{ ID: r.ID, SessionID: r.SessionID, RoundNumber: r.RoundNumber, DogID: r.DogID, ExerciseID: r.ExerciseID, PlannedBehaviorID: r.PlannedBehaviorID, ExhibitedBehaviorID: r.ExhibitedBehaviorID, ExhibitedFreeText: r.ExhibitedFreeText, Outcome: r.Outcome, Score: r.Score, Notes: r.Notes, StartedAt: r.StartedAt, EndedAt: r.EndedAt }
}
