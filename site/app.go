package site

import (
	"crypto/rand"
	"crypto/subtle"
	"database/sql"
	"encoding/hex"
	"errors"
	"log"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"
)

const (
	sessionCookieName = "jalmeida_admin"
	sessionDuration   = 7 * 24 * time.Hour
	ReadHeaderTimeout = 5 * time.Second
)

var slugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

type application struct {
	renderer *renderer
	store    *hybridStore
	admin    adminStore
	origin   string
}

// New returns the complete portfolio HTTP handler.
func New() http.Handler {
	fallback := loadMarkdownStore()
	primary := openPostgres()
	app := &application{
		renderer: newRenderer(),
		store:    &hybridStore{primary: primary, fallback: fallback},
		origin:   envOrDefault("SITE_URL", "https://joao.allpines.com.br"),
	}
	if primary != nil {
		app.admin = primary
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /", app.home)
	mux.HandleFunc("GET /blog", app.blog)
	mux.HandleFunc("GET /blog/{slug}", app.article)
	mux.HandleFunc("GET /partials/posts", app.postList)
	mux.HandleFunc("GET /partials/events/{id}", app.eventDialog)
	mux.HandleFunc("GET /sobre", app.sectionRedirect("sobre"))
	mux.HandleFunc("GET /contato", app.sectionRedirect("contato"))
	mux.HandleFunc("GET /healthz", app.health)
	mux.HandleFunc("GET /robots.txt", app.robots)
	mux.HandleFunc("GET /sitemap.xml", app.sitemap)
	mux.HandleFunc("GET /llms.txt", app.llms)
	app.registerArticleAPIRoutes(mux)

	mux.HandleFunc("GET /admin", app.adminPage)
	mux.HandleFunc("POST /admin/login", app.adminLogin)
	mux.HandleFunc("POST /admin/logout", app.requireAdmin(app.adminLogout))
	mux.HandleFunc("GET /admin/posts/new", app.requireAdmin(app.adminNew))
	mux.HandleFunc("GET /admin/posts/{id}/edit", app.requireAdmin(app.adminEdit))
	mux.HandleFunc("POST /admin/posts/save", app.requireAdmin(app.adminSave))
	mux.HandleFunc("DELETE /admin/posts/{id}", app.requireAdmin(app.adminDelete))
	mux.HandleFunc("POST /admin/preview", app.requireAdmin(app.adminPreview))

	public := http.FileServer(http.Dir("public"))
	mux.Handle("GET /assets/", public)
	mux.Handle("GET /uploads/", public)
	mux.Handle("GET /styles.css", public)
	mux.Handle("GET /site.js", public)
	mux.Handle("GET /favicon.svg", public)
	mux.Handle("GET /logo_collage.webp", public)
	mux.Handle("GET /signature_collage.webp", public)

	return securityHeaders(mux)
}

func (a *application) home(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		a.notFound(w, r)
		return
	}
	posts, err := a.store.ListPublished(r.Context())
	if err != nil {
		a.serverError(w, err)
		return
	}
	if len(posts) > 3 {
		posts = posts[:3]
	}
	a.renderer.render(w, http.StatusOK, "home", a.pageData(r, PageData{
		Title:       "João de Almeida | Software, IA e produto",
		Description: "Notas sobre inteligência artificial, software e os lugares que ajudam a formar o trabalho de João de Almeida.",
		Posts:       posts,
		Events:      events,
	}))
}

func (a *application) blog(w http.ResponseWriter, r *http.Request) {
	posts, err := a.store.ListPublished(r.Context())
	if err != nil {
		a.serverError(w, err)
		return
	}
	tag := strings.TrimSpace(r.URL.Query().Get("tag"))
	tags := collectTags(posts)
	filtered := filterPosts(posts, tag)
	a.renderer.render(w, http.StatusOK, "blog", a.pageData(r, PageData{
		Title:       "Artigos | João de Almeida",
		Description: "Artigos sobre inteligência artificial, contexto, software e o ofício de programar.",
		Posts:       filtered,
		Tags:        tags,
		SelectedTag: tag,
	}))
}

