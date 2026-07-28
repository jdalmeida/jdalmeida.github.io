package content

import "embed"

// Posts contains the Markdown article archive used when PostgreSQL is unavailable.
//
//go:embed posts/*.md
var Posts embed.FS
