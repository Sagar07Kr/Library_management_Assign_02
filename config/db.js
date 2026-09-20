const mongoose = require('mongoose');
const config = require('./config');

/**
 * Connect to MongoDB Atlas (or local MongoDB).
 * Includes retry logic and connection event handlers.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✓ MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✓ MongoDB reconnected');
    });

    return conn;
  } catch (error) {
    console.error('✗ Primary MongoDB connection failed:', error.message);

    // If in development and remote Atlas URI is unreachable, fallback to local MongoDB
    if (!config.isProduction && config.mongoUri.includes('mongodb+srv://')) {
      console.log('🔄 Attempting fallback to local MongoDB (mongodb://localhost:27017/library-management)...');
      try {
        const localConn = await mongoose.connect('mongodb://localhost:27017/library-management', {
          serverSelectionTimeoutMS: 3000,
        });
        console.log(`✓ Connected to local MongoDB fallback: ${localConn.connection.host}`);
        return localConn;
      } catch (localErr) {
        console.error('✗ Local MongoDB fallback also failed:', localErr.message);
      }
    }

    throw error;
  }
};

module.exports = connectDB;