func (a *application) article(w http.ResponseWriter, r *http.Request) {
	post, err := a.store.GetPublished(r.Context(), r.PathValue("slug"))
	if errors.Is(err, sql.ErrNoRows) {
		a.notFound(w, r)
		return
	}
	if err != nil {
		a.serverError(w, err)
		return
	}
	post.HTML, err = a.renderer.renderMarkdown(post.Content)
	if err != nil {
		a.serverError(w, err)
		return
	}
	a.renderer.render(w, http.StatusOK, "article", a.pageData(r, PageData{
		Title:       post.Title + " | João de Almeida",
		Description: post.Excerpt,
		Post:        post,
	}))
}

func (a *application) postList(w http.ResponseWriter, r *http.Request) {
	posts, err := a.store.ListPublished(r.Context())
	if err != nil {
		a.serverError(w, err)
		return
	}
	tag := strings.TrimSpace(r.URL.Query().Get("tag"))
	data := a.pageData(r, PageData{
		Posts:       filterPosts(posts, tag),
		Tags:        collectTags(posts),
		SelectedTag: tag,
		IsHTMX:      true,
	})
	w.Header().Set("Vary", "HX-Request")
	a.renderer.render(w, http.StatusOK, "blog-results", data)
}

func (a *application) eventDialog(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	index := -1
	for currentIndex := range events {
		if events[currentIndex].ID == id {
			index = currentIndex
			break
		}
	}
	if index == -1 {
		a.notFound(w, r)
		return
	}
	event := events[index]
	data := a.pageData(r, PageData{
		Event:    &event,
		Previous: events[(index-1+len(events))%len(events)].ID,
		Next:     events[(index+1)%len(events)].ID,
		IsHTMX:   true,
	})
	w.Header().Set("Vary", "HX-Request")
	a.renderer.render(w, http.StatusOK, "event-dialog", data)
}

func (a *application) sectionRedirect(section string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/#"+section, http.StatusPermanentRedirect)
	}
}

func (a *application) health(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("ok"))
}

func (a *application) adminPage(w http.ResponseWriter, r *http.Request) {
	if a.admin == nil {
		a.renderer.render(w, http.StatusServiceUnavailable, "admin-unavailable", a.pageData(r, PageData{
			Title:   "Editor indisponível | João de Almeida",
			IsAdmin: true,
			Error:   "O editor precisa de uma conexão com o PostgreSQL.",
		}))
		return
	}

	token, loggedIn := a.session(r)
	if !loggedIn {
		a.renderer.render(w, http.StatusOK, "admin-login", a.pageData(r, PageData{
			Title:   "Editor de artigos | João de Almeida",
			IsAdmin: true,
		}))
		return
	}
	valid, err := a.admin.ValidSession(r.Context(), token)
	if err != nil {
		a.serverError(w, err)
		return
	}
	if !valid {
		a.clearSession(w, r)
		http.Redirect(w, r, "/admin", http.StatusSeeOther)
		return
	}

	posts, err := a.admin.ListAll(r.Context())
	if err != nil {
		a.serverError(w, err)
		return
	}
	blank := blankPost()
	a.renderer.render(w, http.StatusOK, "admin", a.pageData(r, PageData{
		Title:      "Editor de artigos | João de Almeida",
		Posts:      posts,
		IsAdmin:    true,
		IsLoggedIn: true,
		CSRFToken:  csrfToken(token),
		Message:    strings.TrimSpace(r.URL.Query().Get("message")),
		EditPost:   &blank,
	}))
}

func (a *application) adminLogin(w http.ResponseWriter, r *http.Request) {
	if a.admin == nil {
		http.Error(w, "O editor precisa de uma conexão com o PostgreSQL.", http.StatusServiceUnavailable)
		return
	}
	if !validRequestOrigin(r) {
		http.Error(w, "A origem da solicitação não é válida.", http.StatusForbidden)
		return
	}
	if err := r.ParseForm(); err != nil {
		a.renderLoginError(w, r, "Não foi possível ler o formulário.")
		return
	}
	expected := os.Getenv("ADMIN_PASSWORD")
	password := r.FormValue("password")
	if expected == "" || subtle.ConstantTimeCompare([]byte(password), []byte(expected)) != 1 {
		a.renderLoginError(w, r, "A senha não é válida.")
		return
	}

	token, err := randomToken()
	if err != nil {
		a.serverError(w, err)
		return
	}
	expiresAt := time.Now().Add(sessionDuration)
	if err := a.admin.CreateSession(r.Context(), token, expiresAt); err != nil {
		a.serverError(w, err)
		return
	}
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    token,
		Path:     "/admin",
		Expires:  expiresAt,
		MaxAge:   int(sessionDuration.Seconds()),
		HttpOnly: true,
		Secure:   isHTTPS(r),
		SameSite: http.SameSiteStrictMode,
	})
	redirect(w, r, "/admin")
}

