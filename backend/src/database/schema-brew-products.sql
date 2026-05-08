-- =====================================================
-- BREW PRODUCTS — Schema Extension
-- Adds rich product metadata columns + faqs table
-- Run after schema.sql and schema-chat.sql
-- =====================================================

-- =====================================================
-- EXTEND category_type ENUM
-- NOTE: ALTER TYPE ADD VALUE runs outside any transaction
--       (autocommit). The migration runner must NOT wrap
--       these in BEGIN/COMMIT.
-- =====================================================

ALTER TYPE category_type ADD VALUE IF NOT EXISTS 'coffee';
ALTER TYPE category_type ADD VALUE IF NOT EXISTS 'cold';
ALTER TYPE category_type ADD VALUE IF NOT EXISTS 'special';
ALTER TYPE category_type ADD VALUE IF NOT EXISTS 'food';

-- =====================================================
-- PRODUCTS — Extended metadata columns
-- Populated by: npm run seed:brew
-- =====================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS name_en VARCHAR(150);
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS dietary_tags TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS allergens TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredients TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS temperature VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS preparation_time VARCHAR(30);
ALTER TABLE products ADD COLUMN IF NOT EXISTS popularity_score NUMERIC(4,3);
ALTER TABLE products ADD COLUMN IF NOT EXISTS keywords TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS metadata JSONB;

-- =====================================================
-- FAQS
-- Operational FAQs searchable by the RAG chatbot.
-- Embedded by: npm run embed:products
-- =====================================================

CREATE TABLE IF NOT EXISTS faqs (
  id                    SERIAL PRIMARY KEY,
  question              TEXT NOT NULL,
  question_en           TEXT,
  answer                TEXT NOT NULL,
  category              VARCHAR(50),
  keywords              TEXT[],
  embedding             FLOAT[],
  embedding_updated_at  TIMESTAMP,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
