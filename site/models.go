package site

import "time"

// Post is an article from PostgreSQL or the Markdown archive.
type Post struct {
	ID          int
	Slug        string
	Title       string
	Excerpt     string
	Content     string
	HTML        string
	Tags        []string
	Author      string
	Published   bool
	PublishedAt time.Time
	CreatedAt   time.Time
	UpdatedAt   time.Time
	ReadTime    int
	WordCount   int
}

// Event is a conference record displayed as an event badge.
type Event struct {
	ID         string
	Name       string
	Year       string
	Location   string
	ShortPlace string
	Role       string
	Number     string
	Color      string
	DarkColor  string
	Note       string
	Images     []string
	Video      string
}

// PageData contains the shared data for a rendered page or fragment.
type PageData struct {
	Title       string
	Description string
	Canonical   string
	Path        string
	Year        int
	Posts       []Post
	Post        *Post
	Tags        []string
	SelectedTag string
	Events      []Event
	Event       *Event
	Previous    string
	Next        string
	IsHTMX      bool
	IsAdmin     bool
	IsLoggedIn  bool
	CSRFToken   string
	Message     string
	Error       string
	EditPost    *Post
}

// PostInput contains validated values from the article editor.
type PostInput struct {
	ID        int
	Slug      string
	Title     string
	Excerpt   string
	Content   string
	Tags      []string
	Author    string
	Published bool
}

var events = []Event{
	{
		ID:         "south-summit",
		Name:       "South Summit Brazil",
		Year:       "2026",
		Location:   "Cais Mauá, Porto Alegre, RS",
		ShortPlace: "Porto Alegre",
		Role:       "Corps",
		Number:     "Nº 001",
		Color:      "#fd525b",
		DarkColor:  "#370c3b",
		Note:       "Três dias no Cais Mauá entre startups, palcos e café. Uma credencial do lado de quem faz o evento acontecer.",
		Images:     []string{"/uploads/ss_brazil1.webp", "/uploads/ss_brazil2.webp"},
		Video:      "https://j7lpolirgh0ipp7n.public.blob.vercel-storage.com/ss_brazil3.mp4",
	},
	{
		ID:         "amcham-sx",
		Name:       "Amcham SX",
		Year:       "2025",
		Location:   "Vinícola Luiz Argenta, Flores da Cunha, RS",
		ShortPlace: "Flores da Cunha",
		Role:       "Atendee",
		Number:     "Nº 002",
		Color:      "#1739c9",
		DarkColor:  "#091747",
		Note:       "Um encontro anual sobre inovação e negócios, com boas palestras e muitas conexões.",
		Images:     []string{"/uploads/sx1.webp", "/uploads/sx2.webp"},
		Video:      "https://j7lpolirgh0ipp7n.public.blob.vercel-storage.com/sx3.mp4",
	},
	{
		ID:         "techstars-sw",
		Name:       "Techstars Startup Weekend",
		Year:       "2025",
		Location:   "Lajeado, RS",
		ShortPlace: "Lajeado",
		Role:       "Developer",
		Number:     "Nº 003",
		Color:      "#2c9f55",
		DarkColor:  "#1f6f43",
		Note:       "Foram 54 horas para tirar uma ideia do papel. O time nasceu na sexta e apresentou o produto no domingo.",
		Images:     []string{"/uploads/sw_lajeado1.webp", "/uploads/sw_lajeado2.webp"},
		Video:      "/uploads/sw_lajeado3.webp",
	},
	{
		ID:         "hackathon-va",
		Name:       "3º Hackathon de Venâncio Aires",
		Year:       "2024",
		Location:   "Venâncio Aires, RS",
		ShortPlace: "Venâncio Aires",
		Role:       "Dev & Leader",
		Number:     "Nº 004",
		Color:      "#1f46bf",
		DarkColor:  "#0e1b62",
		Note:       "O evento onde as startups viraram parte da minha vida.",
		Images:     []string{"/uploads/hackathon1.webp", "/uploads/hackathon2.webp"},
		Video:      "https://j7lpolirgh0ipp7n.public.blob.vercel-storage.com/hackathon3.mp4",
	},
}