func (a *application) adminLogout(w http.ResponseWriter, r *http.Request) {
	token, _ := a.session(r)
	if err := a.admin.DeleteSession(r.Context(), token); err != nil {
		a.serverError(w, err)
		return
	}
	a.clearSession(w, r)
	redirect(w, r, "/admin")
}

func (a *application) adminNew(w http.ResponseWriter, r *http.Request) {
	post := blankPost()
	token, _ := a.session(r)
	a.renderer.render(w, http.StatusOK, "admin-editor", a.pageData(r, PageData{
		EditPost:   &post,
		CSRFToken:  csrfToken(token),
		IsAdmin:    true,
		IsLoggedIn: true,
		IsHTMX:     true,
	}))
}

func (a *application) adminEdit(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		a.notFound(w, r)
		return
	}
	post, err := a.admin.GetByID(r.Context(), id)
	if errors.Is(err, sql.ErrNoRows) {
		a.notFound(w, r)
		return
	}
	if err != nil {
		a.serverError(w, err)
		return
	}
	token, _ := a.session(r)
	a.renderer.render(w, http.StatusOK, "admin-editor", a.pageData(r, PageData{
		EditPost:   post,
		CSRFToken:  csrfToken(token),
		IsAdmin:    true,
		IsLoggedIn: true,
		IsHTMX:     true,
	}))
}

func (a *application) adminSave(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		a.renderAdminEditorError(w, r, PostInput{}, "Não foi possível ler o formulário.")
		return
	}
	input, validationError := validatePostForm(r)
	if validationError != "" {
		a.renderAdminEditorError(w, r, input, validationError)
		return
	}
	if _, err := a.admin.Save(r.Context(), input); err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "unique") {
			a.renderAdminEditorError(w, r, input, "Outro artigo já usa este endereço.")
			return
		}
		a.serverError(w, err)
		return
	}
	redirect(w, r, "/admin?message="+url.QueryEscape("O artigo foi salvo."))
}

func (a *application) adminDelete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		a.notFound(w, r)
		return
	}
	if err := a.admin.Delete(r.Context(), id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			a.notFound(w, r)
			return
		}
		a.serverError(w, err)
		return
	}
	posts, err := a.admin.ListAll(r.Context())
	if err != nil {
		a.serverError(w, err)
		return
	}
	token, _ := a.session(r)
	w.Header().Set("HX-Trigger", `{"articleDeleted":"O artigo foi excluído."}`)
	a.renderer.render(w, http.StatusOK, "admin-post-list", a.pageData(r, PageData{
		Posts:      posts,
		CSRFToken:  csrfToken(token),
		IsAdmin:    true,
		IsLoggedIn: true,
		IsHTMX:     true,
	}))
}

func (a *application) adminPreview(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		http.Error(w, "Não foi possível ler o texto.", http.StatusBadRequest)
		return
	}
	html, err := a.renderer.renderMarkdown(r.FormValue("content"))
	if err != nil {
		a.serverError(w, err)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = w.Write([]byte(`<div class="prose admin-preview">` + html + `</div>`))
}

func (a *application) requireAdmin(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if a.admin == nil {
			http.Error(w, "O editor precisa de uma conexão com o PostgreSQL.", http.StatusServiceUnavailable)
			return
		}
		if !validRequestOrigin(r) && r.Method != http.MethodGet {
			http.Error(w, "A origem da solicitação não é válida.", http.StatusForbidden)
			return
		}
		token, ok := a.session(r)
		if !ok {
			redirect(w, r, "/admin")
			return
		}
		valid, err := a.admin.ValidSession(r.Context(), token)
		if err != nil {
			a.serverError(w, err)
			return
		}
		if !valid {
			a.clearSession(w, r)
			redirect(w, r, "/admin")
			return
		}
		if r.Method != http.MethodGet {
			submitted := r.Header.Get("X-CSRF-Token")
			if submitted == "" {
				_ = r.ParseForm()
				submitted = r.FormValue("csrf_token")
			}
			if subtle.ConstantTimeCompare([]byte(submitted), []byte(csrfToken(token))) != 1 {
				http.Error(w, "O token de segurança não é válido.", http.StatusForbidden)
				return
			}
		}
		next(w, r)
	}
}

