package httpapi

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/tnosaj/sar-training/backend/internal/application/dogs"
	"github.com/tnosaj/sar-training/backend/internal/domain/common"
	logx "github.com/tnosaj/sar-training/backend/internal/infra/log"
)

type DogsHandler struct{ svc *dogs.Service }

func NewDogsHandler(s *dogs.Service) *DogsHandler {
	logx.Std.Trace("starting dogs handler")
	return &DogsHandler{svc: s}
}

func (h *DogsHandler) List(w http.ResponseWriter, r *http.Request) {
	items, err := h.svc.List(r.Context())
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, items)
}

func (h *DogsHandler) Create(w http.ResponseWriter, r *http.Request) {
	var cmd dogs.CreateDogCommand
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

func (h *DogsHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	var cmd dogs.UpdateDogCommand
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

func (h *DogsHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	var cmd dogs.DeleteDogCommand
	cmd.ID = id
	err := h.svc.Delete(r.Context(), cmd)
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
	writeJSON(w, 200, "ok")
}
