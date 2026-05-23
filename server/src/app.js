const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ── API Routes ─────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/admin',      require('./routes/admin'));
app.use('/api/manager',    require('./routes/manager'));
app.use('/api/teamlead',   require('./routes/teamlead'));
app.use('/api/telecaller', require('./routes/telecaller'));
app.use('/api/shared',     require('./routes/shared'));
app.use('/api/issues',     require('./routes/issue'));

// ── Serve Vue build in production ──────────────────────────
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(distPath));
  // All non-API routes → Vue's index.html (SPA fallback)
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

module.exports = app;
