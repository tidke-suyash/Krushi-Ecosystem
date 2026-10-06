const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../db');
const { signToken } = require('../utils/jwt');
const { success, error } = require('../utils/response');

async function register(req, res) {
  try {
    const { profile, password, apps } = req.body;

    if (!profile || !profile.name || !profile.mobile || !password) {
      return error(res, 'Name, mobile number, and password are required', 400);
    }

    if (password.length < 8) {
      return error(res, 'Password must be at least 8 characters', 400);
    }

    const cleanMobile = profile.mobile.replace(/[\s\-\+]/g, '');
    const cleanEmail = profile.email ? profile.email.trim().toLowerCase() : null;

    // Check if mobile or email is already registered
    const existing = await db.findUserByMobileOrEmail(cleanMobile);
    if (existing) {
      return error(res, 'An account with this mobile number already exists', 409);
    }

    if (cleanEmail) {
      const existingEmail = await db.findUserByMobileOrEmail(cleanEmail);
      if (existingEmail) {
        return error(res, 'An account with this email address already exists', 409);
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user, shared profile, and user_apps in database
    const selectedApps = Array.isArray(apps) && apps.length ? apps : ['AAHAR', 'SETU', 'VANI'];
    const created = await db.createUserWithProfile({
      mobile: cleanMobile,
      email: cleanEmail,
      passwordHash,
      profile: {
        ...profile,
        mobile: cleanMobile,
        email: cleanEmail || ''
      },
      apps: selectedApps
    });

    return success(res, {
      user: {
        id: created.id,
        name: created.name
      },
      apps: selectedApps
    }, 201);
  } catch (err) {
    console.error('[Auth Register Error]:', err);
    return error(res, 'Registration failed. Please try again.', 500);
  }
}

async function login(req, res) {
  try {
    const { id, password } = req.body;

    if (!id || !password) {
      return error(res, 'Mobile or email, and password are required', 400);
    }

    const user = await db.findUserByMobileOrEmail(id);
    if (!user) {
      return error(res, 'Incorrect mobile/email or password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return error(res, 'Incorrect mobile/email or password', 401);
    }

    // Fetch shared profile and active apps
    const profile = await db.getUserProfile(user.id);
    const apps = await db.getUserApps(user.id);

    // Issue JWT token
    const accessToken = signToken({
      userId: user.id,
      mobile: user.mobile,
      email: user.email
    });

    return success(res, {
      accessToken,
      profile: profile || {
        name: user.email || user.mobile,
        mobile: user.mobile,
        email: user.email || ''
      },
      apps: apps || []
    });
  } catch (err) {
    console.error('[Auth Login Error]:', err);
    return error(res, 'Login failed. Please try again.', 500);
  }
}

async function createSsoCode(req, res) {
  try {
    const { app, redirect_uri } = req.body;
    const userId = req.user.id;

    if (!app) {
      return error(res, 'Application identifier (app) is required', 400);
    }

    // Generate single-use authorization code
    const code = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes validity

    await db.createAuthCode({
      code,
      userId,
      appId: app,
      redirectUri: redirect_uri || null,
      expiresAt
    });

    return success(res, {
      code,
      redirect_uri
    });
  } catch (err) {
    console.error('[SSO Code Error]:', err);
    return error(res, 'Failed to generate SSO authorization code', 500);
  }
}

async function exchangeSsoCode(req, res) {
  try {
    const { code, app } = req.body;

    if (!code) {
      return error(res, 'Authorization code is required', 400);
    }

    const authCode = await db.consumeAuthCode(code, app);
    if (!authCode) {
      return error(res, 'Invalid or expired authorization code', 400);
    }

    const user = await db.findUserById(authCode.user_id);
    if (!user) {
      return error(res, 'Associated user not found', 404);
    }

    const profile = await db.getUserProfile(user.id);
    const apps = await db.getUserApps(user.id);

    // Issue JWT token
    const accessToken = signToken({
      userId: user.id,
      mobile: user.mobile,
      email: user.email
    });

    return success(res, {
      accessToken,
      profile: profile || {},
      apps: apps || []
    });
  } catch (err) {
    console.error('[SSO Exchange Error]:', err);
    return error(res, 'SSO exchange failed', 500);
  }
}

async function logout(req, res) {
  return success(res, { message: 'Logged out successfully' });
}

async function getMe(req, res) {
  try {
    return success(res, {
      profile: req.profile,
      apps: req.apps
    });
  } catch (err) {
    console.error('[GetMe Error]:', err);
    return error(res, 'Failed to fetch user profile', 500);
  }
}

async function updateProfile(req, res) {
  try {
    const updates = req.body;
    const updated = await db.updateUserProfile(req.user.id, updates);

    return success(res, {
      profile: updated,
      message: 'Profile updated successfully'
    });
  } catch (err) {
    console.error('[UpdateProfile Error]:', err);
    return error(res, 'Failed to update profile', 500);
  }
}

async function enableApp(req, res) {
  try {
    const { appId } = req.params;
    await db.enableUserApp(req.user.id, appId);
    const apps = await db.getUserApps(req.user.id);

    return success(res, {
      apps,
      message: `App ${appId} enabled successfully`
    });
  } catch (err) {
    console.error('[EnableApp Error]:', err);
    return error(res, 'Failed to enable application', 500);
  }
}

async function getApps(req, res) {
  try {
    const apps = await db.getApps();
    return success(res, apps);
  } catch (err) {
    console.error('[GetApps Error]:', err);
    return error(res, 'Failed to fetch apps', 500);
  }
}

module.exports = {
  register,
  login,
  createSsoCode,
  exchangeSsoCode,
  logout,
  getMe,
  updateProfile,
  enableApp,
  getApps
};