func (a *application) renderLoginError(w http.ResponseWriter, r *http.Request, message string) {
	a.renderer.render(w, http.StatusOK, "admin-login-form", a.pageData(r, PageData{
		IsAdmin: true,
		IsHTMX:  isHTMX(r),
		Error:   message,
	}))
}

func (a *application) renderAdminEditorError(w http.ResponseWriter, r *http.Request, input PostInput, message string) {
	post := Post{
		ID:        input.ID,
		Slug:      input.Slug,
		Title:     input.Title,
		Excerpt:   input.Excerpt,
		Content:   input.Content,
		Tags:      input.Tags,
		Author:    input.Author,
		Published: input.Published,
	}
	token, _ := a.session(r)
	a.renderer.render(w, http.StatusOK, "admin-editor", a.pageData(r, PageData{
		EditPost:   &post,
		CSRFToken:  csrfToken(token),
		IsAdmin:    true,
		IsLoggedIn: true,
		IsHTMX:     true,
		Error:      message,
	}))
}

func (a *application) pageData(r *http.Request, data PageData) PageData {
	data.Path = r.URL.Path
	data.Origin = strings.TrimRight(a.origin, "/")
	data.Year = time.Now().Year()
	data.IsHTMX = data.IsHTMX || isHTMX(r)
	if data.Canonical == "" {
		data.Canonical = strings.TrimRight(a.origin, "/") + r.URL.Path
	}
	return data
}

func (a *application) notFound(w http.ResponseWriter, r *http.Request) {
	a.renderer.render(w, http.StatusNotFound, "not-found", a.pageData(r, PageData{
		Title:       "Página não encontrada | João de Almeida",
		Description: "Esta página não existe.",
	}))
}

func (a *application) serverError(w http.ResponseWriter, err error) {
	log.Printf("request failed: %v", err)
	http.Error(w, "Não foi possível concluir esta solicitação.", http.StatusInternalServerError)
}

func collectTags(posts []Post) []string {
	seen := make(map[string]string)
	for _, post := range posts {
		for _, tag := range post.Tags {
			key := strings.ToLower(tag)
			if _, exists := seen[key]; !exists {
				seen[key] = tag
			}
		}
	}
	tags := make([]string, 0, len(seen))
	for _, tag := range seen {
		tags = append(tags, tag)
	}
	sort.Slice(tags, func(i, j int) bool {
		return strings.ToLower(tags[i]) < strings.ToLower(tags[j])
	})
	return tags
}

func filterPosts(posts []Post, tag string) []Post {
	if tag == "" {
		return posts
	}
	filtered := make([]Post, 0, len(posts))
	for _, post := range posts {
		for _, postTag := range post.Tags {
			if strings.EqualFold(postTag, tag) {
				filtered = append(filtered, post)
				break
			}
		}
	}
	return filtered
}

func blankPost() Post {
	return Post{
		Author:  "João de Almeida",
		Content: "# Novo artigo\n\nEscreva o artigo aqui.",
		Tags:    []string{},
	}
}

func validatePostForm(r *http.Request) (PostInput, string) {
	id, _ := strconv.Atoi(r.FormValue("id"))
	tags := strings.FieldsFunc(r.FormValue("tags"), func(char rune) bool {
		return char == ','
	})
	for index := range tags {
		tags[index] = strings.TrimSpace(tags[index])
	}
	input := PostInput{
		ID:        id,
		Slug:      strings.TrimSpace(strings.ToLower(r.FormValue("slug"))),
		Title:     strings.TrimSpace(r.FormValue("title")),
		Excerpt:   strings.TrimSpace(r.FormValue("excerpt")),
		Content:   strings.TrimSpace(r.FormValue("content")),
		Tags:      tags,
		Author:    strings.TrimSpace(r.FormValue("author")),
		Published: r.FormValue("published") == "true",
	}
	return validatePostInput(input)
}

