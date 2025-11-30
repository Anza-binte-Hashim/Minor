/**
 * Authentication Middleware
 * JWT Verification and User Authentication
 * ACCURATE & PRODUCTION-READY WITH SECURITY
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify JWT token and attach user to request
 */
const verifyToken = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No authentication token provided'
            });
        }

        const decoded = jwt. verify(token, process.env. JWT_SECRET || 'your-secret-key');
        
        // Check if user still exists
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user account is active
        if (user.status === 'suspended') {
            return res.status(403).json({
                success: false,
                message: 'Account is suspended'
            });
        }

        // Check if user account is locked
        if (user. isLocked()) {
            return res.status(403).json({
                success: false,
                message: 'Account is temporarily locked due to multiple failed login attempts'
            });
        }

        req. user = decoded;
        req.userId = decoded.id;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token has expired'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Authentication error',
            error: error.message
        });
    }
};

/**
 * Optional authentication - doesn't fail if token is missing
 */
const optionalAuth = async (req, res, next) => {
    try {
        const token = req. header('Authorization')?.replace('Bearer ', '');

        if (token) {
            const decoded = jwt.verify(token, process. env.JWT_SECRET || 'your-secret-key');
            const user = await User.findById(decoded.id);
            
            if (user && user.status !== 'suspended' && ! user.isLocked()) {
                req.user = decoded;
                req.userId = decoded.id;
            }
        }

        next();
    } catch (error) {
        // Silently fail and continue
        next();
    }
};

module.exports = { verifyToken, optionalAuth };