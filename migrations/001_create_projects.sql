CREATE TABLE IF NOT EXISTS projects (
  id BIGSERIAL PRIMARY KEY,
  repo_full_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  tools TEXT[] NOT NULL DEFAULT '{}',
  repo_url TEXT,
  demo_url TEXT,
  cover_image TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  date DATE,
  content_markdown TEXT NOT NULL,
  content_html TEXT NOT NULL,
  frontmatter JSONB NOT NULL DEFAULT '{}'::jsonb,
  sha TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (repo_full_name, file_path)
);

CREATE INDEX IF NOT EXISTS projects_featured_date_idx
  ON projects (featured DESC, date DESC NULLS LAST, updated_at DESC);

CREATE INDEX IF NOT EXISTS projects_slug_idx
  ON projects (slug);
