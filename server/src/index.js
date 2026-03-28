const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const migrate = require('./db/migrate');
migrate();

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// Sanity check for production
if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your_very_long_random_secret_here')) {
  console.warn('⚠️  [SECURITY WARNING] JWT_SECRET is not set or using default value in production. This is highly insecure!');
}

// CORS setup based on environment
const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors({ 
  // In production, prioritize defined CORS_ORIGIN. 
  // If not defined, we assume it's same-origin only for better security.
  origin: isProduction 
    ? (corsOrigin || true) // true = reflect origin (less secure), maybe change to a real URL
    : 'http://localhost:5173', 
  credentials: true 
}));
app.use(express.json());

// API routes
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/members', require('./routes/members'));
app.use('/api/users',   require('./routes/users'));
app.use('/api/data',    require('./routes/data'));

app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString(), env: process.env.NODE_ENV || 'development' }));

// Serve static files from the client dist directory
app.use(express.static(path.join(__dirname, '../../client/dist')));

// For any non-API routes, serve the client's index.html
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  if (!isProduction) console.error(err.stack);
  
  res.status(err.status || 500).json({
    error: isProduction ? 'Internal Server Error' : err.message,
    ...(isProduction ? {} : { stack: err.stack })
  });
});

if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 3001;
  const env = process.env.NODE_ENV || 'development';
  app.listen(PORT, () => console.log(`🚀 [${env.toUpperCase()}] Server running → http://localhost:${PORT}`));
}

module.exports = app;


