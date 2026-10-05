import dotenv from 'dotenv';

// Load environment variables from .env file before other modules
dotenv.config();

import app from './app.js';
import { connectDB } from './utils/db.js';

const PORT = process.env.PORT || 5000;

/**
 * Start the ShelfLife Backend Server
 */
const startServer = async () => {
  // Establish connection to MongoDB
  await connectDB();

  // Listen on configured port
  const server = app.listen(PORT, () => {
    console.log(`[ShelfLife Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`[ShelfLife Server] Health endpoint: http://localhost:${PORT}/api/health`);
  });

  // Handle unhandled promise rejections gracefully
  process.on('unhandledRejection', (err) => {
    console.error(`[Unhandled Rejection]: ${err.message}`);
    server.close(() => process.exit(1));
  });

  // Handle termination signals
  process.on('SIGTERM', () => {
    console.log('[ShelfLife Server] SIGTERM received. Shutting down gracefully...');
    server.close(() => process.exit(0));
  });
};

startServer();
