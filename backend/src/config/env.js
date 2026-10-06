const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  supabase: {
    url: (process.env.SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, ''),
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  },
  
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || ''
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'krushi_ecosystem_secret_jwt_key_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  urls: {
    frontendAuthUrl: process.env.FRONTEND_AUTH_URL || 'http://localhost:5000/login/',
    aaharUrl: process.env.AAHAR_URL || 'http://localhost:5000/aahar/',
    setuUrl: process.env.SETU_URL || 'http://localhost:5000/setu/',
    vaniUrl: process.env.VANI_URL || 'http://localhost:5000/vani/'
  },
  
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean)
};

module.exports = config;
