# Krushi Ecosystems — Unified Backend & Database Integration

Connected backend API layer, PostgreSQL database schema, SSO authentication, and Google Gemini AI integration for the **Krushi Ecosystems** agricultural platform:
- **AAHAR**: Agricultural AI assistant powered by Google Gemini
- **SETU**: Agricultural marketplace for crops, machinery, livestock, and equipment
- **VANI**: Village agricultural news and community discussions
- **Krushi Ecosystems Login**: Central account, authentication, and shared profile system

---

## 🏛️ Ecosystem Architecture

```text
                     KRUSHI ACCOUNT (Central Auth & SSO)
                                    |
                           Shared User Profile
                    (Name, Mobile, Location, Role, Crops)
                                    |
            ┌───────────────────────┼───────────────────────┐
            ↓                       ↓                       ↓
          AAHAR                   SETU                    VANI
    (AI Agronomist)           (Marketplace)           (Discussions)
            |                       |                       |
            └───────────────────────┼───────────────────────┘
                                    ↓
                       Node.js + Express.js API
                                    ↓
                 ┌──────────────────┴──────────────────┐
                 ↓                                     ↓
        Supabase PostgreSQL                     Google Gemini AI
      (Unified Identity & Data)              (Agricultural Intelligence)
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or higher recommended, tested on Node.js v24)
- **npm** (comes with Node.js)
- **Supabase Account** (free tier at [supabase.com](https://supabase.com))
- **Google AI Studio Account** (for Gemini API Key at [aistudio.google.com](https://aistudio.google.com))

---

### 2. Installation

Navigate to the `backend` directory and install dependencies:

```bash
cd backend
npm install
```

The installed packages:
- `express` (v4.21.2) — Web framework for API endpoints
- `cors` (v2.8.5) — Cross-origin resource sharing
- `@supabase/supabase-js` (v2.49.1) — Supabase PostgreSQL client
- `@google/generative-ai` (v0.24.1) — Google Gemini AI SDK
- `jsonwebtoken` (v9.0.2) — JWT token creation and verification
- `bcryptjs` (v2.4.3) — Secure password hashing
- `dotenv` (v16.4.7) — Environment variable management
- `express-rate-limit` (v7.5.0) — API rate limiting protection
- `uuid` (v11.1.0) — Universally Unique Identifiers

---

### 3. Environment Variables Configuration

Create a `.env` file in the `backend/` directory by copying `.env.example`:

```bash
cp .env.example .env
```

Edit `backend/.env` with your credentials:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase PostgreSQL Database Credentials
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google Gemini API Key
GEMINI_API_KEY=your-gemini-api-key

# JWT Secret for Session Tokens
JWT_SECRET=krushi_ecosystems_secure_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# Central App & SSO URLs
FRONTEND_AUTH_URL=http://localhost:5000/login/
AAHAR_URL=http://localhost:5000/aahar/
SETU_URL=http://localhost:5000/setu/
VANI_URL=http://localhost:5000/vani/

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5000,http://127.0.0.1:5500,http://localhost:3000,null
```

> **Note on Local Fallback Mode:**  
> If Supabase credentials or Gemini API key are left as placeholders during initial local exploration, the backend automatically runs in **local in-memory fallback mode** pre-seeded with all prototype products, posts, and demo account (`farmer@krushi.in` / `9876543210` / `Password123`), ensuring zero setup friction. Once real credentials are supplied, it automatically utilizes Supabase PostgreSQL and Google Gemini.

---

### 4. Supabase Database Migration & Seeding

1. Open your project dashboard at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** tab.
3. Open `backend/supabase/migrations/20261005_init.sql` and run the script. This creates all tables:
   - `users` — Primary account table (UUID, mobile, email, password_hash)
   - `profiles` — Shared user profile (name, mobile, village, district, role, language, crops)
   - `apps` — Ecosystem apps registry (AAHAR, SETU, VANI)
   - `user_apps` — Which applications belong to each user
   - `auth_codes` — Single-use, short-lived SSO authorization codes
   - `conversations` & `messages` — AAHAR chat history
   - `products` — SETU marketplace listings
   - `saved_products` — SETU saved wishlist items
   - `orders` — SETU buyer orders
   - `posts`, `comments`, `votes` — VANI discussions and news
   - `app_data` — Lightweight app-specific preferences
4. Open `backend/supabase/seed.sql` and run the script. This populates:
   - All 3 Krushi applications (AAHAR, SETU, VANI)
   - Demo Farmer Account (`9876543210` / `farmer@krushi.in` / `Password123`)
   - 16 prototype SETU agricultural marketplace products
   - 11 prototype VANI agricultural posts and news

---

### 5. Start the Backend Server

To start in production mode:
```bash
npm start
```

To start in development mode with auto-reload:
```bash
npm run dev
```

