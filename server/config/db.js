// config/db.js
import mongoose from 'mongoose';

// Cache connection (singleton pattern for dev hot-reload or serverless environments)
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  // Return cached connection if available
  if (cached.conn) {
    console.log('✅ Using cached MongoDB connection');
    return cached.conn;
  }

  // Create new connection if none in progress
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,             // Fail fast if not connected
      serverSelectionTimeoutMS: 5000,    // Time out quickly if server not available
    };

    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongooseInstance) => {
      console.log('✅ New MongoDB connection established');
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    console.error('❌ MongoDB initial connection error:', err.message);
    process.exit(1); // Exit on failure so process manager restarts app
  }

  return cached.conn;
};

// --- Event listeners for runtime visibility ---
mongoose.connection.on('connected', () => {
  console.log('🔗 MongoDB connected');
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB runtime error:', err);
});

// --- Graceful shutdown ---
const gracefulExit = async (signal) => {
  await mongoose.connection.close();
  console.log(`🔌 MongoDB connection closed due to ${signal}`);
  process.exit(0);
};

process.on('SIGINT', () => gracefulExit('SIGINT'));
process.on('SIGTERM', () => gracefulExit('SIGTERM'));

export default connectDB;
