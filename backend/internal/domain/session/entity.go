package session

type SessionID int64

type Session struct {
	ID        SessionID
	StartedAt string
	EndedAt   *string
	Location  *string
	Notes     *string
}

type Round struct {
	ID                   int64
	SessionID            int64
	RoundNumber          int64
	DogID                int64
	ExerciseID           int64
	PlannedBehaviorID    int64
	ExhibitedBehaviorID  *int64
	ExhibitedFreeText    *string
	Outcome              string
	Score                *int
	Notes                *string
	StartedAt            *string
	EndedAt              *string
}
