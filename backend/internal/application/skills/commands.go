package skills

type CreateSkillCommand struct {
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
}
type UpdateSkillCommand struct {
	ID          int64   `json:"id"`
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
}
type ListSkillsQuery struct{}
