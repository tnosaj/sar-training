package behavior

import "time"

type BehaviorID int64

type Behavior struct {
	ID          BehaviorID
	SkillID     int64
	Name        string
	Description *string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
