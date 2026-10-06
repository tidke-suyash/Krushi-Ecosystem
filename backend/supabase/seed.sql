-- Krushi Ecosystems Seed Data

-- 1. Apps
INSERT INTO apps (id, name, status, url, color, tag) VALUES
('AAHAR', 'AAHAR', 'active', 'http://localhost:5000/aahar/', '#4FA36E', 'Agricultural AI for harvest analysis & recommendation'),
('SETU', 'SETU', 'active', 'http://localhost:5000/setu/', '#3FA5B1', 'Smart e-market for trading & upliftment'),
('VANI', 'VANI', 'active', 'http://localhost:5000/vani/', '#F2900E', 'Village agri news & information')
ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, status = EXCLUDED.status;

-- 2. Demo User (mobile: 9876543210, email: farmer@krushi.in, password: Password123)
INSERT INTO users (id, mobile, email, password_hash, mobile_verified) VALUES
('11111111-1111-1111-1111-111111111111', '9876543210', 'farmer@krushi.in', '$2a$10$/j5CKocfIXFSGpFVKh6whuKFPbOqIS9w5QKlT29FGyKZTshocJARi', true)
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
('d15', '11111111-1111-1111-1111-111111111111', 'Soil testing &amp; crop advisory service', 'On-site soil sample testing with fertilizer and crop rotation advisory. Report within 48 hours.', 1500, 'services', 'Kolhapur, MH', 'New', 'In stock', '[0,1,2]'::jsonb, '{"Turnaround":"48 hours","Coverage":"District-wide"}'::jsonb, 'Anjali Pawar', 'Individual', 4.9, 670, 41, 22, 6, 'active'),
('d16', '11111111-1111-1111-1111-111111111111', 'Solar fencing kit for farm perimeter', 'Solar-powered fencing to keep wild animals off crops. Covers up to 2 acres, includes energizer unit.', 16800, 'other', 'Aurangabad, MH', 'New', 'In stock', '[0,1,2]'::jsonb, '{"Coverage":"2 acres","Warranty":"5 years"}'::jsonb, 'SunHeat Systems', 'Business', 4.5, 1050, 62, 17, 10, 'active')
ON CONFLICT (id) DO NOTHING;

-- 4. VANI Prototype Posts
INSERT INTO posts (id, user_id, author_name, space_id, type, title, body, source, summary, views) VALUES
('p1', '11111111-1111-1111-1111-111111111111', 'Krushi Editor', 'agri', 'news', 'Monsoon arrives early, farmers advised on sowing schedule', '', 'AgriTimes', 'The meteorological department reports an early monsoon onset across three states, prompting revised sowing advisories for kharif crops.', 100),
('p2', '11111111-1111-1111-1111-111111111111', 'Priya Iyer', 'agri', 'discussion', 'Best organic pesticide for tomato blight this season?', 'My tomato crop is showing early blight symptoms. Looking for organic options that have actually worked for people here.', '', '', 100),
('p3', '11111111-1111-1111-1111-111111111111', 'Krushi Editor', 'tech', 'news', 'Regional startup raises funding to expand rural broadband', '', 'TechDesk', 'A homegrown ISP announced a new funding round aimed at bringing fibre connectivity to under-served villages.', 100),
('p4', '11111111-1111-1111-1111-111111111111', 'Kabir Shah', 'tech', 'discussion', 'Which budget smartphone actually lasts 2+ years?', 'Looking for recommendations under 15k that will still feel usable after two years of daily use.', '', '', 100),
('p5', '11111111-1111-1111-1111-111111111111', 'Krushi Editor', 'politics', 'news', 'New rural infrastructure bill clears committee stage', '', 'The Ledger', 'The proposed bill allocates funding for road and market-yard upgrades in over 400 districts nationwide.', 100),
('p6', '11111111-1111-1111-1111-111111111111', 'Krushi Editor', 'business', 'news', 'Wholesale vegetable prices dip after bumper harvest', '', 'MarketWatch', 'Mandi prices for onion and tomato have eased over the past week as supply from the recent harvest reaches markets.', 100),
('p7', '11111111-1111-1111-1111-111111111111', 'Krushi Editor', 'sports', 'news', 'Local cricket academy sends five players to state trials', '', 'SportsLine', 'A district-level academy has seen its largest ever cohort selected for state-level trials this season.', 100),
('p8', '11111111-1111-1111-1111-111111111111', 'Divya Menon', 'science', 'discussion', 'Explainer: why this year’s heatwaves are lasting longer', 'Been reading about heat dome patterns — does anyone have good sources explaining why these events are getting more persistent?', '', '', 100),
('p9', '11111111-1111-1111-1111-111111111111', 'Krushi Editor', 'education', 'news', 'State announces revised scholarship criteria for rural students', '', 'EduBeat', 'Income and residency thresholds have been updated for the upcoming academic year’s scholarship cycle.', 100),
('p10', '11111111-1111-1111-1111-111111111111', 'Krushi Editor', 'local', 'news', 'New water treatment plant to serve twelve villages', '', 'District Herald', 'Construction begins this month on a facility expected to improve drinking water access across the block.', 100),
('p11', '11111111-1111-1111-1111-111111111111', 'Farhan Ali', 'entertainment', 'discussion', 'Underrated regional films worth watching this month', 'Looking to expand beyond the usual big releases — what regional cinema has impressed you recently?', '', '', 100)
ON CONFLICT (id) DO NOTHING;
