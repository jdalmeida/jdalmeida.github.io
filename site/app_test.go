package site

import (
	"encoding/xml"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
)

func TestPublicRoutes(t *testing.T) {
	t.Setenv("DATABASE_URL", "")
	t.Setenv("SITE_URL", "https://example.com")
	handler := New()

	tests := []struct {
		name        string
		path        string
		wantStatus  int
		wantContent string
	}{
		{
			name:        "home",
			path:        "/",
			wantStatus:  http.StatusOK,
			wantContent: "Construindo software",
		},
		{
			name:        "blog",
			path:        "/blog",
			wantStatus:  http.StatusOK,
			wantContent: "Contexto é o novo código",
		},
		{
			name:        "article",
			path:        "/blog/contexto-e-o-novo-codigo",
			wantStatus:  http.StatusOK,
			wantContent: "O problema: dados em silos",
		},
		{
			name:        "event fragment",
			path:        "/partials/events/south-summit",
			wantStatus:  http.StatusOK,
			wantContent: "South Summit Brazil",
		},
		{
			name:        "missing",
			path:        "/missing",
			wantStatus:  http.StatusNotFound,
			wantContent: "Esta página saiu do mapa",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodGet, test.path, nil)
			response := httptest.NewRecorder()
			handler.ServeHTTP(response, request)

			if response.Code != test.wantStatus {
				t.Fatalf("status = %d, want %d", response.Code, test.wantStatus)
			}
			if !strings.Contains(response.Body.String(), test.wantContent) {
				t.Fatalf("response does not contain %q", test.wantContent)
			}
		})
	}
}

func TestSecurityHeaders(t *testing.T) {
	t.Setenv("DATABASE_URL", "")
	handler := New()
	request := httptest.NewRequest(http.MethodGet, "/", nil)
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Header().Get("Content-Security-Policy") == "" {
		t.Fatal("Content-Security-Policy header is missing")
	}
	if response.Header().Get("X-Content-Type-Options") != "nosniff" {
		t.Fatal("X-Content-Type-Options header is incorrect")
	}
}

func TestEventVideoAutoplayAndLoop(t *testing.T) {
	t.Setenv("DATABASE_URL", "")
	response := httptest.NewRecorder()
	New().ServeHTTP(
		response,
		httptest.NewRequest(http.MethodGet, "/partials/events/south-summit", nil),
	)

	body := response.Body.String()
	for _, attribute := range []string{
		"autoplay",
		"loop",
		"muted",
		"playsinline",
		`data-autoplay-video`,
	} {
		if !strings.Contains(body, attribute) {
			t.Fatalf("event video does not contain %q", attribute)
		}
	}
}

func TestAnimatedSignatureSVG(t *testing.T) {
	source, err := os.ReadFile("../public/assets/logo-signature-animated.svg")
	if err != nil {
		t.Fatalf("read signature SVG: %v", err)
	}

	var document struct {
		XMLName xml.Name
	}
	if err := xml.Unmarshal(source, &document); err != nil {
		t.Fatalf("parse signature SVG: %v", err)
	}
	if document.XMLName.Local != "svg" {
		t.Fatalf("root element = %q, want svg", document.XMLName.Local)
	}
	if paths := strings.Count(string(source), `id="p`); paths != 10 {
		t.Fatalf("path count = %d, want 10", paths)
	}

	t.Setenv("DATABASE_URL", "")
	response := httptest.NewRecorder()
	New().ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/", nil))
	body := response.Body.String()
	if guides := strings.Count(body, `class="intro-sig-guide"`); guides != 11 {
		t.Fatalf("guide count = %d, want 11", guides)
	}
	if masks := strings.Count(body, `mask="url(#intro-sigm`); masks != 10 {
		t.Fatalf("mask count = %d, want 10", masks)
	}
}
