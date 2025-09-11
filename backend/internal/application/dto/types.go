package dto

type Skill struct {
	ID          int64   `json:"id"`
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
	CreatedAt   string  `json:"created_at"`
	UpdatedAt   string  `json:"updated_at"`
}

type Behavior struct {
	ID          int64   `json:"id"`
	SkillID     int64   `json:"skill_id"`
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
	CreatedAt   string  `json:"created_at"`
	UpdatedAt   string  `json:"updated_at"`
}

type Exercise struct {
	ID          int64   `json:"id"`
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
	CreatedAt   string  `json:"created_at"`
	UpdatedAt   string  `json:"updated_at"`
}

type Dog struct {
	ID        int64   `json:"id"`
	Name      string  `json:"name"`
	Callname  *string `json:"callname,omitempty"`
	Birthdate *string `json:"birthdate,omitempty"`
}

type Session struct {
	ID        int64   `json:"id"`
	StartedAt string  `json:"started_at"`
	EndedAt   *string `json:"ended_at"`
	Location  *string `json:"location,omitempty"`
	Notes     *string `json:"notes,omitempty"`
}

type Round struct {
	ID                  int64   `json:"id"`
	SessionID           int64   `json:"session_id"`
	RoundNumber         int64   `json:"round_number"`
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

type User struct {
	ID           int64  `json:"id"`
	Email        string `json:"email"`
	PasswordHash string `json:"-"`
	IsAdmin      bool   `json:"is_admin"`
	CreatedAt    string `json:"created_at"`
}
