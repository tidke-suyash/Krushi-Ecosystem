-- ============================================================================
-- KRUSHI ECOSYSTEMS — COMPLETE SUPABASE DATABASE SETUP SCRIPT
-- Paste this entire file into the Supabase SQL Editor and click "RUN"
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Users Table (Central Krushi Account)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    mobile_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ----------------------------------------------------------------------------
-- 2. Profiles Table (Shared across AAHAR, SETU, VANI)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 3. Ecosystem Apps Registry
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS apps (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    url TEXT,
    color VARCHAR(30),
    tag TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 4. User Enabled Apps (Which Krushi apps belong to user)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_apps (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    app_id VARCHAR(50) REFERENCES apps(id) ON DELETE CASCADE,
    enabled_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, app_id)
);

-- ----------------------------------------------------------------------------
-- 5. SSO Authorization Codes (Short-lived, single use)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 6. Lightweight App Settings / Preferences
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_data (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    app_id VARCHAR(50) REFERENCES apps(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, app_id, key)
);

-- ----------------------------------------------------------------------------
-- 7. AAHAR Conversations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(100) PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);

-- ----------------------------------------------------------------------------
-- 8. AAHAR Messages
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(100) PRIMARY KEY,
    conversation_id VARCHAR(100) REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'ai')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);

-- ----------------------------------------------------------------------------
-- 9. SETU Products / Listings
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 10. SETU Saved Products (Wishlist)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_products (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id VARCHAR(100) REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, product_id)
);

-- ----------------------------------------------------------------------------
-- 11. SETU Orders
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 12. VANI Posts (News and Discussions)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 13. VANI Comments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(100) PRIMARY KEY,
    post_id VARCHAR(100) REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(255),
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);

-- ----------------------------------------------------------------------------
-- 14. VANI Votes (Enforce one vote per user per post)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS votes (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    post_id VARCHAR(100) REFERENCES posts(id) ON DELETE CASCADE,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('up', 'down')),
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, post_id)
);


-- ============================================================================
-- INITIAL SEED DATA
-- ============================================================================

-- 1. Apps Registry
INSERT INTO apps (id, name, status, url, color, tag) VALUES
('AAHAR', 'AAHAR', 'active', 'http://localhost:5000/aahar/', '#4FA36E', 'Agricultural AI for harvest analysis & recommendation'),
('SETU', 'SETU', 'active', 'http://localhost:5000/setu/', '#3FA5B1', 'Smart e-market for trading & upliftment'),
('VANI', 'VANI', 'active', 'http://localhost:5000/vani/', '#F2900E', 'Village agri news & information')
ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, status = EXCLUDED.status;

