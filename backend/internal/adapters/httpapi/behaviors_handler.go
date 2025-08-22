package httpapi

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/tnosaj/sar-training/backend/internal/application/behaviors"
)

type BehaviorsHandler struct { svc *behaviors.Service }
func NewBehaviorsHandler(s *behaviors.Service) *BehaviorsHandler { return &BehaviorsHandler{svc: s} }

func (h *BehaviorsHandler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("skill_id")
	var sid *int64
	if q != "" {
		v, _ := strconv.ParseInt(q, 10, 64)
		sid = &v
	}
	items, err := h.svc.List(r.Context(), behaviors.ListBehaviorsQuery{SkillID: sid})
	if err != nil { writeError(w, 500, err.Error()); return }
	writeJSON(w, 200, items)
}

func (h *BehaviorsHandler) Create(w http.ResponseWriter, r *http.Request) {
	var cmd behaviors.CreateBehaviorCommand
	if err := json.NewDecoder(r.Body).Decode(&cmd); err != nil { writeError(w, 400, "invalid json"); return }
	res, err := h.svc.Create(r.Context(), cmd)
	if err != nil { writeError(w, 400, err.Error()); return }
	writeJSON(w, 201, res)
}
