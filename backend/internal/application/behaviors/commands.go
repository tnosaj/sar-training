package behaviors

type CreateBehaviorCommand struct {
	SkillID     int64   `json:"skill_id"`
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
}

type UpdateBehaviorCommand struct {
	SkillID     int64   `json:"skill_id"`
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
}

type DeleteBehaviorCommand struct {
	SkillID     int64   `json:"skill_id"`
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
}

type ListBehaviorsQuery struct {
	SkillID *int64
}
