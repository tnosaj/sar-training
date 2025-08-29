package exercise

import "time"

type ExerciseID int64

type Exercise struct {
	ID          ExerciseID
	Name        string
	Description *string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
