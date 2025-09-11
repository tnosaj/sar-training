package httpapi

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/tnosaj/sar-training/backend/internal/application/users"
	logx "github.com/tnosaj/sar-training/backend/internal/infra/log"
)

type UsersHandler struct {
	secret []byte
	svc    *users.Service
}

type unauthenticatedUser struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	IsAdmin  bool   `json:"isAdmin,omitempty"`
}

func NewUsersHandler(u *users.Service, secret []byte) *UsersHandler {
	logx.Std.Trace("starting skills handler")
	return &UsersHandler{svc: u, secret: secret}
}

func (a *UsersHandler) handleRegister(w http.ResponseWriter, r *http.Request) {
	var in unauthenticatedUser
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if strings.TrimSpace(in.Email) == "" || len(in.Password) < 8 {
		writeError(w, http.StatusBadRequest, "email and 8+ char password required")
		return
	}
	ph, _ := hashPassword(in.Password)
	cmd := users.CreateUserCommand{Email: strings.ToLower(in.Email), PasswordHash: ph, IsAdmin: in.IsAdmin}
	u, err := a.svc.CreateUser(r.Context(), cmd)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	json.NewEncoder(w).Encode(struct {
		ID    int64
		Email string
	}{u.ID, u.Email})
}

func (a *UsersHandler) handleLogin(w http.ResponseWriter, r *http.Request) {
	var in unauthenticatedUser
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		logx.Std.Errorf("error decoding initial body: %s", err)
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	u, err := a.svc.GetUserByEmail(
		r.Context(),
		users.GetUserByEmailCommand{
			Email: strings.ToLower(in.Email),
		},
	)
	if err != nil || checkPassword(u.PasswordHash, in.Password) != nil {
		logx.Std.Errorf("error checking password: %s", err)
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	tok, _ := a.signToken(u.ID, 7*24*time.Hour) // 7 days
	setAuthCookie(w, tok, 7*24*time.Hour)
	json.NewEncoder(w).Encode(struct {
		ID      int64  `json:"id"`
		Email   string `json:"email"`
		IsAdmin bool   `json:"is_admin"`
	}{u.ID, u.Email, u.IsAdmin})
}

func (a *UsersHandler) handleMe(w http.ResponseWriter, r *http.Request) {
	c, err := r.Cookie(authCookieName)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	uid, err := a.parseToken(c.Value)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	u, err := a.svc.GetUserByID(r.Context(), users.GetUserByIDCommand{ID: uid})
	if err != nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	json.NewEncoder(w).Encode(struct {
		ID      int64  `json:"id"`
		Email   string `json:"email"`
		IsAdmin bool   `json:"is_admin"`
	}{u.ID, u.Email, u.IsAdmin})
}

func (a *UsersHandler) handleLogout(w http.ResponseWriter, r *http.Request) {
	clearAuthCookie(w)
	w.WriteHeader(http.StatusNoContent)
}
