package httpapi

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/tnosaj/sar-training/backend/internal/application/sessions"
	"github.com/tnosaj/sar-training/backend/internal/domain/common"
)

type SessionsHandler struct { svc *sessions.Service }
func NewSessionsHandler(s *sessions.Service) *SessionsHandler { return &SessionsHandler{svc: s} }

func (h *SessionsHandler) List(w http.ResponseWriter, r *http.Request) {
	items, err := h.svc.List(r.Context())
	if err != nil { writeError(w, 500, err.Error()); return }
	writeJSON(w, 200, items)
}

func (h *SessionsHandler) Create(w http.ResponseWriter, r *http.Request) {
	var cmd sessions.CreateSessionCommand
	if err := json.NewDecoder(r.Body).Decode(&cmd); err != nil { writeError(w, 400, "invalid json"); return }
	res, err := h.svc.Create(r.Context(), cmd)
	if err != nil { writeError(w, 500, err.Error()); return }
	writeJSON(w, 201, res)
}

func (h *SessionsHandler) ListDogs(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	items, err := h.svc.ListDogs(r.Context(), id)
	if err != nil { writeError(w, 500, err.Error()); return }
	writeJSON(w, 200, items)
}

func (h *SessionsHandler) AddDog(w http.ResponseWriter, r *http.Request) {
	sid, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	var cmd sessions.AddDogCommand
	if err := json.NewDecoder(r.Body).Decode(&cmd); err != nil { writeError(w, 400, "invalid json"); return }
	cmd.SessionID = sid
	if err := h.svc.AddDog(r.Context(), cmd); err != nil {
		if err == common.ErrValidation { writeError(w, 400, "invalid input"); return }
		writeError(w, 500, err.Error()); return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

func (h *SessionsHandler) ListRounds(w http.ResponseWriter, r *http.Request) {
	sid, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	items, err := h.svc.ListRounds(r.Context(), sid)
	if err != nil { writeError(w, 500, err.Error()); return }
	writeJSON(w, 200, items)
}

func (h *SessionsHandler) CreateRound(w http.ResponseWriter, r *http.Request) {
	sid, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	var cmd sessions.CreateRoundCommand
	if err := json.NewDecoder(r.Body).Decode(&cmd); err != nil { writeError(w, 400, "invalid json"); return }
	cmd.SessionID = sid
	res, err := h.svc.CreateRound(r.Context(), cmd)
	if err != nil {
		if err == common.ErrValidation { writeError(w, 400, "invalid input"); return }
		writeError(w, 500, err.Error()); return
	}
	writeJSON(w, 201, res)
}
