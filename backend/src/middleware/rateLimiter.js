const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests from this IP, please try again after 15 minutes'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Limit sensitive auth requests
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many login/registration attempts, please try again later'
  }
});

module.exports = {
  generalLimiter,
  authLimiter
};
