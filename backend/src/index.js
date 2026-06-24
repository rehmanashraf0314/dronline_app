require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const routes = require('./routes');
const paymentController = require('./controllers/paymentController');

const app = express();

// ── Connect Database ──────────────────────────────────────────────────
connectDB();

// ── CRITICAL: Stripe webhook needs raw body — register BEFORE json parser ──
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.stripeWebhook
);

// ── Middleware ────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// ── Routes ────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── Health check ──────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

// ── 404 ───────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ── Error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
