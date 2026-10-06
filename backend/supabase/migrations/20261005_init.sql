-- Krushi Ecosystems Database Schema Migration
-- Unified identity, Shared Profile, SSO, AAHAR, SETU, and VANI

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table (Core Krushi Account)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    mobile_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index on mobile & email for fast login lookup
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Profiles Table (Shared across AAHAR, SETU, VANI)
CREATE TABLE IF NOT EXISTS profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(30) NOT NULL,
    village VARCHAR(255),
    district VARCHAR(255),
    role VARCHAR(100) DEFAULT 'Farmer',
    language VARCHAR(50) DEFAULT 'English',
    crops TEXT,
    email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Ecosystem Apps Registry
CREATE TABLE IF NOT EXISTS apps (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    url TEXT,
    color VARCHAR(30),
    tag TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. User Enabled Apps (Which Krushi apps belong to user)
CREATE TABLE IF NOT EXISTS user_apps (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    app_id VARCHAR(50) REFERENCES apps(id) ON DELETE CASCADE,
    enabled_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, app_id)
);

-- 5. SSO Authorization Codes (Short-lived, single use)
CREATE TABLE IF NOT EXISTS auth_codes (
    code VARCHAR(128) PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    app_id VARCHAR(50) REFERENCES apps(id) ON DELETE CASCADE,
    redirect_uri TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_codes_user ON auth_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_codes_expires ON auth_codes(expires_at);

-- 6. Lightweight App Settings / Preferences
CREATE TABLE IF NOT EXISTS app_data (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    app_id VARCHAR(50) REFERENCES apps(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, app_id, key)
);

-- 7. AAHAR Conversations
CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(100) PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);

-- 8. AAHAR Messages
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(100) PRIMARY KEY,
    conversation_id VARCHAR(100) REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'ai')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);

-- 9. SETU Products / Listings
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(100) PRIMARY KEY,
    seller_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    condition VARCHAR(50),
    availability VARCHAR(50) DEFAULT 'In stock',
    images JSONB DEFAULT '[]'::jsonb,
    specs JSONB DEFAULT '{}'::jsonb,
    seller_name VARCHAR(255),
    seller_type VARCHAR(100) DEFAULT 'Individual',
    rating NUMERIC(3, 1) DEFAULT 4.5,
    views INT DEFAULT 0,
    saves INT DEFAULT 0,
    enquiries INT DEFAULT 0,
    shares INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_user_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- 10. SETU Saved Products (Wishlist)
CREATE TABLE IF NOT EXISTS saved_products (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id VARCHAR(100) REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, product_id)
);

-- 11. SETU Orders
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(100) PRIMARY KEY,
    buyer_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id VARCHAR(100) REFERENCES products(id) ON DELETE SET NULL,
    product_title VARCHAR(255),
    quantity INT DEFAULT 1,
    price NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    seller_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_user_id);

-- 12. VANI Posts (News and Discussions)
CREATE TABLE IF NOT EXISTS posts (
    id VARCHAR(100) PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(255),
    space_id VARCHAR(50) NOT NULL,
    type VARCHAR(50) DEFAULT 'news' CHECK (type IN ('news', 'discussion')),
    title VARCHAR(500) NOT NULL,
    body TEXT,
    source VARCHAR(255),
    summary TEXT,
    views INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_space ON posts(space_id);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);

-- 13. VANI Comments
CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(100) PRIMARY KEY,
    post_id VARCHAR(100) REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(255),
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);

-- 14. VANI Votes (Enforce one vote per user per post)
CREATE TABLE IF NOT EXISTS votes (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    post_id VARCHAR(100) REFERENCES posts(id) ON DELETE CASCADE,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('up', 'down')),
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, post_id)
);
