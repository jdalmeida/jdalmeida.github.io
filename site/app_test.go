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

func TestEventVideoPlaysWithoutPlayerUI(t *testing.T) {
	t.Setenv("DATABASE_URL", "")
	response := httptest.NewRecorder()
	New().ServeHTTP(
		response,
		httptest.NewRequest(http.MethodGet, "/partials/events/south-summit", nil),
	)

	body := response.Body.String()
	for _, attribute := range []string{
		"<video autoplay",
		"loop",
		"muted",
		"playsinline",
		`preload="none"`,
		`disablepictureinpicture`,
		// site.js only attaches the source once the photos are done loading.
		`data-autoplay-video data-video-src="https://`,
	} {
		if !strings.Contains(body, attribute) {
			t.Fatalf("event video does not contain %q", attribute)
		}
	}
	for _, forbidden := range []string{" controls", "<source "} {
		if strings.Contains(body, forbidden) {
			t.Fatalf("event video still contains the player UI marker %q", forbidden)
		}
	}
}

func TestEventVideoShowsThePosterWhileItLoads(t *testing.T) {
	original := events[0].Poster
	events[0].Poster = "/uploads/ss_brazil3-poster.webp"
	t.Cleanup(func() { events[0].Poster = original })

	t.Setenv("DATABASE_URL", "")
	handler := New()

	dialog := httptest.NewRecorder()
	handler.ServeHTTP(
		dialog,
		httptest.NewRequest(http.MethodGet, "/partials/events/south-summit", nil),
	)
	if !strings.Contains(dialog.Body.String(), `poster="/uploads/ss_brazil3-poster.webp"`) {
		t.Fatal("the video does not carry the poster")
	}

	home := httptest.NewRecorder()
	handler.ServeHTTP(home, httptest.NewRequest(http.MethodGet, "/", nil))
	if !strings.Contains(home.Body.String(), "/uploads/ss_brazil3-poster.webp") {
		t.Fatal("the badge preload does not warm the poster")
	}
}

func TestVideoOrigins(t *testing.T) {
	origins := videoOrigins([]Event{
		{Video: "https://blob.example.com/a.mp4"},
		{Video: "https://blob.example.com/b.mp4"},
		{Video: "/uploads/local.webp"},
		{Video: ""},
	})
	if len(origins) != 1 || origins[0] != "https://blob.example.com" {
		t.Fatalf("origins = %v, want one entry for the blob host", origins)
	}

	t.Setenv("DATABASE_URL", "")
	handler := New()
	home := httptest.NewRecorder()
	handler.ServeHTTP(home, httptest.NewRequest(http.MethodGet, "/", nil))
	if !strings.Contains(home.Body.String(), `<link rel="preconnect" href="https://j7lpolirgh0ipp7n.public.blob.vercel-storage.com">`) {
		t.Fatal("the home page does not preconnect to the video host")
	}

	blog := httptest.NewRecorder()
	handler.ServeHTTP(blog, httptest.NewRequest(http.MethodGet, "/blog", nil))
	if strings.Contains(blog.Body.String(), "vercel-storage.com") {
		t.Fatal("the blog page preconnects to a host it never uses")
	}
}

func TestEventPhotosUseResizedCopies(t *testing.T) {
	t.Setenv("DATABASE_URL", "")
	response := httptest.NewRecorder()
	New().ServeHTTP(
		response,
		httptest.NewRequest(http.MethodGet, "/partials/events/south-summit", nil),
	)

	body := response.Body.String()
	for _, want := range []string{
		`src="/uploads/ss_brazil1-960.webp"`,
		`srcset="/uploads/ss_brazil1-480.webp 480w, /uploads/ss_brazil1-960.webp 960w"`,
		`sizes="` + gallerySizes + `"`,
		`fetchpriority="high"`,
	} {
		if !strings.Contains(body, want) {
			t.Fatalf("event gallery does not contain %q", want)
		}
	}
	if strings.Contains(body, `src="/uploads/ss_brazil1.webp"`) {
		t.Fatal("event gallery still loads the full size photo")
	}
	if strings.Contains(body, `loading="lazy"`) {
		t.Fatal("event gallery photos are lazy, so they start loading late")
	}
}

func TestImageVariantsExist(t *testing.T) {
	for _, event := range events {
		photos := append([]string{}, event.Images...)
		if hasVariants(event.Video) {
			photos = append(photos, event.Video)
		}
		for _, photo := range photos {
			if !hasVariants(photo) {
				t.Fatalf("photo %q is outside /uploads, so it has no resized copies", photo)
			}
			for _, width := range imageVariantWidths {
				path := "../public" + variantPath(photo, width)
				if _, err := os.Stat(path); err != nil {
					t.Fatalf("missing %s: run scripts/generate-image-variants.py", path)
				}
			}
		}
	}
}

func TestBadgesCarryTheGalleryPreload(t *testing.T) {
	t.Setenv("DATABASE_URL", "")
	response := httptest.NewRecorder()
	New().ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/", nil))

	body := response.Body.String()
	if !strings.Contains(body, `data-gallery-sizes="`+gallerySizes+`"`) {
		t.Fatal("the badge stack does not carry the gallery sizes")
	}
	if count := strings.Count(body, "data-gallery-preload="); count != len(events) {
		t.Fatalf("preload attributes = %d, want %d", count, len(events))
	}
	if !strings.Contains(body, "/uploads/ss_brazil1-480.webp 480w") {
		t.Fatal("the badge preload does not list the resized copies")
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
	if guides := strings.Count(body, `class="intro-sig-guide"`); guides != 10 {
		t.Fatalf("guide count = %d, want 10", guides)
	}
	if masks := strings.Count(body, `mask="url(#intro-sigm`); masks != 10 {
		t.Fatalf("mask count = %d, want 10", masks)
	}
	if strings.Contains(body, "intro-sigg6b") {
		t.Fatal("obsolete intro guide 06b is present")
	}
	for _, want := range []string{
		`id="intro-sigg1" class="intro-sig-guide" pathLength="1" stroke-width="34.4"`,
		`id="intro-sigg6a" class="intro-sig-guide" pathLength="1" stroke-width="33.8"`,
		`transform="translate(0.33039927,1.3924874)"`,
		`logo-signature-animated.svg?v=5#p1`,
	} {
		if !strings.Contains(body, want) {
			t.Fatalf("signature intro does not contain %q", want)
		}
	}
	if strings.Contains(string(source), "sigg6b") {
		t.Fatal("obsolete signature guide 06b is present")
	}
}
