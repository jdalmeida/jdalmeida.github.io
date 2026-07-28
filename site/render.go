package site

import (
	"bytes"
	"embed"
	"fmt"
	"html/template"
	"io"
	"log"
	"net/http"
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
		"join":  strings.Join,
		"lower": strings.ToLower,
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
