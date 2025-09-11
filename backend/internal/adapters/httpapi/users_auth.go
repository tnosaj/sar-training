package httpapi

import (
	"fmt"
	"net/http"
	"time"

	jwt "github.com/golang-jwt/jwt/v5"
)

const authCookieName = "auth"

func (a *UsersHandler) signToken(userID int64, ttl time.Duration) (string, error) {
	claims := jwt.MapClaims{
		"sub": userID,
		"exp": time.Now().Add(ttl).Unix(),
		"iat": time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(a.secret)
}

func (a *UsersHandler) parseToken(t string) (int64, error) {
	tok, err := jwt.Parse(t, func(token *jwt.Token) (interface{}, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, fmt.Errorf("bad alg")
		}
		return a.secret, nil
	})
	if err != nil || !tok.Valid {
		return 0, fmt.Errorf("invalid token")
	}
	claims, ok := tok.Claims.(jwt.MapClaims)
	if !ok {
		return 0, fmt.Errorf("bad claims")
	}
	sub, ok := claims["sub"].(float64)
	if !ok {
		return 0, fmt.Errorf("no sub")
	}
	return int64(sub), nil
}

func setAuthCookie(w http.ResponseWriter, token string, ttl time.Duration) {
	c := &http.Cookie{
		Name:     authCookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   true, // you're behind TLS
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(ttl),
	}
	http.SetCookie(w, c)
}
func clearAuthCookie(w http.ResponseWriter) {
	c := &http.Cookie{Name: authCookieName, Value: "", Path: "/", HttpOnly: true, Secure: true, SameSite: http.SameSiteLaxMode, Expires: time.Unix(0, 0)}
	http.SetCookie(w, c)
}