-- 2. Demo User (mobile: 9876543210, email: farmer@krushi.in, password: Password123)
INSERT INTO users (id, mobile, email, password_hash, mobile_verified) VALUES
('11111111-1111-1111-1111-111111111111', '9876543210', 'farmer@krushi.in', '$2a$10$Xo7q4h6ZJpZg6zQ9g2kS7O9bZ6Wz8l5C5B9Y9G6E7D8F9A0B1C2D3', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (user_id, name, mobile, village, district, role, language, crops, email) VALUES
('11111111-1111-1111-1111-111111111111', 'Ashwin Patel', '9876543210', 'Khed', 'Pune', 'Farmer', 'English', 'Cotton, Wheat, Soybean', 'farmer@krushi.in')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_apps (user_id, app_id) VALUES
('11111111-1111-1111-1111-111111111111', 'AAHAR'),
('11111111-1111-1111-1111-111111111111', 'SETU'),
('11111111-1111-1111-1111-111111111111', 'VANI')
ON CONFLICT (user_id, app_id) DO NOTHING;

-- 3. SETU Prototype Products
INSERT INTO products (id, seller_user_id, title, description, price, category, location, condition, availability, images, specs, seller_name, seller_type, rating, views, saves, enquiries, shares, status) VALUES
('d1', '11111111-1111-1111-1111-111111111111', 'Mahindra 265 DI Tractor, well maintained', 'Second owner, recently serviced with new tyres. Ideal for small to mid-size farms. All documents clear.', 410000, 'tractors', 'Nashik, MH', 'Used', 'In stock', '[0,1,2]'::jsonb, '{"Hours used":"1,900","Fuel":"Diesel","HP":"42","Year":"2018"}'::jsonb, 'Ravindra Patil', 'Individual', 4.6, 2450, 183, 47, 92, 'active'),
('d2', '11111111-1111-1111-1111-111111111111', 'Basmati rice, 25kg sacks, premium grade', 'Aged basmati rice, long grain, sourced directly from mill. Bulk orders welcome with delivery.', 1850, 'crops', 'Karnal, HR', 'New', 'In stock', '[0,1,2]'::jsonb, '{"Grain length":"Extra long","Bag size":"25kg","Grade":"Premium"}'::jsonb, 'Haryana Grain Traders', 'Business', 4.8, 5120, 340, 88, 150, 'active'),
('d3', '11111111-1111-1111-1111-111111111111', 'Mahindra Jeeto mini truck for farm produce', '2020 model pickup, ideal for hauling produce to mandi. 14,000 km driven, always garaged.', 412000, 'tractors', 'Nagpur, MH', 'Used', 'In stock', '[0,1,2]'::jsonb, '{"KM driven":"14,000","Year":"2020","Load capacity":"600kg"}'::jsonb, 'Aditya Deshmukh', 'Individual', 4.5, 3210, 210, 52, 60, 'active'),
('d4', '11111111-1111-1111-1111-111111111111', 'Diesel water pump set, 5HP', 'Brand new, unused. Suitable for borewell and open well irrigation. 1 year manufacturer warranty.', 18500, 'irrigation', 'Aurangabad, MH', 'New', 'In stock', '[0,1,2]'::jsonb, '{"Power":"5HP","Warranty":"1 year","Type":"Diesel"}'::jsonb, 'FarmTech Supplies', 'Business', 4.4, 980, 64, 19, 12, 'active'),
('d5', '11111111-1111-1111-1111-111111111111', '10 Jersey cross dairy cows, healthy stock', 'Healthy, vaccinated dairy herd averaging 12L/day per cow. Health records available on request.', 520000, 'livestock', 'Nashik, MH', 'Used', 'In stock', '[0,1,2]'::jsonb, '{"Breed":"Jersey cross","Avg yield":"12L/day","Age range":"2-4 years"}'::jsonb, 'Sneha Kulkarni', 'Individual', 4.2, 640, 38, 9, 5, 'active'),
('d6', '11111111-1111-1111-1111-111111111111', 'Organic wheat seeds, certified, 50kg', 'Certified organic wheat seed, high germination rate. Suitable for rabi season sowing.', 2600, 'seeds', 'Solapur, MH', 'New', 'In stock', '[0,1,2]'::jsonb, '{"Germination rate":"92%","Bag size":"50kg","Season":"Rabi"}'::jsonb, 'Weavers Seed Co.', 'Business', 4.7, 1220, 96, 14, 22, 'active'),
('d7', '11111111-1111-1111-1111-111111111111', 'Fresh tomatoes, wholesale, daily supply', 'Farm-fresh tomatoes, daily harvest, wholesale rate per kg. Direct pickup or delivery to local mandi.', 18, 'produce', 'Kolhapur, MH', 'New', 'Limited', '[0,1,2]'::jsonb, '{"Unit":"per kg","Harvest":"Daily"}'::jsonb, 'Meera Joshi', 'Individual', 4.3, 410, 22, 6, 3, 'active'),
('d8', '11111111-1111-1111-1111-111111111111', 'Borewell drilling service, per site', 'Professional borewell drilling with equipment and crew. Site survey included in quote.', 25000, 'services', 'Latur, MH', 'New', 'In stock', '[0,1,2]'::jsonb, '{"Experience":"12 years","Team size":"6"}'::jsonb, 'Deep Bore Solutions', 'Business', 4.5, 1580, 70, 41, 18, 'active'),
('d9', '11111111-1111-1111-1111-111111111111', 'Free-range country chicken, 50 birds', 'Healthy free-range desi birds, vaccinated, ready for sale as breeding or table stock.', 22500, 'dairy', 'Pune, MH', 'Used', 'In stock', '[0,1,2]'::jsonb, '{"Count":"50 birds","Age":"5-6 months"}'::jsonb, 'Vikram Rao', 'Individual', 4.1, 890, 55, 15, 8, 'active'),
('d10', '11111111-1111-1111-1111-111111111111', 'Rotavator, 6 feet, heavy duty', 'Well maintained rotavator, blades replaced last season. Compatible with 35-50 HP tractors.', 47000, 'machinery', 'Jalgaon, MH', 'Used', 'In stock', '[0,1,2]'::jsonb, '{"Width":"6 ft","Blade type":"L-type"}'::jsonb, 'Prakash More', 'Individual', 4.4, 1340, 88, 29, 11, 'active'),
('d11', '11111111-1111-1111-1111-111111111111', 'NPK fertilizer, 50kg bags, bulk order', 'Balanced NPK mix suitable for most kharif and rabi crops. Bulk discount for 20+ bags.', 1450, 'seeds', 'Nagpur, MH', 'New', 'In stock', '[0,1,2]'::jsonb, '{"Ratio":"19:19:19","Bag size":"50kg"}'::jsonb, 'Kunal Mehta', 'Individual', 4, 2100, 130, 34, 19, 'active'),
('d12', '11111111-1111-1111-1111-111111111111', 'Bullock cart, wooden, restored', 'Traditional wooden cart, recently restored wheels and frame. Sold as-is.', 9500, 'other', 'Solapur, MH', 'Refurbished', 'Out of stock', '[0,1,2]'::jsonb, '{"Wheel type":"Iron-rimmed wood"}'::jsonb, 'Ganesh Shinde', 'Individual', 4.3, 520, 31, 8, 4, 'active'),
('d13', '11111111-1111-1111-1111-111111111111', 'Drip irrigation kit, 1 acre coverage', 'Complete drip kit with filters and emitters, covers up to 1 acre. Installation guide included.', 14200, 'irrigation', 'Pune, MH', 'New', 'In stock', '[0,1,2]'::jsonb, '{"Coverage":"1 acre","Warranty":"1 year"}'::jsonb, 'ComfortIrrigation Co.', 'Business', 4.6, 760, 48, 12, 9, 'active'),
('d14', '11111111-1111-1111-1111-111111111111', 'Buffalo, high milk yield, vaccinated', 'Murrah buffalo, 3rd lactation, currently yielding 9L/day. Fully vaccinated with health card.', 68000, 'livestock', 'Nashik, MH', 'Used', 'In stock', '[0,1,2]'::jsonb, '{"Breed":"Murrah","Yield":"9L/day","Lactation":"3rd"}'::jsonb, 'Ramesh Yadav', 'Individual', 3.9, 390, 14, 5, 2, 'active'),
('d15', '11111111-1111-1111-1111-111111111111', 'Soil testing & crop advisory service', 'On-site soil sample testing with fertilizer and crop rotation advisory. Report within 48 hours.', 1500, 'services', 'Kolhapur, MH', 'New', 'In stock', '[0,1,2]'::jsonb, '{"Turnaround":"48 hours","Coverage":"District-wide"}'::jsonb, 'Anjali Pawar', 'Individual', 4.9, 670, 41, 22, 6, 'active'),
('d16', '11111111-1111-1111-1111-111111111111', 'Solar fencing kit for farm perimeter', 'Solar-powered fencing to keep wild animals off crops. Covers up to 2 acres, includes energizer unit.', 16800, 'other', 'Aurangabad, MH', 'New', 'In stock', '[0,1,2]'::jsonb, '{"Coverage":"2 acres","Warranty":"5 years"}'::jsonb, 'SunHeat Systems', 'Business', 4.5, 1050, 62, 17, 10, 'active')
ON CONFLICT (id) DO NOTHING;

-- 4. VANI Prototype Posts
INSERT INTO posts (id, user_id, author_name, space_id, type, title, body, source, summary, views) VALUES
('p1', '11111111-1111-1111-1111-111111111111', 'Krushi Editor', 'agri', 'news', 'Monsoon arrives early, farmers advised on sowing schedule', '', 'AgriTimes', 'The meteorological department reports an early monsoon onset across three states, prompting revised sowing advisories for kharif crops.', 100),
('p2', '11111111-1111-1111-1111-111111111111', 'Priya Iyer', 'agri', 'discussion', 'Best organic pesticide for tomato blight this season?', 'My tomato crop is showing early blight symptoms. Looking for organic options that have actually worked for people here.', '', '', 100),
('p3', '11111111-1111-1111-1111-111111111111', 'Krushi Editor', 'tech', 'news', 'Regional startup raises funding to expand rural broadband', '', 'TechDesk', 'A homegrown ISP announced a new funding round aimed at bringing fibre connectivity to under-served villages.', 100),
('p4', '11111111-1111-1111-1111-111111111111', 'Kabir Shah', 'tech', 'discussion', 'Which budget smartphone actually lasts 2+ years?', 'Looking for recommendations under 15k that will still feel usable after two years of daily use.', '', '', 100),
('p5', '11111111-1111-1111-1111-111111111111', 'Krushi Editor', 'politics', 'news', 'New rural infrastructure bill clears committee stage', '', 'NationalWire', 'A parliamentary committee gave its nod to the rural roads and cold storage expansion bill after minor amendments.', 100),
('p6', '11111111-1111-1111-1111-111111111111', 'Krushi Editor', 'business', 'news', 'Wholesale vegetable prices dip after bumper harvest', '', 'MarketWatch', 'Arrivals at regional APMC yards surged 30% this week, cooling retail vegetable prices across urban centres.', 100),
('p7', '11111111-1111-1111-1111-111111111111', 'Krushi Editor', 'sports', 'news', 'Local cricket academy sends five players to state trials', '', 'SportPulse', 'A district-level cricket academy in Maharashtra has produced five selections for the upcoming state under-19 selection camp.', 100),
('p8', '11111111-1111-1111-1111-111111111111', 'Sunita Devi', 'science', 'discussion', 'Explainer: why this year’s heatwaves are lasting longer', 'A short breakdown of the atmospheric blocking patterns causing prolonged heat domes over central agricultural belts.', '', '', 100),
('p9', '11111111-1111-1111-1111-111111111111', 'Krushi Editor', 'education', 'news', 'State announces revised scholarship criteria for rural students', '', 'EduNotice', 'Students from farming households with landholdings under 5 acres will now receive an additional stipend under the revised scheme.', 100),
('p10', '11111111-1111-1111-1111-111111111111', 'Krushi Editor', 'local', 'news', 'New water treatment plant to serve twelve villages', '', 'DistrictChronicle', 'Construction on the taluka water treatment plant concluded today, with trial runs scheduled to begin next Monday.', 100),
('p11', '11111111-1111-1111-1111-111111111111', 'Arjun Rao', 'entertainment', 'discussion', 'Underrated regional films worth watching this weekend', 'Sharing five regional films from the last two years that tell authentic rural stories without the usual tropes.', '', '', 100)
ON CONFLICT (id) DO NOTHING;
