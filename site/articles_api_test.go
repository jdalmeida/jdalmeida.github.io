package site

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"sort"
	"strings"
	"testing"
	"time"
)

type fakeArticleAdmin struct {
	posts  map[int]Post
	nextID int
}

func newFakeArticleAdmin() *fakeArticleAdmin {
	return &fakeArticleAdmin{posts: make(map[int]Post), nextID: 1}
}

func (s *fakeArticleAdmin) ListAll(context.Context) ([]Post, error) {
	posts := make([]Post, 0, len(s.posts))
	for _, post := range s.posts {
		posts = append(posts, post)
	}
	sort.Slice(posts, func(i, j int) bool {
		return posts[i].UpdatedAt.After(posts[j].UpdatedAt)
	})
	return posts, nil
}

func (s *fakeArticleAdmin) GetByID(_ context.Context, id int) (*Post, error) {
	post, exists := s.posts[id]
	if !exists {
		return nil, sql.ErrNoRows
	}
	return &post, nil
}

func (s *fakeArticleAdmin) GetBySlug(_ context.Context, slug string) (*Post, error) {
	for _, post := range s.posts {
		if post.Slug == slug {
			return &post, nil
		}
	}
	return nil, sql.ErrNoRows
}

func (s *fakeArticleAdmin) Save(_ context.Context, input PostInput) (*Post, error) {
	for id, post := range s.posts {
		if post.Slug == input.Slug && id != input.ID {
			return nil, errors.New("unique slug")
		}
	}
	now := time.Date(2026, time.July, 28, 12, s.nextID, 0, 0, time.UTC)
	post := Post{
		ID:        input.ID,
		Slug:      input.Slug,
		Title:     input.Title,
		Excerpt:   input.Excerpt,
		Content:   input.Content,
		Tags:      input.Tags,
		Author:    input.Author,
		Published: input.Published,
		UpdatedAt: now,
	}
	if input.ID == 0 {
		post.ID = s.nextID
		s.nextID++
		post.CreatedAt = now
	} else {
		current, exists := s.posts[input.ID]
		if !exists {
			return nil, sql.ErrNoRows
		}
		post.CreatedAt = current.CreatedAt
		post.PublishedAt = current.PublishedAt
	}
	if input.Published && post.PublishedAt.IsZero() {
		post.PublishedAt = now
	}
	setPostCounts(&post)
	s.posts[post.ID] = post
	return &post, nil
}

func (s *fakeArticleAdmin) Delete(_ context.Context, id int) error {
	delete(s.posts, id)
	return nil
}

func (s *fakeArticleAdmin) CreateSession(context.Context, string, time.Time) error {
	return nil
}

func (s *fakeArticleAdmin) ValidSession(context.Context, string) (bool, error) {
	return true, nil
}

func (s *fakeArticleAdmin) DeleteSession(context.Context, string) error {
	return nil
}

func TestArticleAPIWorkflow(t *testing.T) {
	t.Setenv("PORTFOLIO_API_TOKEN", "test-token")
	app := &application{
		admin:  newFakeArticleAdmin(),
		origin: "https://example.com",
	}
	mux := http.NewServeMux()
	app.registerArticleAPIRoutes(mux)

	draft := apiRequest(t, mux, http.MethodPost, "/api/articles/drafts", `{
		"slug": "meu-artigo",
		"title": "Meu artigo",
		"excerpt": "Um resumo suficiente.",
		"content": "# Meu artigo\n\nConteúdo de teste.",
		"tags": ["Go", "MCP"],
		"author": "João de Almeida"
	}`, "test-token")
	if draft.Code != http.StatusCreated {
		t.Fatalf("draft status = %d, want %d: %s", draft.Code, http.StatusCreated, draft.Body)
	}
	var saved struct {
		Saved   bool            `json:"saved"`
		Article articleResponse `json:"article"`
	}
	decodeAPIResponse(t, draft, &saved)
	if !saved.Saved || saved.Article.ID != 1 || saved.Article.Published {
		t.Fatalf("unexpected saved draft: %+v", saved)
	}

	list := apiRequest(t, mux, http.MethodGet, "/api/articles?status=draft", "", "test-token")
	var listed struct {
		Count    int               `json:"count"`
		Articles []articleResponse `json:"articles"`
	}
	decodeAPIResponse(t, list, &listed)
	if listed.Count != 1 || listed.Articles[0].Content != "" {
		t.Fatalf("unexpected draft list: %+v", listed)
	}

	read := apiRequest(t, mux, http.MethodGet, "/api/articles/meu-artigo", "", "test-token")
	var article struct {
		Article articleResponse `json:"article"`
	}
	decodeAPIResponse(t, read, &article)
	if !strings.Contains(article.Article.Content, "Conteúdo de teste") {
		t.Fatalf("article content = %q", article.Article.Content)
	}

	published := apiRequest(t, mux, http.MethodPost, "/api/articles/1/publish", "", "test-token")
	decodeAPIResponse(t, published, &article)
	if !article.Article.Published {
		t.Fatal("article was not published")
	}
	if article.Article.URL != "https://example.com/blog/meu-artigo" {
		t.Fatalf("article URL = %q", article.Article.URL)
	}

	publicList := apiRequest(t, mux, http.MethodGet, "/api/articles?status=published", "", "test-token")
	decodeAPIResponse(t, publicList, &listed)
	if listed.Count != 1 || !listed.Articles[0].Published {
		t.Fatalf("unexpected published list: %+v", listed)
	}
}

func TestArticleAPIRejectsInvalidToken(t *testing.T) {
	t.Setenv("PORTFOLIO_API_TOKEN", "test-token")
	app := &application{admin: newFakeArticleAdmin()}
	mux := http.NewServeMux()
	app.registerArticleAPIRoutes(mux)

	response := apiRequest(t, mux, http.MethodGet, "/api/articles", "", "wrong-token")
	if response.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusUnauthorized)
	}
	if response.Header().Get("WWW-Authenticate") != "Bearer" {
		t.Fatal("WWW-Authenticate header is missing")
	}
}

func apiRequest(
	t *testing.T,
	handler http.Handler,
	method string,
	target string,
	body string,
	token string,
) *httptest.ResponseRecorder {
	t.Helper()
	request := httptest.NewRequest(method, target, strings.NewReader(body))
	request.Header.Set("Authorization", "Bearer "+token)
	if body != "" {
		request.Header.Set("Content-Type", "application/json")
	}
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	return response
}

func decodeAPIResponse(t *testing.T, response *httptest.ResponseRecorder, destination any) {
	t.Helper()
	if response.Code < 200 || response.Code >= 300 {
		t.Fatalf("status = %d: %s", response.Code, response.Body)
	}
	if err := json.Unmarshal(response.Body.Bytes(), destination); err != nil {
		t.Fatalf("decode response: %v", err)
	}
}
