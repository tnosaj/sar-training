package skill

import "time"

type SkillID int64

type Skill struct {
	ID          SkillID
	Name        string
	Description *string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
