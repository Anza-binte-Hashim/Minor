/**
 * Authentication Routes
 * ACCURATE & PRODUCTION-READY
 */

const express = require('express');
const router = express. Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];
        const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];

        if (allowedMimes. includes(file.mimetype) &&
            allowedExtensions.includes(path.extname(file. originalname). toLowerCase())) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', authController.login);

/**
 * POST /api/auth/register-user
 * Register new user
 */
router.post('/register-user', authController.registerUser);

/**
 * POST /api/auth/register-hospital
 * Register new hospital
 */
router.post('/register-hospital', upload.single('license'), authController. registerHospital);

/**
 * GET /api/auth/verify
 * Verify token
 */
router.get('/verify', verifyToken, (req, res) => {
    res.json({
        success: true,
        message: 'Token is valid',
        user: req.user
    });
});

module.exports = router;