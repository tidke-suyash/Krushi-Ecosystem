const { supabase, isConfigured } = require('../config/supabase');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// In-Memory store for local fallback
const localStore = {
  users: [],
  profiles: [],
  apps: [
    { id: 'AAHAR', name: 'AAHAR', status: 'active', url: 'http://localhost:5000/aahar/', color: '#4FA36E', tag: 'Agricultural AI for harvest analysis & recommendation' },
    { id: 'SETU', name: 'SETU', status: 'active', url: 'http://localhost:5000/setu/', color: '#3FA5B1', tag: 'Smart e-market for trading & upliftment' },
    { id: 'VANI', name: 'VANI', status: 'active', url: 'http://localhost:5000/vani/', color: '#F2900E', tag: 'Village agri news & information' }
  ],
  user_apps: [],
  auth_codes: [],
  conversations: [],
  messages: [],
  products: [],
  saved_products: [],
  orders: [],
  posts: [],
  comments: [],
  votes: []
};

// Seed local store with demo user and prototype products/posts
function initLocalStore() {
  const demoUserId = '11111111-1111-1111-1111-111111111111';
  const salt = bcrypt.genSaltSync(10);
  const demoHash = bcrypt.hashSync('Password123', salt);

  localStore.users.push({
    id: demoUserId,
    mobile: '9876543210',
    email: 'farmer@krushi.in',
    password_hash: demoHash,
    mobile_verified: true,
    created_at: new Date().toISOString()
  });

  localStore.profiles.push({
    user_id: demoUserId,
    name: 'Ashwin Patel',
    mobile: '9876543210',
    village: 'Khed',
    district: 'Pune',
    role: 'Farmer',
    language: 'English',
    crops: 'Cotton, Wheat, Soybean',
    email: 'farmer@krushi.in',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  localStore.user_apps.push(
    { user_id: demoUserId, app_id: 'AAHAR', enabled_at: new Date().toISOString() },
    { user_id: demoUserId, app_id: 'SETU', enabled_at: new Date().toISOString() },
    { user_id: demoUserId, app_id: 'VANI', enabled_at: new Date().toISOString() }
  );

  // Load products from SETU prototype
  try {
    const fs = require('fs');
    const path = require('path');
    const setuPath = path.resolve(__dirname, '../../../SETU/setu.html');
    if (fs.existsSync(setuPath)) {
      const setuContent = fs.readFileSync(setuPath, 'utf8');
      const pMatch = setuContent.match(/let PRODUCTS=\[\s*([\s\S]*?)\s*\];\s*let saved/);
      if (pMatch) {
        const products = new Function('return [' + pMatch[1] + '];')();
        products.forEach(p => {
          localStore.products.push({
            id: p.id,
            seller_user_id: demoUserId,
            title: p.title,
            description: p.desc || '',
            price: p.price || 0,
            category: p.cat || 'other',
            location: p.loc || 'Maharashtra, India',
            condition: p.cond || 'Good',
            availability: p.avail || 'In stock',
            images: p.imgs || [0, 1, 2],
            specs: p.specs || {},
            seller_name: p.seller || 'Krushi Seller',
            seller_type: p.sellerType || 'Individual',
            rating: p.rating || 4.5,
            views: p.views || 100,
            saves: p.saves || 10,
            enquiries: p.enquiries || 5,
            shares: p.shares || 2,
            status: 'active',
            created_at: new Date().toISOString()
          });
        });
      }
    }

    const vaniPath = path.resolve(__dirname, '../../../VANI/vani.html');
    if (fs.existsSync(vaniPath)) {
      const vaniContent = fs.readFileSync(vaniPath, 'utf8');
      const poMatch = vaniContent.match(/let POSTS = \[\s*([\s\S]*?)\s*\];\s*let votes/);
      if (poMatch) {
        const posts = new Function('return [' + poMatch[1] + '];')();
        posts.forEach(po => {
          localStore.posts.push({
            id: po.id,
            user_id: demoUserId,
            author_name: po.author || 'Krushi Editor',
            space_id: po.space,
            type: po.type || 'news',
            title: po.title,
            body: po.body || '',
            source: po.source || '',
            summary: po.summary || '',
            views: po.views || 120,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        });
      }
    }
  } catch (err) {
    console.error('[DB] Error populating local prototype seeds:', err.message);
  }
}

initLocalStore();

let tablesReadyInSupabase = false;

function isTableMissingError(err) {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  const code = err.code || '';
  return code === 'PGRST205' || code === '42P01' || msg.includes('could not find the table') || msg.includes('relation') || msg.includes('schema cache');
}

async function checkSupabaseTables() {
  if (!isConfigured) return;
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (!error) {
      tablesReadyInSupabase = true;
      console.log('[Supabase] Database tables verified and connected.');
    } else {
      tablesReadyInSupabase = false;
      console.warn('[Supabase Notice] Tables not yet created in Supabase database.');
      console.warn('   -> Run backend/supabase/migrations/20261005_init.sql in the Supabase SQL Editor to create PostgreSQL tables.');
      console.warn('   -> In the meantime, operating seamlessly with local memory store.');
    }
  } catch (err) {
    tablesReadyInSupabase = false;
  }
}

checkSupabaseTables();

const db = {
  // ---- User & Profile ----
  async findUserByMobileOrEmail(identifier) {
    if (!identifier) return null;
    const clean = String(identifier).trim().toLowerCase();
    const isEmail = clean.includes('@');
    const cleanMobile = clean.replace(/[\s\-\+]/g, '');

    if (isConfigured && tablesReadyInSupabase) {
      try {
        if (isEmail) {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', clean)
            .maybeSingle();
          if (!error && data) return data;
          if (error && !isTableMissingError(error)) {
            console.warn('[Supabase email lookup error]:', error.message);
          }
        } else {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('mobile', cleanMobile)
            .maybeSingle();
          if (!error && data) return data;
          if (error && !isTableMissingError(error)) {
            console.warn('[Supabase mobile lookup error]:', error.message);
          }
        }
      } catch (err) {
        if (!isTableMissingError(err)) console.warn('[Supabase lookup catch]:', err.message);
      }
    }

    // Local fallback
    return localStore.users.find(u => 
      (u.email && u.email.toLowerCase() === clean) || 
      (u.mobile && u.mobile.replace(/[\s\-\+]/g, '') === cleanMobile)
    ) || null;
  },

  async findUserById(id) {
    if (isConfigured && tablesReadyInSupabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error) {
          if (isTableMissingError(error)) tablesReadyInSupabase = false;
          else throw error;
        } else {
          return data;
        }
      } catch (err) {
        if (!isTableMissingError(err)) throw err;
      }
    }

    return localStore.users.find(u => u.id === id) || null;
  },

  async createUserWithProfile({ mobile, email, passwordHash, profile, apps }) {
    const userId = uuidv4();
    const now = new Date().toISOString();

    if (isConfigured && tablesReadyInSupabase) {
      try {
        const { data: user, error: userError } = await supabase
          .from('users')
          .insert({
            id: userId,
            mobile: mobile.replace(/[\s\-\+]/g, ''),
            email: email ? email.toLowerCase() : null,
            password_hash: passwordHash,
            mobile_verified: false,
            created_at: now,
            updated_at: now
          })
          .select()
          .single();
        if (userError) throw userError;

        const { error: profError } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            name: profile.name,
            mobile: profile.mobile,
            village: profile.village || '',
            district: profile.district || '',
            role: profile.role || 'Farmer',
            language: profile.language || 'English',
            crops: profile.crops || '',
            email: email || '',
            created_at: now,
            updated_at: now
          });
        if (profError) throw profError;

        if (apps && apps.length) {
          const appRows = apps.map(appId => ({
            user_id: userId,
            app_id: appId,
            enabled_at: now
          }));
          await supabase.from('user_apps').insert(appRows);
        }

        return { id: userId, name: profile.name };
      } catch (err) {
        if (isTableMissingError(err)) tablesReadyInSupabase = false;
        else throw err;
      }
    }

    // Local fallback
    const newUser = {
      id: userId,
      mobile: mobile.replace(/[\s\-\+]/g, ''),
      email: email ? email.toLowerCase() : null,
      password_hash: passwordHash,
      mobile_verified: false,
      created_at: now
    };
    localStore.users.push(newUser);

    const newProfile = {
      user_id: userId,
      name: profile.name,
      mobile: profile.mobile,
      village: profile.village || '',
      district: profile.district || '',
      role: profile.role || 'Farmer',
      language: profile.language || 'English',
      crops: profile.crops || '',
      email: email || '',
      created_at: now,
      updated_at: now
    };
    localStore.profiles.push(newProfile);

    if (apps && apps.length) {
      apps.forEach(appId => {
        localStore.user_apps.push({
          user_id: userId,
          app_id: appId,
          enabled_at: now
        });
      });
    }

    return { id: userId, name: profile.name };
  },

  async getUserProfile(userId) {
    if (isConfigured && tablesReadyInSupabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        if (error) {
          if (isTableMissingError(error)) tablesReadyInSupabase = false;
          else throw error;
        } else {
          return data;
        }
      } catch (err) {
        if (!isTableMissingError(err)) throw err;
      }
    }

    return localStore.profiles.find(p => p.user_id === userId) || null;
  },

  async updateUserProfile(userId, updates) {
    const now = new Date().toISOString();
    const allowed = ['name', 'village', 'district', 'role', 'language', 'crops', 'email'];
    const filtered = {};
    for (const k of allowed) {
      if (updates[k] !== undefined) filtered[k] = updates[k];
    }
    filtered.updated_at = now;

    if (isConfigured && tablesReadyInSupabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update(filtered)
          .eq('user_id', userId)
          .select()
          .single();
        if (error) {
          if (isTableMissingError(error)) tablesReadyInSupabase = false;
          else throw error;
        } else {
          return data;
        }
      } catch (err) {
        if (!isTableMissingError(err)) throw err;
      }
    }

    const idx = localStore.profiles.findIndex(p => p.user_id === userId);
    if (idx !== -1) {
      localStore.profiles[idx] = { ...localStore.profiles[idx], ...filtered };
      return localStore.profiles[idx];
    }
    return null;
  },

  async getUserApps(userId) {
    if (isConfigured && tablesReadyInSupabase) {
      try {
        const { data, error } = await supabase
          .from('user_apps')
          .select('app_id')
          .eq('user_id', userId);
        if (error) {
          if (isTableMissingError(error)) tablesReadyInSupabase = false;
          else throw error;
        } else {
          return data.map(r => r.app_id);
        }
      } catch (err) {
        if (!isTableMissingError(err)) throw err;
      }
    }

    return localStore.user_apps
      .filter(r => r.user_id === userId)
      .map(r => r.app_id);
  },

  async enableUserApp(userId, appId) {
    const now = new Date().toISOString();
    if (isConfigured && tablesReadyInSupabase) {
      try {
        const { error } = await supabase
          .from('user_apps')
          .upsert({ user_id: userId, app_id: appId, enabled_at: now });
        if (error) {
          if (isTableMissingError(error)) tablesReadyInSupabase = false;
          else throw error;
        } else {
          return true;
        }
      } catch (err) {
        if (!isTableMissingError(err)) throw err;
      }
    }

    const exists = localStore.user_apps.some(r => r.user_id === userId && r.app_id === appId);
    if (!exists) {
      localStore.user_apps.push({ user_id: userId, app_id: appId, enabled_at: now });
    }
    return true;
  },

  async getApps() {
    if (isConfigured && tablesReadyInSupabase) {
      try {
        const { data, error } = await supabase.from('apps').select('*');
        if (error) {
          if (isTableMissingError(error)) tablesReadyInSupabase = false;
          else throw error;
        } else {
          return data;
        }
      } catch (err) {
        if (!isTableMissingError(err)) throw err;
      }
    }

    return localStore.apps;
  },

  // ---- SSO Auth Codes ----
  async createAuthCode({ code, userId, appId, redirectUri, expiresAt }) {
    if (isConfigured && tablesReadyInSupabase) {
      try {
        const { error } = await supabase
          .from('auth_codes')
          .insert({
            code,
            user_id: userId,
            app_id: appId,
            redirect_uri: redirectUri,
            expires_at: expiresAt,
            used: false
          });
        if (error) {
          if (isTableMissingError(error)) tablesReadyInSupabase = false;
          else throw error;
        } else {
          return true;
        }
      } catch (err) {
        if (!isTableMissingError(err)) throw err;
      }
    }

    localStore.auth_codes.push({
      code,
      user_id: userId,
      app_id: appId,
      redirect_uri: redirectUri,
      expires_at: expiresAt,
      used: false
    });
    return true;
  },

  async consumeAuthCode(code, appId) {
    const now = new Date();
    if (isConfigured && tablesReadyInSupabase) {
      try {
        const { data, error } = await supabase
          .from('auth_codes')
          .select('*')
          .eq('code', code)
          .eq('used', false)
          .maybeSingle();
        if (!error && data) {
          if (appId && data.app_id !== appId) return null;
          if (new Date(data.expires_at) < now) return null;
          await supabase.from('auth_codes').update({ used: true }).eq('code', code);
          return data;
        }
      } catch (err) {}
    }

    const item = localStore.auth_codes.find(c => c.code === code && !c.used);
    if (!item) return null;
    if (appId && item.app_id !== appId) return null;
    if (new Date(item.expires_at) < now) return null;
    item.used = true;
    return item;
  },

  // ---- AAHAR Conversations & Messages ----
  async getConversations(userId) {
    if (isConfigured && tablesReadyInSupabase) {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('id, title, created_at, updated_at')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });
        if (!error) return data;
      } catch (err) {}
    }

    return localStore.conversations
      .filter(c => c.user_id === userId)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  },

  async getConversationWithMessages(convId, userId) {
    if (isConfigured && tablesReadyInSupabase) {
      try {
        const { data: conv, error: convErr } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', convId)
          .eq('user_id', userId)
          .maybeSingle();
        if (!convErr && conv) {
          const { data: msgs, error: msgsErr } = await supabase
            .from('messages')
            .select('id, role, content, created_at')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true });
          if (!msgsErr) {
            return {
              ...conv,
              messages: msgs.map(m => ({ id: m.id, role: m.role, text: m.content }))
            };
          }
        }
      } catch (err) {}
    }

    const conv = localStore.conversations.find(c => c.id === convId && c.user_id === userId);
    if (!conv) return null;
    const msgs = localStore.messages
      .filter(m => m.conversation_id === convId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return {
      ...conv,
      messages: msgs.map(m => ({ id: m.id, role: m.role, text: m.content }))
    };
  },

  async createConversation(convId, userId, title) {
    const now = new Date().toISOString();
    if (isConfigured && tablesReadyInSupabase) {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .insert({
            id: convId,
            user_id: userId,
            title: title || 'New conversation',
            created_at: now,
            updated_at: now
          })
          .select()
          .single();
        if (!error && data) return data;
      } catch (err) {}
    }

    const newConv = {
      id: convId,
      user_id: userId,
      title: title || 'New conversation',
      created_at: now,
      updated_at: now
    };
    localStore.conversations.unshift(newConv);
    return newConv;
  },

  async saveMessage(convId, role, content) {
    const id = uuidv4();
    const now = new Date().toISOString();
    if (isConfigured && tablesReadyInSupabase) {
      try {
        const { data, error } = await supabase
          .from('messages')
          .insert({ id, conversation_id: convId, role, content, created_at: now })
          .select()
          .single();
        if (!error) {
          await supabase.from('conversations').update({ updated_at: now }).eq('id', convId);
          return data;
        }
      } catch (err) {}
    }

    const msg = { id, conversation_id: convId, role, content, created_at: now };
    localStore.messages.push(msg);
    const conv = localStore.conversations.find(c => c.id === convId);
    if (conv) conv.updated_at = now;
    return msg;
  },

  async clearConversationMessages(convId, userId) {
    if (isConfigured && tablesReadyInSupabase) {
      try {
        await supabase.from('messages').delete().eq('conversation_id', convId);
        await supabase.from('conversations').update({ title: 'New conversation', updated_at: new Date().toISOString() }).eq('id', convId);
      } catch (err) {}
    }

    localStore.messages = localStore.messages.filter(m => m.conversation_id !== convId);
    const conv = localStore.conversations.find(c => c.id === convId && c.user_id === userId);
    if (conv) {
      conv.title = 'New conversation';
      conv.updated_at = new Date().toISOString();
    }
  },

  async deleteConversation(convId, userId) {
    if (isConfigured && tablesReadyInSupabase) {
      try {
        await supabase.from('conversations').delete().eq('id', convId).eq('user_id', userId);
      } catch (err) {}
    }
    localStore.messages = localStore.messages.filter(m => m.conversation_id !== convId);
    localStore.conversations = localStore.conversations.filter(c => !(c.id === convId && c.user_id === userId));
  },

  async wipeConversations(userId) {
    if (isConfigured && tablesReadyInSupabase) {
      try {
        await supabase.from('conversations').delete().eq('user_id', userId);
      } catch (err) {}
    }
    const userConvs = localStore.conversations.filter(c => c.user_id === userId).map(c => c.id);
    localStore.messages = localStore.messages.filter(m => !userConvs.includes(m.conversation_id));
    localStore.conversations = localStore.conversations.filter(c => c.user_id !== userId);
  },

  // ---- SETU Products ----
  async getProducts({ category, search, sort, limit = 50, offset = 0 } = {}) {
    if (isConfigured && tablesReadyInSupabase) {
      try {
        let query = supabase.from('products').select('*').eq('status', 'active');
        if (category && category !== 'all') query = query.eq('category', category);
        if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        if (sort === 'low') query = query.order('price', { ascending: true });
        else if (sort === 'high') query = query.order('price', { ascending: false });
        else query = query.order('created_at', { ascending: false });

        const { data, error } = await query.range(offset, offset + limit - 1);
        if (!error && data) return data;
      } catch (err) {}
    }

    let list = localStore.products.filter(p => p.status === 'active');
    if (category && category !== 'all') list = list.filter(p => p.category === category);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(p => (p.title && p.title.toLowerCase().includes(s)) || (p.description && p.description.toLowerCase().includes(s)));
    }
    if (sort === 'low') list = list.slice().sort((a, b) => a.price - b.price);
    else if (sort === 'high') list = list.slice().sort((a, b) => b.price - a.price);
    return list.slice(offset, offset + limit);
  },

  async getProductById(id) {
    if (isConfigured && tablesReadyInSupabase) {
      try {
        const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
        if (!error && data) return data;
      } catch (err) {}
    }
    return localStore.products.find(p => p.id === id) || null;
  },

  async createProduct(productData) {
    const id = 'p_' + Date.now();
    const row = {
      id,
      ...productData,
      status: 'active',
      views: 0,
      saves: 0,
      enquiries: 0,
      shares: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isConfigured && tablesReadyInSupabase) {
      try {
        const { data, error } = await supabase.from('products').insert(row).select().single();
        if (!error && data) return data;
      } catch (err) {}
    }

    localStore.products.unshift(row);
    return row;
  },

  async updateProduct(id, sellerUserId, updates) {
    const now = new Date().toISOString();
    const patch = { ...updates, updated_at: now };

    if (isConfigured && tablesReadyInSupabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .update(patch)
          .eq('id', id)
          .eq('seller_user_id', sellerUserId)
          .select()
          .single();
        if (!error && data) return data;
      } catch (err) {}
    }

    const idx = localStore.products.findIndex(p => p.id === id && p.seller_user_id === sellerUserId);
    if (idx !== -1) {
      localStore.products[idx] = { ...localStore.products[idx], ...patch };
      return localStore.products[idx];
    }
    return null;
  },

  async deleteProduct(id, sellerUserId) {
    if (isConfigured && tablesReadyInSupabase) {
      try {
        await supabase.from('products').delete().eq('id', id).eq('seller_user_id', sellerUserId);
      } catch (err) {}
    }
    localStore.products = localStore.products.filter(p => !(p.id === id && p.seller_user_id === sellerUserId));
    return true;
  },

  async getMyListings(sellerUserId) {
    if (isConfigured && tablesReadyInSupabase) {
      try {
        const { data, error } = await supabase.from('products').select('*').eq('seller_user_id', sellerUserId);
        if (!error && data) return data;
      } catch (err) {}
    }
    return localStore.products.filter(p => p.seller_user_id === sellerUserId);
  },

  async getSavedProducts(userId) {
    if (isConfigured && tablesReadyInSupabase) {
      try {
        const { data, error } = await supabase.from('saved_products').select('product_id').eq('user_id', userId);
        if (!error && data) return data.map(r => r.product_id);
      } catch (err) {}
    }
    return localStore.saved_products.filter(r => r.user_id === userId).map(r => r.product_id);
  },

  async toggleSavedProduct(userId, productId) {
    if (isConfigured && tablesReadyInSupabase) {
      try {
        const { data } = await supabase.from('saved_products').select('*').eq('user_id', userId).eq('product_id', productId).maybeSingle();
        if (data) {
          await supabase.from('saved_products').delete().eq('user_id', userId).eq('product_id', productId);
          return false;
        } else {
          await supabase.from('saved_products').insert({ user_id: userId, product_id: productId });
          return true;
        }
      } catch (err) {}
    }

    const idx = localStore.saved_products.findIndex(r => r.user_id === userId && r.product_id === productId);
    if (idx !== -1) {
      localStore.saved_products.splice(idx, 1);
      return false;
    } else {
      localStore.saved_products.push({ user_id: userId, product_id: productId, created_at: new Date().toISOString() });
      return true;
    }
  },

  async getOrders(userId) {
    if (isConfigured && tablesReadyInSupabase) {
      try {
        const { data, error } = await supabase.from('orders').select('*').eq('buyer_user_id', userId).order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (err) {}
    }
    return localStore.orders.filter(o => o.buyer_user_id === userId);
  },

  async createOrder(orderData) {
    const id = 'ord_' + Date.now();
    const row = { id, ...orderData, status: 'active', created_at: new Date().toISOString() };
    if (isConfigured && tablesReadyInSupabase) {
      try {
        const { data, error } = await supabase.from('orders').insert(row).select().single();
        if (!error && data) return data;
      } catch (err) {}
    }
    localStore.orders.unshift(row);
    return row;
  },

  // ---- VANI Posts, Comments, Votes ----
  async getPosts({ spaceId, search, limit = 50, offset = 0 } = {}) {
    if (isConfigured && tablesReadyInSupabase) {
      try {
        let query = supabase.from('posts').select('*');
        if (spaceId && spaceId !== 'all') query = query.eq('space_id', spaceId);
        if (search) query = query.or(`title.ilike.%${search}%,body.ilike.%${search}%`);
        query = query.order('created_at', { ascending: false });
        const { data, error } = await query.range(offset, offset + limit - 1);
        if (!error && data) return data;
      } catch (err) {}
    }

    let list = localStore.posts;
    if (spaceId && spaceId !== 'all') list = list.filter(p => p.space_id === spaceId);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(p => (p.title && p.title.toLowerCase().includes(s)) || (p.body && p.body.toLowerCase().includes(s)));
    }
    return list.slice(offset, offset + limit);
  },

  async getPostById(id) {
    if (isConfigured && tablesReadyInSupabase) {
      try {
        const { data, error } = await supabase.from('posts').select('*').eq('id', id).maybeSingle();
        if (!error && data) return data;
      } catch (err) {}
    }
    return localStore.posts.find(p => p.id === id) || null;
  },

  async createPost(postData) {
    const id = 'p_' + Date.now();
    const row = { id, ...postData, views: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    if (isConfigured && tablesReadyInSupabase) {
      try {
        const { data, error } = await supabase.from('posts').insert(row).select().single();
        if (!error && data) return data;
      } catch (err) {}
    }
    localStore.posts.unshift(row);
    return row;
  },

  async getComments(postId) {
    if (isConfigured && tablesReadyInSupabase) {
      try {
        const { data, error } = await supabase.from('comments').select('*').eq('post_id', postId).order('created_at', { ascending: true });
        if (!error && data) return data;
      } catch (err) {}
    }
    return localStore.comments.filter(c => c.post_id === postId);
  },

  async createComment(commentData) {
    const id = 'c_' + Date.now();
    const row = { id, ...commentData, created_at: new Date().toISOString() };
    if (isConfigured && tablesReadyInSupabase) {
      try {
        const { data, error } = await supabase.from('comments').insert(row).select().single();
        if (!error && data) return data;
      } catch (err) {}
    }
    localStore.comments.push(row);
    return row;
  },

  async votePost(userId, postId, direction) {
    if (isConfigured && tablesReadyInSupabase) {
      try {
        const { data: existing } = await supabase.from('votes').select('*').eq('user_id', userId).eq('post_id', postId).maybeSingle();
        if (existing) {
          if (existing.direction === direction) {
            await supabase.from('votes').delete().eq('user_id', userId).eq('post_id', postId);
            return null;
          } else {
            await supabase.from('votes').update({ direction }).eq('user_id', userId).eq('post_id', postId);
            return direction;
          }
        } else {
          await supabase.from('votes').insert({ user_id: userId, post_id: postId, direction });
          return direction;
        }
      } catch (err) {}
    }

    const idx = localStore.votes.findIndex(v => v.user_id === userId && v.post_id === postId);
    if (idx !== -1) {
      if (localStore.votes[idx].direction === direction) {
        localStore.votes.splice(idx, 1);
        return null;
      } else {
        localStore.votes[idx].direction = direction;
        return direction;
      }
    } else {
      localStore.votes.push({ user_id: userId, post_id: postId, direction, created_at: new Date().toISOString() });
      return direction;
    }
  },

  async getUserVotes(userId) {
    if (isConfigured && tablesReadyInSupabase) {
      try {
        const { data, error } = await supabase.from('votes').select('post_id, direction').eq('user_id', userId);
        if (!error && data) {
          const res = {};
          data.forEach(v => { res[v.post_id] = v.direction; });
          return res;
        }
      } catch (err) {}
    }

    const res = {};
    localStore.votes
      .filter(v => v.user_id === userId)
      .forEach(v => { res[v.post_id] = v.direction; });
    return res;
  }
};

module.exports = db;
