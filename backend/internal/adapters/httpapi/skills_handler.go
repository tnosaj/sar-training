package httpapi

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/tnosaj/sar-training/backend/internal/application/skills"
	"github.com/tnosaj/sar-training/backend/internal/domain/common"
	logx "github.com/tnosaj/sar-training/backend/internal/infra/log"
)

type SkillsHandler struct{ svc *skills.Service }

func NewSkillsHandler(s *skills.Service) *SkillsHandler {
	logx.Std.Trace("starting skills handler")
	return &SkillsHandler{svc: s}
}

func (h *SkillsHandler) List(w http.ResponseWriter, r *http.Request) {
	items, err := h.svc.List(r.Context(), skills.ListSkillsQuery{})
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, items)
}

func (h *SkillsHandler) Create(w http.ResponseWriter, r *http.Request) {
	var cmd skills.CreateSkillCommand
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
		if err == common.ErrConflict {
			writeError(w, 409, "name exists")
			return
		}
		writeError(w, 500, err.Error())
		return
	}
	writeJSON(w, 201, res)
}

func (h *SkillsHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	var cmd skills.UpdateSkillCommand
	if err := json.NewDecoder(r.Body).Decode(&cmd); err != nil {
		writeError(w, 400, "invalid json")
		return
	}
	cmd.ID = id
	res, err := h.svc.Update(r.Context(), cmd)
	if err != nil {
		if err == common.ErrValidation {
			writeError(w, 400, "invalid input")
			return
		}
		if err == common.ErrNotFound {
			writeError(w, 404, "not found")
			return
		}
		writeError(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, res)
}

func (h *SkillsHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err := h.svc.Delete(r.Context(), id); err != nil {
		if err == common.ErrNotFound {
			writeError(w, 404, "not found")
			return
		}
		writeError(w, 500, err.Error())
		return
	}
	w.WriteHeader(204)
}
