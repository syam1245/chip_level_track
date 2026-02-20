import mongoose from 'mongoose';
import { seedUsers } from './seed.js';
import config from './index.js';
import logger from '../utils/logger.js';

let cached = global.mongoose;
if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    if (cached.conn) {
        logger.info('✅ Using cached MongoDB connection');
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000,
        };

        cached.promise = mongoose.connect(config.mongodbUri, opts).then((mongooseInstance) => {
            logger.info('✅ New MongoDB connection established');
            return mongooseInstance;
        });
    }

    try {
        cached.conn = await cached.promise;
        await seedUsers();
    } catch (err) {
        cached.promise = null;
        logger.error('❌ MongoDB initial connection error:', err.message);
        process.exit(1);
    }

    return cached.conn;
};

mongoose.connection.on('connected', () => {
    logger.info('🔗 MongoDB connected');
});

mongoose.connection.on('disconnected', () => {
    logger.warn('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
    logger.error('❌ MongoDB runtime error:', err);
});

export default connectDB;
