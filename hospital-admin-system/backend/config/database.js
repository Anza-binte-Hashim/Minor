/**
 * Database Configuration
 * MongoDB Connection Setup with Connection Pooling
 * ACCURATE & PRODUCTION-READY
 */

const mongoose = require('mongoose');

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
    try {
        const mongoURI = process.env. MONGODB_URI || 'mongodb://localhost:27017/hospital-admin';
        
        await mongoose. connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10,
            socketTimeoutMS: 45000,
            serverSelectionTimeoutMS: 5000,
            retryWrites: true
        });

        const connection = mongoose.connection;

        connection.on('connected', () => {
            console.log('✓ MongoDB connected successfully');
            console.log(`Database: ${connection.db.getName()}`);
        });

        connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        connection.on('disconnected', () => {
            console. warn('MongoDB disconnected');
        });

        return connection;
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error. message);
        process.exit(1);
    }
};

module.exports = { connectDB };