-- 001_init.sql
-- Initial schema for Pricing & BoQ persistence (Phase 2)
-- Decisions incorporated:
-- - Integer cents for ALL monetary amounts
-- - Separate columns for description, unit, completed
-- - executionMethod & technicalNotes kept in JSON (meta/defaults) for now
-- - Rounding policy: Round Half Up to 2 decimals BEFORE converting to cents (see docs)
-- - Chain hashing deferred (no prev_hash/chain_hash yet)
-- - Diff table includes base_id for efficient lookups

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Schema migrations bookkeeping
CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT NOT NULL UNIQUE,
  applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- BoQ structural base
CREATE TABLE IF NOT EXISTS boq_bases (
  id TEXT PRIMARY KEY,
  tender_id TEXT NOT NULL,
  title TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_boq_bases_tender ON boq_bases(tender_id, is_active);

-- Items belonging to base structure
CREATE TABLE IF NOT EXISTS boq_base_items (
  id TEXT PRIMARY KEY,
  boq_base_id TEXT NOT NULL REFERENCES boq_bases(id) ON DELETE CASCADE,
  line_no TEXT NOT NULL,
  description TEXT NOT NULL,
  unit TEXT NOT NULL,
  quantity REAL NOT NULL,
  category TEXT,
  spec TEXT,
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_base_items_base ON boq_base_items(boq_base_id);
CREATE INDEX IF NOT EXISTS idx_base_items_line ON boq_base_items(boq_base_id, line_no);

-- Priced BoQ aggregate (one per pricing session/version)
CREATE TABLE IF NOT EXISTS priced_boqs (
  id TEXT PRIMARY KEY,
  boq_base_id TEXT NOT NULL REFERENCES boq_bases(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  status TEXT NOT NULL,
  currency TEXT NOT NULL,
  vat_rate INTEGER NOT NULL, -- stored as basis points (e.g. 1500 for 15.00%)
  totals_json TEXT,          -- JSON snapshot of totals (redundant, cached)
  defaults_json TEXT,        -- JSON of defaults (profitPct, adminPct, operationalPct, executionMethod, technicalNotes, etc.)
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  finalized_at TEXT,
  source_snapshot_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_priced_boqs_base ON priced_boqs(boq_base_id, version);

-- Priced items with flattened integer cent cost columns
CREATE TABLE IF NOT EXISTS priced_items (
  id TEXT PRIMARY KEY,
  priced_boq_id TEXT NOT NULL REFERENCES priced_boqs(id) ON DELETE CASCADE,
  base_item_id TEXT NOT NULL REFERENCES boq_base_items(id) ON DELETE CASCADE,
  line_no TEXT NOT NULL,
  quantity REAL NOT NULL,
  -- Monetary values in integer cents
  materials_cost INTEGER NOT NULL DEFAULT 0,
  labor_cost INTEGER NOT NULL DEFAULT 0,
  equipment_cost INTEGER NOT NULL DEFAULT 0,
  subcontract_cost INTEGER NOT NULL DEFAULT 0,
  admin_cost INTEGER NOT NULL DEFAULT 0,
  operational_cost INTEGER NOT NULL DEFAULT 0,
  profit_cost INTEGER NOT NULL DEFAULT 0,
  subtotal_cost INTEGER NOT NULL DEFAULT 0,
  unit_price INTEGER NOT NULL DEFAULT 0,  -- cents
  total_price INTEGER NOT NULL DEFAULT 0, -- cents
  breakdown_json TEXT,                    -- original granular arrays (materials, labor, equipment, subs, etc.)
  description TEXT NOT NULL,
  unit TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  is_priced INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_priced_items_priced ON priced_items(priced_boq_id);
CREATE INDEX IF NOT EXISTS idx_priced_items_baseitem ON priced_items(base_item_id);
CREATE INDEX IF NOT EXISTS idx_priced_items_completed ON priced_items(priced_boq_id, completed);

-- Snapshots for integrity & restoration
DROP TABLE IF EXISTS snapshots; -- ensure clean create in initial migration (safe first run)
CREATE TABLE snapshots (
  id TEXT PRIMARY KEY,
  boq_base_id TEXT NOT NULL REFERENCES boq_bases(id) ON DELETE CASCADE,
  priced_boq_id TEXT REFERENCES priced_boqs(id) ON DELETE SET NULL,
  integrity_hash TEXT NOT NULL,
  totals_hash TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  meta_json TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_snapshots_base ON snapshots(boq_base_id, created_at);

-- Diffs between snapshots / priced versions
CREATE TABLE IF NOT EXISTS diffs (
  id TEXT PRIMARY KEY,
  boq_base_id TEXT NOT NULL REFERENCES boq_bases(id) ON DELETE CASCADE,
  priced_boq_id TEXT REFERENCES priced_boqs(id) ON DELETE CASCADE,
  snapshot_id TEXT REFERENCES snapshots(id) ON DELETE SET NULL,
  diff_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_diffs_base ON diffs(boq_base_id, created_at);
CREATE INDEX IF NOT EXISTS idx_diffs_priced ON diffs(priced_boq_id);

-- Mark migration applied
INSERT OR IGNORE INTO schema_migrations(version) VALUES ('001_init');
