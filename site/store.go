package site

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"log"
	"os"
	"path"
	"sort"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/jdalmeida/jdalmeida.github.io/content"
	"gopkg.in/yaml.v3"
)

type publicStore interface {
	ListPublished(context.Context) ([]Post, error)
	GetPublished(context.Context, string) (*Post, error)
}

type adminStore interface {
	ListAll(context.Context) ([]Post, error)
	GetByID(context.Context, int) (*Post, error)
	Save(context.Context, PostInput) (*Post, error)
	Delete(context.Context, int) error
	CreateSession(context.Context, string, time.Time) error
	ValidSession(context.Context, string) (bool, error)
	DeleteSession(context.Context, string) error
}

type hybridStore struct {
	primary  *postgresStore
	fallback *markdownStore
}

func (s *hybridStore) ListPublished(ctx context.Context) ([]Post, error) {
	if s.primary != nil {
		posts, err := s.primary.ListPublished(ctx)
		if err == nil {
			return posts, nil
		}
		log.Printf("database article list failed: %v", err)
	}
	return s.fallback.ListPublished(ctx)
}

func (s *hybridStore) GetPublished(ctx context.Context, slug string) (*Post, error) {
	if s.primary != nil {
		post, err := s.primary.GetPublished(ctx, slug)
		if err == nil || errors.Is(err, sql.ErrNoRows) {
			return post, err
		}
		log.Printf("database article lookup failed: %v", err)
	}
	return s.fallback.GetPublished(ctx, slug)
}

type postgresStore struct {
	db *sql.DB
}

func openPostgres() *postgresStore {
	connectionString := os.Getenv("DATABASE_URL")
	if connectionString == "" {
		return nil
	}

	db, err := sql.Open("pgx", connectionString)
	if err != nil {
		log.Printf("database setup failed: %v", err)
		return nil
	}
	db.SetMaxOpenConns(4)
	db.SetMaxIdleConns(2)
	db.SetConnMaxIdleTime(5 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 4*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		log.Printf("database connection failed: %v", err)
		_ = db.Close()
		return nil
	}

	return &postgresStore{db: db}
}

func (s *postgresStore) ListPublished(ctx context.Context) ([]Post, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, slug, title, excerpt, content, tags, author, published,
		       published_at, created_at, updated_at
		FROM posts
		WHERE published = TRUE
		ORDER BY published_at DESC NULLS LAST, created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanPosts(rows)
}

func (s *postgresStore) GetPublished(ctx context.Context, slug string) (*Post, error) {
	row := s.db.QueryRowContext(ctx, `
		SELECT id, slug, title, excerpt, content, tags, author, published,
		       published_at, created_at, updated_at
		FROM posts
		WHERE slug = $1 AND published = TRUE
		LIMIT 1
	`, slug)
	return scanPost(row)
}

func (s *postgresStore) ListAll(ctx context.Context) ([]Post, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, slug, title, excerpt, content, tags, author, published,
		       published_at, created_at, updated_at
		FROM posts
		ORDER BY updated_at DESC, created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanPosts(rows)
}

func (s *postgresStore) GetByID(ctx context.Context, id int) (*Post, error) {
	row := s.db.QueryRowContext(ctx, `
		SELECT id, slug, title, excerpt, content, tags, author, published,
		       published_at, created_at, updated_at
		FROM posts
		WHERE id = $1
		LIMIT 1
	`, id)
	return scanPost(row)
}

func (s *postgresStore) Save(ctx context.Context, input PostInput) (*Post, error) {
	tagsJSON, err := json.Marshal(input.Tags)
	if err != nil {
		return nil, err
	}

	if input.ID == 0 {
		row := s.db.QueryRowContext(ctx, `
			INSERT INTO posts (
				slug, title, excerpt, content, tags, author, published,
				published_at, updated_at
			)
			VALUES (
				$1, $2, $3, $4, $5::jsonb, $6, $7,
				CASE WHEN $7 THEN NOW() ELSE NULL END, NOW()
			)
			RETURNING id, slug, title, excerpt, content, tags, author, published,
			          published_at, created_at, updated_at
		`, input.Slug, input.Title, input.Excerpt, input.Content, tagsJSON,
			input.Author, input.Published)
		return scanPost(row)
	}

	row := s.db.QueryRowContext(ctx, `
		UPDATE posts
		SET slug = $2,
		    title = $3,
		    excerpt = $4,
		    content = $5,
		    tags = $6::jsonb,
		    author = $7,
		    published = $8,
		    published_at = CASE
		        WHEN $8 AND published_at IS NULL THEN NOW()
		        WHEN NOT $8 THEN NULL
		        ELSE published_at
		    END,
		    updated_at = NOW()
		WHERE id = $1
		RETURNING id, slug, title, excerpt, content, tags, author, published,
		          published_at, created_at, updated_at
	`, input.ID, input.Slug, input.Title, input.Excerpt, input.Content,
		tagsJSON, input.Author, input.Published)
	return scanPost(row)
}