func validatePostInput(input PostInput) (PostInput, string) {
	input.Slug = strings.TrimSpace(strings.ToLower(input.Slug))
	input.Title = strings.TrimSpace(input.Title)
	input.Excerpt = strings.TrimSpace(input.Excerpt)
	input.Content = strings.TrimSpace(input.Content)
	input.Author = strings.TrimSpace(input.Author)
	tags := make([]string, 0, len(input.Tags))
	for _, tag := range input.Tags {
		tag = strings.TrimSpace(tag)
		if tag != "" {
			tags = append(tags, tag)
		}
	}
	input.Tags = tags
	if input.ID < 0 {
		return input, "O identificador do artigo não é válido."
	}
	if len(input.Title) < 3 {
		return input, "O título deve ter no mínimo três caracteres."
	}
	if len(input.Title) > 255 {
		return input, "O título deve ter no máximo 255 caracteres."
	}
	if !slugPattern.MatchString(input.Slug) || len(input.Slug) > 180 {
		return input, "O endereço deve usar letras minúsculas, números e hifens."
	}
	if len(input.Excerpt) < 10 {
		return input, "O resumo deve ter no mínimo dez caracteres."
	}
	if len(input.Excerpt) > 1000 {
		return input, "O resumo deve ter no máximo 1.000 caracteres."
	}
	if input.Content == "" {
		return input, "O artigo não pode ficar vazio."
	}
	if len(input.Content) > 400000 {
		return input, "O artigo deve ter no máximo 400.000 caracteres."
	}
	if input.Author == "" {
		input.Author = "João de Almeida"
	}
	if len(input.Author) > 120 {
		return input, "O nome do autor deve ter no máximo 120 caracteres."
	}
	if len(input.Tags) > 20 {
		return input, "O artigo deve ter no máximo 20 tags."
	}
	for _, tag := range input.Tags {
		if len(tag) > 80 {
			return input, "Cada tag deve ter no máximo 80 caracteres."
		}
	}
	return input, ""
}

func (a *application) session(r *http.Request) (string, bool) {
	cookie, err := r.Cookie(sessionCookieName)
	if err != nil || cookie.Value == "" {
		return "", false
	}
	return cookie.Value, true
}

func (a *application) clearSession(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    "",
		Path:     "/admin",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   isHTTPS(r),
		SameSite: http.SameSiteStrictMode,
	})
}

func randomToken() (string, error) {
	value := make([]byte, 32)
	if _, err := rand.Read(value); err != nil {
		return "", err
	}
	return hex.EncodeToString(value), nil
}

func csrfToken(sessionToken string) string {
	return hashToken("csrf:" + sessionToken)
}

func redirect(w http.ResponseWriter, r *http.Request, destination string) {
	if isHTMX(r) {
		w.Header().Set("HX-Redirect", destination)
		w.WriteHeader(http.StatusNoContent)
		return
	}
	http.Redirect(w, r, destination, http.StatusSeeOther)
}

func validRequestOrigin(r *http.Request) bool {
	origin := r.Header.Get("Origin")
	if origin == "" {
		return true
	}
	parsed, err := url.Parse(origin)
	if err != nil {
		return false
	}
	return strings.EqualFold(parsed.Host, r.Host)
}

func isHTTPS(r *http.Request) bool {
	return r.TLS != nil || strings.EqualFold(r.Header.Get("X-Forwarded-Proto"), "https")
}

func isHTMX(r *http.Request) bool {
	return strings.EqualFold(r.Header.Get("HX-Request"), "true")
}

func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Security-Policy", strings.Join([]string{
			"default-src 'self'",
			"script-src 'self' https://cdn.jsdelivr.net",
			"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
			"font-src 'self' https://fonts.gstatic.com",
			"img-src 'self' data: https:",
			"media-src 'self' https:",
			"connect-src 'self'",
			"frame-ancestors 'none'",
			"base-uri 'self'",
			"form-action 'self'",
		}, "; "))
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		next.ServeHTTP(w, r)
	})
}

func envOrDefault(name, fallback string) string {
	if value := os.Getenv(name); value != "" {
		return value
	}
	return fallback
}
