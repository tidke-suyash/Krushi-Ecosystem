const express = require('express');
const cors = require('cors');
const path = require('path');
const env = require('./config/env');
const { generalLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth.routes');
const aaharRoutes = require('./routes/aahar.routes');
const setuRoutes = require('./routes/setu.routes');
const vaniRoutes = require('./routes/vani.routes');

const app = express();

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow non-browser requests or file:// origin (null)
    if (!origin || origin === 'null') {
      return callback(null, true);
    }
    if (env.allowedOrigins.includes('*') || env.allowedOrigins.includes(origin) || env.nodeEnv === 'development') {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(generalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Krushi Ecosystems API'
  });
});

// Mount routes at root and /api for versatile client consumption
app.use('/', authRoutes);
app.use('/', aaharRoutes);
app.use('/', setuRoutes);
app.use('/', vaniRoutes);

app.use('/api', authRoutes);
app.use('/api', aaharRoutes);
app.use('/api', setuRoutes);
app.use('/api', vaniRoutes);

// Static hosting for the four frontend applications
const frontendRoot = path.resolve(__dirname, '../../');
app.use('/login', express.static(path.join(frontendRoot, 'Login'), { index: 'Krushi Ecosystems.html' }));
app.use('/aahar', express.static(path.join(frontendRoot, 'AAHAR'), { index: 'aahar.html' }));
app.use('/setu', express.static(path.join(frontendRoot, 'SETU'), { index: 'setu.html' }));
app.use('/vani', express.static(path.join(frontendRoot, 'VANI'), { index: 'vani.html' }));

// Root redirect to Login portal
app.get('/', (req, res) => {
  res.redirect('/login/');
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;
