-- =====================================================
-- CHAT MODULE — DATABASE MIGRATION
-- RAG chatbot: conversation tables + product embeddings
-- =====================================================
-- No pgvector required. Embeddings stored as native FLOAT[]
-- and cosine similarity is computed in Node.js.
-- This is fast enough for menus under ~500 products.
-- =====================================================

-- =====================================================
-- PRODUCTS — semantic embedding column
-- Populated by: npm run embed:products
-- Model: Gemini text-embedding-004 → 768 dimensions
-- =====================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS embedding FLOAT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMP;

-- =====================================================
-- CHAT MESSAGES
-- Full conversation log tied to anonymous table sessions.
-- sources: JSON array of { product_id, name, similarity } retrieved by RAG.
-- confidence: 0.000–1.000 similarity score of top retrieved document.
-- response_ms: end-to-end latency for analytics.
-- =====================================================

CREATE TABLE IF NOT EXISTS chat_messages (
  id           SERIAL PRIMARY KEY,
  session_id   INT REFERENCES sessions(id) ON DELETE CASCADE,
  role         TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content      TEXT NOT NULL,
  sources      JSONB,
  confidence   NUMERIC(4,3),
  response_ms  INT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session
  ON chat_messages(session_id, created_at);

-- =====================================================
-- CHAT PREFERENCES
-- Preferences learned through conversation, scoped to one session.
-- Persists across messages so Luna remembers "you prefer oat milk".
-- =====================================================

CREATE TABLE IF NOT EXISTS chat_preferences (
  session_id        INT PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,
  milk_type         TEXT,
  dietary_tags      TEXT[],
  budget_limit      NUMERIC(8,3),
  liked_product_ids INT[],
  language          TEXT DEFAULT 'en',
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
