package httpapi

import (
	"encoding/json"
	"net/http"

	"github.com/tnosaj/sar-training/backend/internal/application/exercises"
	"github.com/tnosaj/sar-training/backend/internal/domain/common"
	logx "github.com/tnosaj/sar-training/backend/internal/infra/log"
)

type ExercisesHandler struct{ svc *exercises.Service }

func NewExercisesHandler(s *exercises.Service) *ExercisesHandler {
	logx.Std.Trace("starting exercise handler")
	return &ExercisesHandler{svc: s}
}

func (h *ExercisesHandler) List(w http.ResponseWriter, r *http.Request) {
	items, err := h.svc.List(r.Context())
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, items)
}

func (h *ExercisesHandler) Create(w http.ResponseWriter, r *http.Request) {
	var cmd exercises.CreateExerciseCommand
	if err := json.NewDecoder(r.Body).Decode(&cmd); err != nil {
		writeError(w, 400, "invalid json")
		return
	}
	res, err := h.svc.Create(r.Context(), cmd)
	if err != nil {
		if err == common.ErrValidation {
			writeError(w, 400, "missing name")
			return
		}
		writeError(w, 500, err.Error())
		return
	}
	writeJSON(w, 201, res)
}

func (h *ExercisesHandler) LinkBehaviorExercise(w http.ResponseWriter, r *http.Request) {
	var cmd exercises.LinkCommand
	if err := json.NewDecoder(r.Body).Decode(&cmd); err != nil {
		writeError(w, 400, "invalid json")
		return
	}
	if err := h.svc.LinkBehavior(r.Context(), cmd); err != nil {
		writeError(w, 400, err.Error())
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}
