PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS behaviors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS behavior_exercises (
  behavior_id INTEGER NOT NULL REFERENCES behaviors(id) ON DELETE CASCADE,
  exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  strength INTEGER NOT NULL DEFAULT 3 CHECK (strength BETWEEN 1 AND 5),
  PRIMARY KEY (behavior_id, exercise_id)
);

CREATE TABLE IF NOT EXISTS dogs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  callname TEXT,
  birthdate TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  location TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS session_dogs (
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  dog_id INTEGER NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  PRIMARY KEY (session_id, dog_id)
);

CREATE TABLE IF NOT EXISTS rounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  dog_id INTEGER NOT NULL REFERENCES dogs(id) ON DELETE RESTRICT,
  exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  planned_behavior_id INTEGER NOT NULL REFERENCES behaviors(id) ON DELETE RESTRICT,
  exhibited_behavior_id INTEGER REFERENCES behaviors(id) ON DELETE SET NULL,
  exhibited_free_text TEXT,
  outcome TEXT NOT NULL CHECK (outcome IN ('success','partial','fail')),
  score INTEGER CHECK (score BETWEEN 0 AND 10),
  notes TEXT,
  started_at TEXT,
  ended_at TEXT
);
