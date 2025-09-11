package usersgo

type CreateUserCommand struct {
	Email        string `json:"email"`
	PasswordHash string `json:"-"`
	IsAdmin      bool   `json:"is_admin"`
}

type GetUserByEmailCommand struct {
	Email string `json:"email"`
}

type GetUserByIDCommand struct {
	ID int64 `json:"id"`
}
