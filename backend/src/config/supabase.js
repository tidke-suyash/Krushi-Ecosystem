const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

const isConfigured = 
  env.supabase.url && 
  !env.supabase.url.includes('xyzcompany') && 
  !env.supabase.url.includes('your-project') &&
  (env.supabase.serviceRoleKey || env.supabase.anonKey);

let supabase = null;

if (isConfigured) {
  const key = env.supabase.serviceRoleKey || env.supabase.anonKey;
  supabase = createClient(env.supabase.url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  console.log('[Supabase] Initialized client for:', env.supabase.url);
} else {
  console.log('[Supabase] No active credentials in .env. Running in local in-memory fallback mode.');
}

module.exports = {
  supabase,
  isConfigured
};
