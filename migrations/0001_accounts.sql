CREATE TABLE IF NOT EXISTS classes (
  prefix TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY,
  code_hash TEXT NOT NULL UNIQUE,
  class_prefix TEXT NOT NULL REFERENCES classes(prefix) ON DELETE CASCADE,
  name TEXT NOT NULL,
  progress TEXT,
  revision INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER,
  saved_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS students_class_prefix_idx ON students(class_prefix);

CREATE TABLE IF NOT EXISTS teacher (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  code_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS login_failures (
  ip_hash TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL,
  PRIMARY KEY (ip_hash, window_start)
);
