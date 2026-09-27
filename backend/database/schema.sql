-- Tracked Products Table
CREATE TABLE IF NOT EXISTS tracked_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_product_id VARCHAR(64) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    selected_option_id VARCHAR(64) NOT NULL,
    selected_option_label VARCHAR(128) NOT NULL,
    option_axis VARCHAR(64) DEFAULT 'Option',
    product_url VARCHAR(512) NOT NULL,
    target_price_threshold NUMERIC(10, 2),
    is_active BOOLEAN DEFAULT true,
    last_scraped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_product_option UNIQUE (store_product_id, selected_option_id)
);

-- Scrape History & Log Table
CREATE TABLE IF NOT EXISTS scrape_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracked_product_id UUID REFERENCES tracked_products(id) ON DELETE CASCADE,
    store_product_id VARCHAR(64) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    selected_option VARCHAR(128) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    price NUMERIC(10, 2),       -- Must remain NULL on failed attempts
    stock INTEGER,              -- Must remain NULL on failed attempts
    outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('success', 'retried', 'failed')),
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scrape_history_product_timestamp 
    ON scrape_history(tracked_product_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_scrape_history_store_id 
    ON scrape_history(store_product_id);
