package site

import (
	"crypto/subtle"
	"database/sql"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

const maxArticleRequestBytes = 1 << 20

type articlePayload struct {
	ID      int      `json:"id"`
	Slug    string   `json:"slug"`
	Title   string   `json:"title"`
	Excerpt string   `json:"excerpt"`
	Content string   `json:"content"`
	Tags    []string `json:"tags"`
	Author  string   `json:"author"`
}

type articleResponse struct {
	ID          int        `json:"id"`
	Slug        string     `json:"slug"`
	Title       string     `json:"title"`
	Excerpt     string     `json:"excerpt"`
	Content     string     `json:"content,omitempty"`
	Tags        []string   `json:"tags"`
	Author      string     `json:"author"`
	Status      string     `json:"status"`
	Published   bool       `json:"published"`
	PublishedAt *time.Time `json:"publishedAt,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
	ReadTime    int        `json:"readTimeMinutes"`
	WordCount   int        `json:"wordCount"`
	URL         string     `json:"url,omitempty"`
}

func (a *application) registerArticleAPIRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/articles", a.requireArticleAPI(a.apiListArticles))
	mux.HandleFunc("GET /api/articles/{reference}", a.requireArticleAPI(a.apiReadArticle))
	mux.HandleFunc("POST /api/articles/drafts", a.requireArticleAPI(a.apiSaveArticleDraft))
	mux.HandleFunc("POST /api/articles/{id}/publish", a.requireArticleAPI(a.apiPublishArticle))
}

func (a *application) requireArticleAPI(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "private, no-store")
		token := os.Getenv("PORTFOLIO_API_TOKEN")
		if token == "" {
			writeArticleError(w, http.StatusServiceUnavailable, "A API de artigos não está configurada.")
			return
		}
		scheme, provided, found := strings.Cut(r.Header.Get("Authorization"), " ")
		if !found || !strings.EqualFold(scheme, "Bearer") ||
			subtle.ConstantTimeCompare([]byte(provided), []byte(token)) != 1 {
			w.Header().Set("WWW-Authenticate", "Bearer")
			writeArticleError(w, http.StatusUnauthorized, "O token da API não é válido.")
			return
		}
		if a.admin == nil {
			writeArticleError(w, http.StatusServiceUnavailable, "A API de artigos precisa de uma conexão com o PostgreSQL.")
			return
		}
		next(w, r)
	}
}

func (a *application) apiListArticles(w http.ResponseWriter, r *http.Request) {
	status := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("status")))
	if status == "" {
		status = "all"
	}
	if status != "all" && status != "draft" && status != "published" {
		writeArticleError(w, http.StatusBadRequest, "O status deve ser all, draft ou published.")
		return
	}

	limit := 50
	if rawLimit := r.URL.Query().Get("limit"); rawLimit != "" {
		parsed, err := strconv.Atoi(rawLimit)
		if err != nil || parsed < 1 || parsed > 100 {
			writeArticleError(w, http.StatusBadRequest, "O limite deve ser um número entre 1 e 100.")
			return
		}
		limit = parsed
	}

	posts, err := a.admin.ListAll(r.Context())
	if err != nil {
		a.apiArticleServerError(w, err)
		return
	}
	articles := make([]articleResponse, 0, min(limit, len(posts)))
	for _, post := range posts {
		if status == "draft" && post.Published {
			continue
		}
		if status == "published" && !post.Published {
			continue
		}
		articles = append(articles, a.articleResponse(post, false))
		if len(articles) == limit {
			break
		}
	}
	writeArticleJSON(w, http.StatusOK, map[string]any{
		"count":    len(articles),
		"articles": articles,
	})
}

func (a *application) apiReadArticle(w http.ResponseWriter, r *http.Request) {
	reference := strings.TrimSpace(r.PathValue("reference"))
	var (
		post *Post
		err  error
	)
	if id, parseErr := strconv.Atoi(reference); parseErr == nil && id > 0 {
		post, err = a.admin.GetByID(r.Context(), id)
	} else {
		post, err = a.admin.GetBySlug(r.Context(), reference)
	}
	if errors.Is(err, sql.ErrNoRows) {
		writeArticleError(w, http.StatusNotFound, "O artigo não existe.")
		return
	}
	if err != nil {
		a.apiArticleServerError(w, err)
		return
	}
	writeArticleJSON(w, http.StatusOK, map[string]any{
		"article": a.articleResponse(*post, true),
	})
}

func (a *application) apiSaveArticleDraft(w http.ResponseWriter, r *http.Request) {
	var payload articlePayload
	if err := decodeArticlePayload(w, r, &payload); err != nil {
		writeArticleError(w, http.StatusBadRequest, err.Error())
		return
	}

	if payload.ID > 0 {
		current, err := a.admin.GetByID(r.Context(), payload.ID)
		if errors.Is(err, sql.ErrNoRows) {
			writeArticleError(w, http.StatusNotFound, "O rascunho não existe.")
			return
		}
		if err != nil {
			a.apiArticleServerError(w, err)
			return
		}
		if current.Published {
			writeArticleError(w, http.StatusConflict, "Um artigo publicado não pode virar rascunho por esta API.")
			return
		}
	}

	input, validationError := validatePostInput(PostInput{
		ID:        payload.ID,
		Slug:      payload.Slug,
		Title:     payload.Title,
		Excerpt:   payload.Excerpt,
		Content:   payload.Content,
		Tags:      payload.Tags,
		Author:    payload.Author,
		Published: false,
	})
	if validationError != "" {
		writeArticleError(w, http.StatusBadRequest, validationError)
		return
	}
	post, err := a.admin.Save(r.Context(), input)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "unique") {
			writeArticleError(w, http.StatusConflict, "Outro artigo já usa este endereço.")
			return
		}
		a.apiArticleServerError(w, err)
		return
	}
	status := http.StatusOK
	if payload.ID == 0 {
		status = http.StatusCreated
	}
	writeArticleJSON(w, status, map[string]any{
		"saved":   true,
		"article": a.articleResponse(*post, true),
	})
}

func (a *application) apiPublishArticle(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil || id < 1 {
		writeArticleError(w, http.StatusBadRequest, "O identificador do artigo não é válido.")
		return
	}
	post, err := a.admin.GetByID(r.Context(), id)
	if errors.Is(err, sql.ErrNoRows) {
		writeArticleError(w, http.StatusNotFound, "O rascunho não existe.")
		return
	}
	if err != nil {
		a.apiArticleServerError(w, err)
		return
	}
	if !post.Published {
		post, err = a.admin.Save(r.Context(), PostInput{
			ID:        post.ID,
			Slug:      post.Slug,
			Title:     post.Title,
			Excerpt:   post.Excerpt,
			Content:   post.Content,
			Tags:      post.Tags,
			Author:    post.Author,
			Published: true,
		})
		if err != nil {
			a.apiArticleServerError(w, err)
			return
		}
	}
	writeArticleJSON(w, http.StatusOK, map[string]any{
		"published": true,
		"article":   a.articleResponse(*post, true),
	})
}

func decodeArticlePayload(w http.ResponseWriter, r *http.Request, destination *articlePayload) error {
	r.Body = http.MaxBytesReader(w, r.Body, maxArticleRequestBytes)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(destination); err != nil {
		return errors.New("O corpo da solicitação não contém um artigo válido.")
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return errors.New("O corpo da solicitação deve conter somente um artigo.")
	}
	return nil
}

func (a *application) articleResponse(post Post, includeContent bool) articleResponse {
	status := "draft"
	var publishedAt *time.Time
	url := ""
	if post.Published {
		status = "published"
		value := post.PublishedAt
		publishedAt = &value
		url = strings.TrimRight(a.origin, "/") + "/blog/" + post.Slug
	}
	content := ""
	if includeContent {
		content = post.Content
	}
	return articleResponse{
		ID:          post.ID,
		Slug:        post.Slug,
		Title:       post.Title,
		Excerpt:     post.Excerpt,
		Content:     content,
		Tags:        post.Tags,
		Author:      post.Author,
		Status:      status,
		Published:   post.Published,
		PublishedAt: publishedAt,
		CreatedAt:   post.CreatedAt,
		UpdatedAt:   post.UpdatedAt,
		ReadTime:    post.ReadTime,
		WordCount:   post.WordCount,
		URL:         url,
	}
}

func (a *application) apiArticleServerError(w http.ResponseWriter, err error) {
	log.Printf("article API request failed: %v", err)
	writeArticleError(w, http.StatusInternalServerError, "Não foi possível concluir a solicitação.")
}

func writeArticleError(w http.ResponseWriter, status int, message string) {
	writeArticleJSON(w, status, map[string]string{"error": message})
}

func writeArticleJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
