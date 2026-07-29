package site

import (
	"bytes"
	"embed"
	"fmt"
	"html/template"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/parser"
)

//go:embed templates/*.html
var templateFiles embed.FS

type renderer struct {
	templates *template.Template
	markdown  goldmark.Markdown
}

func newRenderer() *renderer {
	functions := template.FuncMap{
		"formatDate":      formatDate,
		"formatShortDate": formatShortDate,
		"safeHTML":        func(value string) template.HTML { return template.HTML(value) },
		"eventStyle": func(event Event) template.CSS {
			return template.CSS("--badge:" + event.Color + ";--badge-dark:" + event.DarkColor)
		},
		"isImage": func(value string) bool {
			lower := strings.ToLower(value)
			return strings.HasSuffix(lower, ".webp") ||
				strings.HasSuffix(lower, ".png") ||
				strings.HasSuffix(lower, ".jpg") ||
				strings.HasSuffix(lower, ".jpeg")
		},
		"imageSrc":       imageSrc,
		"imageSrcSet":    imageSrcSet,
		"gallerySizes":   func() string { return gallerySizes },
		"galleryPreload": galleryPreload,
		"videoOrigins":   videoOrigins,
		"join":           strings.Join,
		"lower":          strings.ToLower,
	}
	templates := template.Must(template.New("site").Funcs(functions).ParseFS(templateFiles, "templates/*.html"))
	md := goldmark.New(
		goldmark.WithExtensions(extension.GFM, extension.Typographer),
		goldmark.WithParserOptions(parser.WithAutoHeadingID()),
	)
	return &renderer{templates: templates, markdown: md}
}

func (r *renderer) render(w http.ResponseWriter, status int, name string, data PageData) {
	var output bytes.Buffer
	if err := r.templates.ExecuteTemplate(&output, name, data); err != nil {
		log.Printf("template %s failed: %v", name, err)
		http.Error(w, "Não foi possível mostrar esta página.", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(status)
	if _, err := io.Copy(w, &output); err != nil {
		log.Printf("template response failed: %v", err)
	}
}

func (r *renderer) renderMarkdown(source string) (string, error) {
	var output bytes.Buffer
	if err := r.markdown.Convert([]byte(source), &output); err != nil {
		return "", err
	}
	return output.String(), nil
}

// imageVariantWidths lists the copies written by scripts/generate-image-variants.py.
var imageVariantWidths = []int{480, 960}

// gallerySizes describes how wide a gallery photo is drawn, so the browser can
// pick the smallest copy that still fills the cell.
const gallerySizes = "(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 360px"

// hasVariants reports whether a photo has the resized copies next to it.
func hasVariants(path string) bool {
	return strings.HasPrefix(path, "/uploads/") && strings.HasSuffix(path, ".webp")
}

func variantPath(path string, width int) string {
	return fmt.Sprintf("%s-%d.webp", strings.TrimSuffix(path, ".webp"), width)
}

// imageSrc points at the largest resized copy and falls back to the original.
func imageSrc(path string) string {
	if !hasVariants(path) {
		return path
	}
	return variantPath(path, imageVariantWidths[len(imageVariantWidths)-1])
}

// imageSrcSet lists every resized copy of a photo. It is empty when the photo
// lives outside /uploads, and the browser then loads imageSrc alone.
func imageSrcSet(path string) string {
	if !hasVariants(path) {
		return ""
	}
	candidates := make([]string, 0, len(imageVariantWidths))
	for _, width := range imageVariantWidths {
		candidates = append(candidates, fmt.Sprintf("%s %dw", variantPath(path, width), width))
	}
	return strings.Join(candidates, ", ")
}

// galleryPreload joins the srcset of every photo in an event, separated by a
// pipe. site.js reads it to warm the gallery while the badge is hovered.
func galleryPreload(event Event) string {
	sources := make([]string, 0, len(event.Images)+2)
	for _, image := range event.Images {
		if candidates := imageSrcSet(image); candidates != "" {
			sources = append(sources, candidates)
		}
	}
	if candidates := imageSrcSet(event.Video); candidates != "" {
		sources = append(sources, candidates)
	}
	// A single candidate with no descriptor is a valid srcset, so the poster
	// rides along with the photos.
	if event.Poster != "" {
		sources = append(sources, event.Poster)
	}
	return strings.Join(sources, "|")
}

// videoOrigins lists the distinct hosts serving event videos. The home page
// preconnects to them, so the handshake is already paid for when a dialog opens
// and the player asks for the first bytes.
func videoOrigins(events []Event) []string {
	origins := make([]string, 0, 1)
	seen := make(map[string]bool, 1)
	for _, event := range events {
		parsed, err := url.Parse(event.Video)
		if err != nil || parsed.Scheme == "" || parsed.Host == "" {
			continue
		}
		origin := parsed.Scheme + "://" + parsed.Host
		if seen[origin] {
			continue
		}
		seen[origin] = true
		origins = append(origins, origin)
	}
	return origins
}

func formatDate(value time.Time) string {
	months := [...]string{
		"janeiro", "fevereiro", "março", "abril", "maio", "junho",
		"julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
	}
	if value.IsZero() {
		return ""
	}
	return fmt.Sprintf("%02d de %s de %d", value.Day(), months[value.Month()-1], value.Year())
}

func formatShortDate(value time.Time) string {
	months := [...]string{
		"jan.", "fev.", "mar.", "abr.", "mai.", "jun.",
		"jul.", "ago.", "set.", "out.", "nov.", "dez.",
	}
	if value.IsZero() {
		return ""
	}
	return fmt.Sprintf("%02d %s de %d", value.Day(), months[value.Month()-1], value.Year())
}
