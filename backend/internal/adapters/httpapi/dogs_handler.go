package httpapi

import (
	"encoding/json"
	"net/http"

	"github.com/tnosaj/sar-training/backend/internal/application/dogs"
	"github.com/tnosaj/sar-training/backend/internal/domain/common"
)

type DogsHandler struct { svc *dogs.Service }
func NewDogsHandler(s *dogs.Service) *DogsHandler { return &DogsHandler{svc: s} }

func (h *DogsHandler) List(w http.ResponseWriter, r *http.Request) {
	items, err := h.svc.List(r.Context())
	if err != nil { writeError(w, 500, err.Error()); return }
	writeJSON(w, 200, items)
}

func (h *DogsHandler) Create(w http.ResponseWriter, r *http.Request) {
	var cmd dogs.CreateDogCommand
	if err := json.NewDecoder(r.Body).Decode(&cmd); err != nil { writeError(w, 400, "invalid json"); return }
	res, err := h.svc.Create(r.Context(), cmd)
	if err != nil {
		if err == common.ErrValidation { writeError(w, 400, "missing name"); return }
		writeError(w, 500, err.Error()); return
	}
	writeJSON(w, 201, res)
}
