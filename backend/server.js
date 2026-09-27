import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import productsRouter from './routes/products.js';
import trackedRouter from './routes/tracked.js';
import exportRouter from './routes/export.js';
import cronRouter from './routes/cron.js';
import { getTrackedProducts } from './database/index.js';
import { seedDatabase } from './scripts/seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-cron-secret']
}));

app.use(express.json());

// Healthcheck endpoints for uptime monitor & Render warm-up
app.get('/', (req, res) => {
  res.json({
    name: 'INE Product Price Tracker API',
    status: 'online',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      search: '/api/products/search?q={query}',
      tracked: '/api/tracked',
      export_csv: '/api/export/csv',
      cron_scrape: '/api/cron/scrape'
    }
  });
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// API Routes
app.use('/api/products', productsRouter);
app.use('/api/tracked', trackedRouter);
app.use('/api/export', exportRouter);
app.use('/api/cron', cronRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err.stack || err.message);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Start Server & Auto-seed initial items if database is empty
app.listen(PORT, async () => {
  console.log(`\n======================================================`);
  console.log(`   INE PRICE TRACKER BACKEND RUNNING ON PORT ${PORT}`);
  console.log(`   Health Check : http://localhost:${PORT}/health`);
  console.log(`   Environment  : ${process.env.NODE_ENV || 'development'}`);
  console.log(`======================================================\n`);

  try {
    const existing = await getTrackedProducts();
    if (!existing || existing.length === 0) {
      console.log('[Startup] Empty database detected. Seeding initial tracked products...');
      await seedDatabase();
    }
  } catch (err) {
    console.warn('[Startup] Seeding check skipped:', err.message);
  }
});
