-- ============================================================
-- Marketplace Tables Migration
-- Supabase (PostgreSQL)
-- ============================================================

-- 1. Creator Profiles
-- Stores UGC creators and influencers from faycom or veritabani sources
CREATE TABLE creator_profiles (
    id              SERIAL PRIMARY KEY,
    user_id         INT REFERENCES users(id) ON DELETE CASCADE,
    source          TEXT NOT NULL CHECK (source IN ('faycom', 'veritabani')),
    type            TEXT NOT NULL CHECK (type IN ('ugc', 'influencer')),
    tier            TEXT CHECK (tier IN ('micro', 'mid', 'macro', 'mega')),
    name            TEXT NOT NULL,
    city            TEXT,
    country         TEXT DEFAULT 'Türkiye',
    phone           TEXT,
    email           TEXT NOT NULL,
    instagram_url   TEXT,
    youtube_url     TEXT,
    linkedin_url    TEXT,
    tiktok_url      TEXT,
    x_url           TEXT,
    follower_count  INT DEFAULT 0,
    categories      JSONB DEFAULT '[]',
    brands_worked_with      TEXT[] DEFAULT '{}',
    ugc_video_price         NUMERIC(10,2),
    affiliate_commission_info TEXT,
    post_sharing_cost       NUMERIC(10,2),
    package_details         TEXT,
    media_kit_url   TEXT,
    portfolio_urls  JSONB DEFAULT '[]',
    avatar_url      TEXT,
    status          TEXT NOT NULL DEFAULT 'PENDING_APPROVAL'
                        CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED')),
    profile_views   INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 2. Supplier Profiles
-- Manufacturers and wholesalers offering production services
CREATE TABLE supplier_profiles (
    id              SERIAL PRIMARY KEY,
    user_id         INT REFERENCES users(id) ON DELETE CASCADE,
    source          TEXT NOT NULL CHECK (source IN ('faycom', 'veritabani')),
    company_name    TEXT NOT NULL,
    contact_person  TEXT,
    phone           TEXT,
    email           TEXT NOT NULL,
    website         TEXT,
    city            TEXT,
    type            TEXT NOT NULL CHECK (type IN ('uretici', 'toptanci')),
    category        TEXT,
    specialty       TEXT,
    brands_produced_for     TEXT[] DEFAULT '{}',
    marketplace_shopier     TEXT,
    marketplace_trendyol    TEXT,
    marketplace_n11         TEXT,
    marketplace_hepsiburada TEXT,
    marketplace_amazon_tr   TEXT,
    description     TEXT,
    status          TEXT NOT NULL DEFAULT 'PENDING_APPROVAL'
                        CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED')),
    profile_views   INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 3. Reviews
-- User reviews for creators and suppliers (one review per reviewer per target)
CREATE TABLE reviews (
    id                  SERIAL PRIMARY KEY,
    reviewer_user_id    INT NOT NULL REFERENCES users(id),
    target_type         TEXT NOT NULL CHECK (target_type IN ('creator', 'supplier')),
    target_id           INT NOT NULL,
    rating              INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    text                TEXT CHECK (char_length(text) <= 500),
    is_expert           BOOLEAN DEFAULT false,
    created_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE (reviewer_user_id, target_type, target_id)
);

-- 4. Notifications
-- In-app notifications for users
CREATE TABLE notifications (
    id          SERIAL PRIMARY KEY,
    user_id     INT NOT NULL REFERENCES users(id),
    type        TEXT NOT NULL,
    title       TEXT NOT NULL,
    body        TEXT,
    read        BOOLEAN DEFAULT false,
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- 5. Suspicious Activity
-- Logs for flagged or suspicious user behavior
CREATE TABLE suspicious_activity (
    id              SERIAL PRIMARY KEY,
    user_id         INT REFERENCES users(id),
    violation_type  TEXT NOT NULL,
    details         JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================

-- Creator lookups
CREATE INDEX idx_creator_profiles_source_status   ON creator_profiles (source, status);
CREATE INDEX idx_creator_profiles_type_status      ON creator_profiles (type, status);
CREATE INDEX idx_creator_profiles_follower_count   ON creator_profiles (follower_count);

-- Supplier lookups
CREATE INDEX idx_supplier_profiles_source_status   ON supplier_profiles (source, status);
CREATE INDEX idx_supplier_profiles_type_status     ON supplier_profiles (type, status);

-- Review lookups
CREATE INDEX idx_reviews_target                    ON reviews (target_type, target_id);
CREATE INDEX idx_reviews_reviewer_created          ON reviews (reviewer_user_id, created_at);

-- Notification lookups
CREATE INDEX idx_notifications_user_read           ON notifications (user_id, read);
