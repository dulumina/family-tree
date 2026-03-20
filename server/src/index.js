const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// API routes
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/members', require('./routes/members'));
app.use('/api/users',   require('./routes/users'));

app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Serve static files from the client dist directory
app.use(express.static(path.join(__dirname, '../../client/dist')));

// For any non-API routes, serve the client's index.html
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`🚀 Server running → http://localhost:${PORT}`));
}

module.exports = app;


