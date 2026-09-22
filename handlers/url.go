package handlers

import (
	"encoding/json"
	"math/rand"
	"net/http"
	"net/url"
	"strings"

	"quicklink/storage"
)

type URLHandler struct {
	store *storage.MemoryStore
}

type shortenRequest struct {
	LongURL string `json:"longUrl"`
	Alias   string `json:"alias"`
}

type shortenResponse struct {
	ShortURL string `json:"shortUrl"`
	Code     string `json:"code"`
}

func NewURLHandler(store *storage.MemoryStore) *URLHandler {
	return &URLHandler{store: store}
}

func (h *URLHandler) Shorten(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req shortenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	req.LongURL = strings.TrimSpace(req.LongURL)
	req.Alias = strings.TrimSpace(req.Alias)

	if !validURL(req.LongURL) {
		writeError(w, "Enter a valid http:// or https:// URL", http.StatusBadRequest)
		return
	}

	if req.Alias != "" && len(req.Alias) < 5 {
		writeError(w, "Alias must be at least 5 characters", http.StatusBadRequest)
		return
	}

	if req.Alias != "" && strings.ContainsAny(req.Alias, " /?#") {
		writeError(w, "Alias cannot contain spaces or / ? #", http.StatusBadRequest)
		return
	}

	code := req.Alias
	if code == "" {
		code = h.newCode()
	}

	if !h.store.Save(code, req.LongURL) {
		writeError(w, "Alias already exists", http.StatusConflict)
		return
	}

	scheme := "http"
	if r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https" {
		scheme = "https"
	}

	writeJSON(w, shortenResponse{
		ShortURL: scheme + "://" + r.Host + "/" + code,
		Code:     code,
	}, http.StatusCreated)
}

func (h *URLHandler) Redirect(w http.ResponseWriter, r *http.Request) {
	code := strings.TrimPrefix(r.URL.Path, "/")
	if code == "" || strings.Contains(code, "/") {
		http.NotFound(w, r)
		return
	}

	longURL, exists := h.store.Get(code)
	if !exists {
		http.NotFound(w, r)
		return
	}

	http.Redirect(w, r, longURL, http.StatusFound)
}

func (h *URLHandler) newCode() string {
	const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

	for {
		code := make([]byte, 6)
		for i := range code {
			code[i] = chars[rand.Intn(len(chars))]
		}

		value := string(code)
		if _, exists := h.store.Get(value); !exists {
			return value
		}
	}
}

func validURL(value string) bool {
	u, err := url.ParseRequestURI(value)
	if err != nil || u.Host == "" {
		return false
	}

	return u.Scheme == "http" || u.Scheme == "https"
}

func writeJSON(w http.ResponseWriter, data any, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, message string, status int) {
	writeJSON(w, map[string]string{"error": message}, status)
}
