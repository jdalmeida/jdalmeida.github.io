package main

import (
	"errors"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/jdalmeida/jdalmeida.github.io/site"
)

func main() {
	loadLocalEnv(".env.local")

	address := ":" + envOrDefault("PORT", "3000")
	server := &http.Server{
		Addr:              address,
		Handler:           site.New(),
		ReadHeaderTimeout: site.ReadHeaderTimeout,
	}

	log.Printf("site available at http://localhost%s", address)
	if err := server.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
}

func loadLocalEnv(fileName string) {
	source, err := os.ReadFile(fileName)
	if err != nil {
		return
	}
	for line := range strings.Lines(string(source)) {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		name, value, found := strings.Cut(line, "=")
		if !found {
			continue
		}
		name = strings.TrimSpace(name)
		value = strings.TrimSpace(value)
		if len(value) >= 2 {
			first := value[0]
			last := value[len(value)-1]
			if (first == '"' && last == '"') || (first == '\'' && last == '\'') {
				value = value[1 : len(value)-1]
			}
		}
		if _, exists := os.LookupEnv(name); !exists {
			_ = os.Setenv(name, value)
		}
	}
}

func envOrDefault(name, fallback string) string {
	if value := os.Getenv(name); value != "" {
		return value
	}
	return fallback
}