The server listens on port `5000` and immediately hosts all four frontend applications:
- **Central Krushi Portal**: [http://localhost:5000/login/](http://localhost:5000/login/)
- **AAHAR Assistant**: [http://localhost:5000/aahar/](http://localhost:5000/aahar/)
- **SETU Marketplace**: [http://localhost:5000/setu/](http://localhost:5000/setu/)
- **VANI Discussions**: [http://localhost:5000/vani/](http://localhost:5000/vani/)
- **Health Check**: [http://localhost:5000/health](http://localhost:5000/health)

---

## ⚙️ Frontend URL Configuration

Each frontend application contains a prominent, centralized configuration slot (`KRUSHI_CONFIG`) at the top of its `<script>` tag:

```javascript
/* ==========================================================================
   KRUSHI ECOSYSTEMS CENTRAL CONFIGURATION
   ========================================================================== */
const KRUSHI_CONFIG = {
  API_BASE: window.location.origin.startsWith('http') ? window.location.origin : 'http://localhost:5000',
  AUTH_URL: (window.location.origin.startsWith('http') ? window.location.origin : 'http://localhost:5000') + '/login/',
  AAHAR_URL: (window.location.origin.startsWith('http') ? window.location.origin : 'http://localhost:5000') + '/aahar/',
  SETU_URL: (window.location.origin.startsWith('http') ? window.location.origin : 'http://localhost:5000') + '/setu/',
  VANI_URL: (window.location.origin.startsWith('http') ? window.location.origin : 'http://localhost:5000') + '/vani/',
  APP_ID: 'AAHAR' // 'SETU' or 'VANI'
};
```

When deploying to a remote host (e.g. AWS, Render, Railway, Vercel), simply update `API_BASE` or rely on dynamic `window.location.origin`.

---

## 📡 API Endpoints Reference

### 1. Central Authentication & Profile
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Server health status |
| `POST` | `/auth/register` | Public | Register user, profile, and user_apps |
| `POST` | `/auth/login` | Public | Login via mobile/email and password; returns JWT & profile |
| `POST` | `/auth/sso-code` | Bearer Token | Generate single-use SSO authorization code |
| `POST` | `/auth/exchange` | Public | Exchange SSO authorization code for JWT & shared profile |
| `POST` | `/auth/logout` | Bearer Token | User logout |
| `GET` | `/me` | Bearer Token | Fetch current user shared profile & active apps |
| `PATCH` | `/me/profile` | Bearer Token | Update shared profile (visible across all apps) |
| `POST` | `/me/apps/:appId` | Bearer Token | Enable an application for current user |
| `GET` | `/apps` | Public | List all ecosystem applications |

### 2. AAHAR (Agricultural AI Assistant)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/aahar/chat` | Bearer Token | Submit query to Gemini AI with farmer profile context |
| `GET` | `/aahar/conversations` | Bearer Token | Retrieve conversation history for current user |
| `GET` | `/aahar/conversations/:id` | Bearer Token | Retrieve single conversation with all messages |
| `POST` | `/aahar/conversations` | Bearer Token | Create new conversation |
| `POST` | `/aahar/conversations/:id/clear` | Bearer Token | Clear messages in a conversation |
| `DELETE` | `/aahar/conversations/:id` | Bearer Token | Delete specific conversation |
| `DELETE` | `/aahar/conversations` | Bearer Token | Wipe all conversations for current user |

### 3. SETU (Agricultural Marketplace)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/setu/products` | Optional | Browse & search products (filters: `cat`, `q`, `sort`) |
| `GET` | `/setu/products/:id` | Optional | Product details |
| `POST` | `/setu/products` | Bearer Token | Create a marketplace product listing |
| `PATCH` | `/setu/products/:id` | Bearer Token | Update product listing (seller only) |
| `DELETE` | `/setu/products/:id` | Bearer Token | Delete product listing (seller only) |
| `GET` | `/setu/my-listings` | Bearer Token | Fetch listings created by current user |
| `GET` | `/setu/saved` | Bearer Token | Fetch saved product IDs |
| `POST` | `/setu/saved/:id` | Bearer Token | Toggle save / unsave product |
| `GET` | `/setu/orders` | Bearer Token | Fetch buyer orders |
| `POST` | `/setu/orders` | Bearer Token | Place an order |

### 4. VANI (News & Community Discussions)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/vani/spaces` | Public | List all discussion spaces |
| `GET` | `/vani/posts` | Optional | List posts (filters: `space`, `q`) |
| `GET` | `/vani/posts/:id` | Optional | Post details with comments |
| `POST` | `/vani/posts` | Bearer Token | Create news or discussion post |
| `GET` | `/vani/posts/:id/comments` | Public | List comments for a post |
| `POST` | `/vani/posts/:id/comments` | Bearer Token | Post a comment |
| `POST` | `/vani/posts/:id/vote` | Bearer Token | Upvote or downvote (1 vote per user/post) |
| `GET` | `/vani/my-votes` | Bearer Token | Fetch current user's votes |

---

## 🔒 Security Implementation
1. **Password Safety**: Handled exclusively on the server using `bcryptjs` with 10 salt rounds. Passwords are never saved in `localStorage`, `sessionStorage`, or logs.
2. **Protected Secrets**: `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, and `JWT_SECRET` are strictly kept server-side and never leaked to frontends.
3. **SSO Authorization Codes**: Single-use, cryptographically random 32-byte hex codes with a strict 5-minute expiration.
4. **Rate Limiting**: Integrated `express-rate-limit` prevents brute-force attacks on auth and API routes.
5. **CORS Whitelist**: Controlled through configurable `ALLOWED_ORIGINS`.
