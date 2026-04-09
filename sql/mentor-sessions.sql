-- ============================================================
-- Mentor Sessions Table
-- Supabase (PostgreSQL)
-- One row per user — stores conversation + user context
-- ============================================================

CREATE TABLE mentor_sessions (
  id          BIGSERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stage       INTEGER NOT NULL DEFAULT 1 CHECK (stage BETWEEN 1 AND 5),
  messages    JSONB NOT NULL DEFAULT '[]'::jsonb,
  user_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX idx_mentor_sessions_user ON mentor_sessions(user_id);
