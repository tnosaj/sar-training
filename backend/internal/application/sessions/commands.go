package sessions

type CreateSessionCommand struct {
	Location  *string `json:"location,omitempty"`
	Notes     *string `json:"notes,omitempty"`
	StartedAt *string `json:"started_at,omitempty"`
}

type UpdateSessionCommand struct {
	Location  *string `json:"location,omitempty"`
	Notes     *string `json:"notes,omitempty"`
	StartedAt *string `json:"started_at,omitempty"`
}

type AddDogCommand struct {
	SessionID int64 `json:"-"`
	DogID     int64 `json:"dog_id"`
}

type CreateRoundCommand struct {
	SessionID           int64   `json:"-"`
	DogID               int64   `json:"dog_id"`
	ExerciseID          int64   `json:"exercise_id"`
	PlannedBehaviorID   int64   `json:"planned_behavior_id"`
	ExhibitedBehaviorID *int64  `json:"exhibited_behavior_id,omitempty"`
	ExhibitedFreeText   *string `json:"exhibited_free_text,omitempty"`
	Outcome             string  `json:"outcome"`
	Score               *int    `json:"score,omitempty"`
	Notes               *string `json:"notes,omitempty"`
	StartedAt           *string `json:"started_at,omitempty"`
	EndedAt             *string `json:"ended_at,omitempty"`
}
