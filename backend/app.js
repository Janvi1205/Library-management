import express from 'express';
import cors from 'cors';
import { requestLogger } from './middleware/loggerMiddleware.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import borrowRoutes from './routes/borrowRoutes.js';
import returnRoutes from './routes/returnRoutes.js';

const app = express();

// Enable Cross-Origin Resource Sharing for future React frontend integration
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// Custom lightweight request logging middleware
app.use(requestLogger);

// Base Health Check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    message: 'ShelfLife Library Management API is running.',
    timestamp: new Date().toISOString(),
  });
});

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/borrow', borrowRoutes);
app.use('/api/return', returnRoutes);

// Catch-all 404 handler for undefined endpoints
app.use(notFoundHandler);

// Centralized error handling middleware
app.use(errorHandler);

export default app;