func (s *postgresStore) Delete(ctx context.Context, id int) error {
	result, err := s.db.ExecContext(ctx, `DELETE FROM posts WHERE id = $1`, id)
	if err != nil {
		return err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (s *postgresStore) CreateSession(ctx context.Context, token string, expiresAt time.Time) error {
	_, err := s.db.ExecContext(ctx, `
		DELETE FROM admin_sessions WHERE expires_at <= NOW()
	`)
	if err != nil {
		return err
	}
	_, err = s.db.ExecContext(ctx, `
		INSERT INTO admin_sessions (token_hash, expires_at)
		VALUES ($1, $2)
	`, hashToken(token), expiresAt)
	return err
}

func (s *postgresStore) ValidSession(ctx context.Context, token string) (bool, error) {
	var exists bool
	err := s.db.QueryRowContext(ctx, `
		SELECT EXISTS (
			SELECT 1
			FROM admin_sessions
			WHERE token_hash = $1 AND expires_at > NOW()
		)
	`, hashToken(token)).Scan(&exists)
	return exists, err
}

func (s *postgresStore) DeleteSession(ctx context.Context, token string) error {
	_, err := s.db.ExecContext(ctx, `
		DELETE FROM admin_sessions WHERE token_hash = $1
	`, hashToken(token))
	return err
}

type scanner interface {
	Scan(...any) error
}

func scanPost(row scanner) (*Post, error) {
	var post Post
	var tagsJSON []byte
	var publishedAt sql.NullTime
	err := row.Scan(
		&post.ID,
		&post.Slug,
		&post.Title,
		&post.Excerpt,
		&post.Content,
		&tagsJSON,
		&post.Author,
		&post.Published,
		&publishedAt,
		&post.CreatedAt,
		&post.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	if publishedAt.Valid {
		post.PublishedAt = publishedAt.Time
	} else {
		post.PublishedAt = post.CreatedAt
	}
	if err := json.Unmarshal(tagsJSON, &post.Tags); err != nil {
		return nil, fmt.Errorf("decode article tags: %w", err)
	}
	setPostCounts(&post)
	return &post, nil
}

func scanPosts(rows *sql.Rows) ([]Post, error) {
	var posts []Post
	for rows.Next() {
		post, err := scanPost(rows)
		if err != nil {
			return nil, err
		}
		posts = append(posts, *post)
	}
	return posts, rows.Err()
}

type markdownStore struct {
	posts []Post
}

type frontMatter struct {
	Title   string   `yaml:"title"`
	Date    string   `yaml:"date"`
	Excerpt string   `yaml:"excerpt"`
	Tags    []string `yaml:"tags"`
	Author  string   `yaml:"author"`
}

func loadMarkdownStore() *markdownStore {
	files, err := fs.Glob(content.Posts, "posts/*.md")
	if err != nil {
		log.Printf("Markdown archive scan failed: %v", err)
		return &markdownStore{}
	}

	posts := make([]Post, 0, len(files))
	for _, fileName := range files {
		source, readErr := fs.ReadFile(content.Posts, fileName)
		if readErr != nil {
			log.Printf("Markdown article read failed for %s: %v", fileName, readErr)
			continue
		}

		meta, body, parseErr := parseMarkdownFile(string(source))
		if parseErr != nil {
			log.Printf("Markdown article parse failed for %s: %v", fileName, parseErr)
			continue
		}

		publishedAt, dateErr := time.Parse("2006-01-02", meta.Date)
		if dateErr != nil {
			publishedAt = time.Time{}
		}
		author := meta.Author
		if author == "" {
			author = "João de Almeida"
		}
		post := Post{
			Slug:        strings.TrimSuffix(path.Base(fileName), path.Ext(fileName)),
			Title:       meta.Title,
			Excerpt:     meta.Excerpt,
			Content:     body,
			Tags:        meta.Tags,
			Author:      author,
			Published:   true,
			PublishedAt: publishedAt,
			CreatedAt:   publishedAt,
			UpdatedAt:   publishedAt,
		}
		setPostCounts(&post)
		posts = append(posts, post)
	}

	sort.Slice(posts, func(i, j int) bool {
		return posts[i].PublishedAt.After(posts[j].PublishedAt)
	})
	return &markdownStore{posts: posts}
}

func (s *markdownStore) ListPublished(context.Context) ([]Post, error) {
	posts := make([]Post, len(s.posts))
	copy(posts, s.posts)
	return posts, nil
}

func (s *markdownStore) GetPublished(_ context.Context, slug string) (*Post, error) {
	for _, post := range s.posts {
		if post.Slug == slug {
			copyOfPost := post
			return &copyOfPost, nil
		}
	}
	return nil, sql.ErrNoRows
}

func parseMarkdownFile(source string) (frontMatter, string, error) {
	var meta frontMatter
	if !strings.HasPrefix(source, "---\n") {
		return meta, "", errors.New("front matter is missing")
	}
	remainder := strings.TrimPrefix(source, "---\n")
	front, body, found := strings.Cut(remainder, "\n---\n")
	if !found {
		return meta, "", errors.New("front matter is incomplete")
	}
	if err := yaml.Unmarshal([]byte(front), &meta); err != nil {
		return meta, "", err
	}
	return meta, strings.TrimSpace(body), nil
}

func setPostCounts(post *Post) {
	post.WordCount = len(strings.Fields(post.Content))
	post.ReadTime = max(1, (post.WordCount+199)/200)
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
