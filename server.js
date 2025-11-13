import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import studyRoutes from './routes/study.js';
import authRoutes from './routes/auth.js';
import { connectDatabase } from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Root endpoint
app.get('/', (_req, res) => {
  res.json({ 
    message: 'Smart Study Assistant API',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/auth/*',
      study: '/study/*'
    }
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Connect to MongoDB with error handling
let isConnected = false;

const ensureDBConnection = async (_req, _res, next) => {
  if (!isConnected) {
    try {
      await connectDatabase();
      isConnected = true;
    } catch (error) {
      console.error('DB connection error:', error);
    }
  }
  next();
};

app.use(ensureDBConnection);

// Routes
app.use('/auth', authRoutes);
app.use('/study', studyRoutes);

// Error handling
app.use((err, _req, res, _next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!', 
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Only listen if not in serverless
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
