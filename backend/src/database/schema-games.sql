-- =====================================================
-- GAMES EXTENSION MIGRATION
-- Run after main schema migration
-- =====================================================

-- Add session_id to game_sessions if not exist
ALTER TABLE game_sessions
  ADD COLUMN IF NOT EXISTS session_id INT REFERENCES sessions(id) ON DELETE SET NULL;

-- ────────────────────────────────────────────────────
-- QUIZ: Questions à choix multiples
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_questions (
    id          SERIAL PRIMARY KEY,
    game_id     INT REFERENCES games(id) ON DELETE CASCADE,
    question    TEXT NOT NULL,
    option_a    VARCHAR(200) NOT NULL,
    option_b    VARCHAR(200) NOT NULL,
    option_c    VARCHAR(200) NOT NULL,
    option_d    VARCHAR(200) NOT NULL,
    correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('a','b','c','d')),
    explanation TEXT,
    difficulty  VARCHAR(10) DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
    points      INT DEFAULT 10,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ────────────────────────────────────────────────────
-- PUZZLE: Données d'images à reconstituer
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_puzzles (
    id          SERIAL PRIMARY KEY,
    game_id     INT REFERENCES games(id) ON DELETE CASCADE,
    image_url   VARCHAR(300) NOT NULL,
    title       VARCHAR(150),
    grid_size   INT DEFAULT 3 CHECK (grid_size IN (2,3,4)),
    difficulty  VARCHAR(10) DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ────────────────────────────────────────────────────
-- WORD SCRAMBLE: Mots à déchiffrer
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_words (
    id            SERIAL PRIMARY KEY,
    game_id       INT REFERENCES games(id) ON DELETE CASCADE,
    original_word VARCHAR(50) NOT NULL,
    hint          VARCHAR(150),
    category      VARCHAR(50),
    points        INT DEFAULT 10,
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_game_questions_game ON game_questions(game_id);
CREATE INDEX IF NOT EXISTS idx_game_puzzles_game   ON game_puzzles(game_id);
CREATE INDEX IF NOT EXISTS idx_game_words_game     ON game_words(game_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_sess  ON game_sessions(session_id);
