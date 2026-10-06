require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('./config/firebase');
const userRoutes = require('./routes/userRoutes');
const requestRoutes = require('./routes/requestRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.set('trust proxy', 1);

const allowedOrigin = process.env.FRONTEND_URL;
app.use(cors({ origin: allowedOrigin || true }));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });
app.use('/api', apiLimiter);

app.use(express.static(path.join(__dirname, '../frontend'), { maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0 }));
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'OK', time: new Date().toISOString() }));
app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found.' }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => console.log(`Server running on ${HOST}:${PORT}`));
