package dog

type DogID int64

type Dog struct {
	ID       DogID
	Name     string
	Callname *string
	Birthdate *string
}
