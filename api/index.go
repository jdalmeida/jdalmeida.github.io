package handler

import (
	"net/http"
	"sync"

	"github.com/jdalmeida/jdalmeida.github.io/site"
)

var (
	appOnce sync.Once
	app     http.Handler
)

// Handler serves the portfolio through one Vercel Go Function.
func Handler(w http.ResponseWriter, r *http.Request) {
	appOnce.Do(func() {
		app = site.New()
	})

	if path := r.URL.Query().Get("__path"); path != "" {
		cloned := r.Clone(r.Context())
		urlCopy := *r.URL
		urlCopy.Path = path
		query := urlCopy.Query()
		query.Del("__path")
		urlCopy.RawQuery = query.Encode()
		cloned.URL = &urlCopy
		r = cloned
	}

	app.ServeHTTP(w, r)
}
