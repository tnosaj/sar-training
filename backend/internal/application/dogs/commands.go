package dogs

type CreateDogCommand struct {
	Name      string  `json:"name"`
	Callname  *string `json:"callname,omitempty"`
	Birthdate *string `json:"birthdate,omitempty"`
}

type UpdateDogCommand struct {
	ID        int64
	Name      string  `json:"name"`
	Callname  *string `json:"callname,omitempty"`
	Birthdate *string `json:"birthdate,omitempty"`
}

type DeleteDogCommand struct {
	ID int64
}
