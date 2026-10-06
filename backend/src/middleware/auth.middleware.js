const { verifyToken } = require('../utils/jwt');
const { error } = require('../utils/response');
const db = require('../db');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Authorization token required', 401);
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded || !decoded.userId) {
    return error(res, 'Invalid or expired token', 401);
  }

  try {
    const user = await db.findUserById(decoded.userId);
    if (!user) {
      return error(res, 'User no longer exists', 401);
    }

    const profile = await db.getUserProfile(user.id);
    const apps = await db.getUserApps(user.id);

    req.user = user;
    req.profile = profile || {};
    req.apps = apps || [];

    next();
  } catch (err) {
    console.error('[Auth Middleware] Error loading user context:', err);
    return error(res, 'Authentication verification error', 500);
  }
}

async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    req.profile = null;
    req.apps = [];
    return next();
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (decoded && decoded.userId) {
    try {
      const user = await db.findUserById(decoded.userId);
      if (user) {
        req.user = user;
        req.profile = await db.getUserProfile(user.id);
        req.apps = await db.getUserApps(user.id);
      }
    } catch (err) {
      console.warn('[OptionalAuth] Token decode error:', err.message);
    }
  }

  next();
}

module.exports = {
  authenticate,
  optionalAuth
};
