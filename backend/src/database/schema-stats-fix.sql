-- =====================================================
-- STATS SCHEMA FIX MIGRATION
-- Aligns daily_stats and daily_product_stats with StatsModel
-- =====================================================

-- Add missing columns to daily_product_stats
ALTER TABLE daily_product_stats
  ADD COLUMN IF NOT EXISTS revenue DECIMAL(10,2) DEFAULT 0;

-- Add missing columns to daily_stats
ALTER TABLE daily_stats
  ADD COLUMN IF NOT EXISTS total_customers INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_preparation_time_minutes FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loyalty_usage_rate FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add loyalty_points_used to orders (referenced by StatsModel loyalty query)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS loyalty_points_used INT DEFAULT 0;

-- Unique constraint on daily_product_stats (required for ON CONFLICT)
DO $$ BEGIN
  ALTER TABLE daily_product_stats ADD CONSTRAINT daily_product_stats_product_date_uniq UNIQUE (product_id, date);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- Index for stats queries
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders (DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats (date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_product_stats_date ON daily_product_stats (date DESC);
