package site

import (
	"fmt"
	"net/http"
	"strings"
	"time"
)

// lastModified returns the best known change date of a post.
func lastModified(post Post) time.Time {
	if !post.UpdatedAt.IsZero() {
		return post.UpdatedAt
	}
	return post.PublishedAt
}

func (a *application) robots(w http.ResponseWriter, _ *http.Request) {
	origin := strings.TrimRight(a.origin, "/")
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	fmt.Fprintf(w, `User-agent: *
Disallow: /admin
Disallow: /partials/
Disallow: /api/

Sitemap: %s/sitemap.xml
`, origin)
}

func (a *application) sitemap(w http.ResponseWriter, r *http.Request) {
	posts, err := a.store.ListPublished(r.Context())
	if err != nil {
		a.serverError(w, err)
		return
	}
	origin := strings.TrimRight(a.origin, "/")
	var b strings.Builder
	b.WriteString(`<?xml version="1.0" encoding="UTF-8"?>` + "\n")
	b.WriteString(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` + "\n")
	writeURL := func(loc string, lastmod time.Time) {
		b.WriteString("  <url>\n    <loc>" + loc + "</loc>\n")
		if !lastmod.IsZero() {
			b.WriteString("    <lastmod>" + lastmod.Format("2006-01-02") + "</lastmod>\n")
		}
		b.WriteString("  </url>\n")
	}
	var newest time.Time
	for _, post := range posts {
		if modified := lastModified(post); modified.After(newest) {
			newest = modified
		}
	}
	writeURL(origin+"/", newest)
	writeURL(origin+"/blog", newest)
	for _, post := range posts {
		writeURL(origin+"/blog/"+post.Slug, lastModified(post))
	}
	b.WriteString("</urlset>\n")
	w.Header().Set("Content-Type", "application/xml; charset=utf-8")
	_, _ = w.Write([]byte(b.String()))
}

func (a *application) llms(w http.ResponseWriter, r *http.Request) {
	posts, err := a.store.ListPublished(r.Context())
	if err != nil {
		a.serverError(w, err)
		return
	}
	origin := strings.TrimRight(a.origin, "/")
	var b strings.Builder
	b.WriteString("# João de Almeida\n\n")
	b.WriteString("> Portfólio e arquivo de artigos de João de Almeida sobre inteligência artificial, software e produto. O conteúdo está em português do Brasil.\n\n")
	b.WriteString("## Páginas\n\n")
	b.WriteString("- [Início](" + origin + "/): apresentação, eventos e contato\n")
	b.WriteString("- [Artigos](" + origin + "/blog): arquivo completo de artigos\n\n")
	b.WriteString("## Artigos\n\n")
	for _, post := range posts {
		b.WriteString("- [" + post.Title + "](" + origin + "/blog/" + post.Slug + "): " + post.Excerpt + "\n")
	}
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	_, _ = w.Write([]byte(b.String()))
}
