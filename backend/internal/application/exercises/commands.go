package exercises

type CreateExerciseCommand struct {
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
}

type UpdateExerciseCommand struct {
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
}
type DeleteExerciseCommand struct {
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
}

type LinkCommand struct {
	BehaviorID int64 `json:"behavior_id"`
	ExerciseID int64 `json:"exercise_id"`
	Strength   int   `json:"strength"`
}
