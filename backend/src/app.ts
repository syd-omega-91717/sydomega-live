// ============================================================================
// FILE: /backend/src/app.ts
// Ω SYD OMEGA 91717
// Enterprise Backend Application
// ============================================================================

import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

const app: Express = express();

// Middleware - Security
app.use(helmet());
app.use(cors());

// Middleware - Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Middleware - Compression
app.use(compression());

// Middleware - Logging
app.use(morgan('combined'));

// Health Check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.get('/api', (_req, res) => {
  res.json({ message: 'SYD OMEGA 91717 Enterprise Backend API' });
});

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error Handler
app.use((err: Error, _req: express.Request, res: express.Response) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
