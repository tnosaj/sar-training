package user

type User struct {
	ID           int64
	Email        string
	PasswordHash string
	IsAdmin      bool
	CreatedAt    string
}
