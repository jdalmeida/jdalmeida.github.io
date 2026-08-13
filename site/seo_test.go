package site

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestSEOEndpoints(t *testing.T) {
	t.Setenv("DATABASE_URL", "")
	t.Setenv("SITE_URL", "https://example.com")
	handler := New()

	tests := []struct {
		name            string
		path            string
		wantContentType string
		wantContent     []string
	}{
		{
			name:            "robots",
			path:            "/robots.txt",
			wantContentType: "text/plain; charset=utf-8",
			wantContent: []string{
				"User-agent: *",
				"Disallow: /admin",
				"Sitemap: https://example.com/sitemap.xml",
			},
		},
		{
			name:            "sitemap",
			path:            "/sitemap.xml",
			wantContentType: "application/xml; charset=utf-8",
			wantContent: []string{
				`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
				"<loc>https://example.com/</loc>",
				"<loc>https://example.com/blog</loc>",
				"<loc>https://example.com/blog/contexto-e-o-novo-codigo</loc>",
				"<lastmod>",
			},
		},
		{
			name:            "llms",
			path:            "/llms.txt",
			wantContentType: "text/plain; charset=utf-8",
			wantContent: []string{
				"# João de Almeida",
				"(https://example.com/blog/contexto-e-o-novo-codigo)",
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response := httptest.NewRecorder()
			handler.ServeHTTP(response, httptest.NewRequest(http.MethodGet, test.path, nil))

			if response.Code != http.StatusOK {
				t.Fatalf("status = %d, want 200", response.Code)
			}
			if got := response.Header().Get("Content-Type"); got != test.wantContentType {
				t.Fatalf("content type = %q, want %q", got, test.wantContentType)
			}
			for _, want := range test.wantContent {
				if !strings.Contains(response.Body.String(), want) {
					t.Fatalf("response does not contain %q", want)
				}
			}
		})
	}
}

func TestHeadCarriesStructuredData(t *testing.T) {
	t.Setenv("DATABASE_URL", "")
	t.Setenv("SITE_URL", "https://example.com")
	handler := New()

	home := httptest.NewRecorder()
	handler.ServeHTTP(home, httptest.NewRequest(http.MethodGet, "/", nil))
	for _, want := range []string{
		`"@type": "Person"`,
		`<meta property="og:image" content="https://example.com/assets/logo-mark.png">`,
	} {
		if !strings.Contains(home.Body.String(), want) {
			t.Fatalf("home head does not contain %q", want)
		}
	}

	article := httptest.NewRecorder()
	handler.ServeHTTP(article, httptest.NewRequest(http.MethodGet, "/blog/contexto-e-o-novo-codigo", nil))
	for _, want := range []string{
		`"@type": "BlogPosting"`,
		`<meta property="article:published_time"`,
	} {
		if !strings.Contains(article.Body.String(), want) {
			t.Fatalf("article head does not contain %q", want)
		}
	}

	admin := httptest.NewRecorder()
	handler.ServeHTTP(admin, httptest.NewRequest(http.MethodGet, "/admin", nil))
	if !strings.Contains(admin.Body.String(), `<meta name="robots" content="noindex, nofollow">`) {
		t.Fatal("admin page is not marked noindex")
	}
}
