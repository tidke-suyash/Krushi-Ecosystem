const app = require('./app');
const env = require('./config/env');

const server = app.listen(env.port, () => {
  console.log('========================================================');
  console.log(`🌾 Krushi Ecosystems Backend API running on port ${env.port}`);
  console.log(`   Health Check:     http://localhost:${env.port}/health`);
  console.log(`   Krushi Account:   http://localhost:${env.port}/login/`);
  console.log(`   AAHAR Assistant:  http://localhost:${env.port}/aahar/`);
  console.log(`   SETU Marketplace: http://localhost:${env.port}/setu/`);
  console.log(`   VANI Discussions: http://localhost:${env.port}/vani/`);
  console.log('========================================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed.');
  });
});
