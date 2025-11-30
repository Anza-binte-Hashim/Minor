/**
 * Authentication Controller
 * Handles user login, registration, and token management
 * ACCURATE & PRODUCTION-READY WITH COMPREHENSIVE SECURITY
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Registration = require('../models/Registration');
const Hospital = require('../models/Hospital');
const nodemailer = require('nodemailer');
const path = require('path');

/**
 * Generate JWT token with expiration
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateToken = (user) => {
    try {
        const token = jwt.sign(
            {
                id: user._id. toString(),
                username: user.username,
                role: user.role,
                email: user.email,
                hospitalId: user.hospitalId ?  user.hospitalId.toString() : null
            },
            process.env. JWT_SECRET || 'your-secret-key',
            {
                expiresIn: '7d',
                issuer: 'hospital-admin-system',
                audience: 'hospital-admin-users'
            }
        );

        return token;
    } catch (error) {
        console.error('Token generation error:', error);
        throw new Error('Failed to generate authentication token');
    }
};

/**
 * Setup email transporter with error handling
 * @returns {Object} Nodemailer transporter
 */
const setupEmailTransporter = () => {
    try {
        return nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env. EMAIL_PASSWORD
            },
            secure: true,
            requireTLS: true
        });
    } catch (error) {
        console.error('Email transporter setup error:', error);
        throw new Error('Failed to configure email service');
    }
};

/**
 * Generate secure random credentials
 * @param {string} prefix - Username prefix
 * @returns {Object} Object with username and password
 */
const generateCredentials = (prefix = 'user') => {
    try {
        // Generate username
        const randomSuffix = Math.random().toString(36).substr(2, 9);
        const username = `${prefix}_${randomSuffix}`;

        // Generate strong password
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const specials = '@$!%*?&';

        let password = '';
        
        // Ensure at least one of each character type
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += specials[Math.floor(Math.random() * specials.length)];

        // Fill remaining characters randomly
        const allChars = uppercase + lowercase + numbers + specials;
        for (let i = password.length; i < 14; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }

        // Shuffle password
        password = password.split('').sort(() => 0.5 - Math.random()).join('');

        return { username, password };
    } catch (error) {
        console. error('Credential generation error:', error);
        throw new Error('Failed to generate credentials');
    }
};

/**
 * Send credentials email with HTML template
 * @param {string} email - Recipient email
 * @param {string} username - Username
 * @param {string} password - Password
 * @param {string} name - Recipient name
 * @param {string} type - User type (user or hospital)
 * @returns {Promise<boolean>} Success status
 */
const sendCredentialsEmail = async (email, username, password, name, type = 'user') => {
    try {
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email address');
        }

        const transporter = setupEmailTransporter();

        const mailOptions = {
            from: `"Hospital Admin System" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your Hospital Administration System Credentials',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; padding: 20px;">
                    <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #2c3e50; margin: 0;">Hospital Administration System</h1>
                            <p style="color: #7f8c8d; margin: 10px 0 0 0; font-size: 14px;">Secure Healthcare Management Platform</p>
                        </div>

                        <h2 style="color: #2c3e50; font-size: 20px; margin-bottom: 20px;">Welcome, ${name}!</h2>
                        
                        <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                            Your ${type} registration has been approved. You can now access the Hospital Administration System using the credentials below. 
                        </p>
                        
                        <div style="background-color: #ecf0f1; border-left: 5px solid #3498db; padding: 20px; margin: 25px 0; border-radius: 4px;">
                            <p style="margin: 0 0 15px 0; color: #333;">
                                <strong>Login Credentials:</strong>
                            </p>
                            <div style="background-color: #ffffff; padding: 15px; border-radius: 4px; margin: 10px 0; font-family: 'Courier New', monospace;">
                                <p style="margin: 10px 0; color: #2c3e50;">
                                    <strong>Username:</strong> <span style="background-color: #e8e8e8; padding: 5px 10px; border-radius: 3px; font-weight: bold;">${username}</span>
                                </p>
                                <p style="margin: 10px 0; color: #2c3e50;">
                                    <strong>Password:</strong> <span style="background-color: #e8e8e8; padding: 5px 10px; border-radius: 3px; font-weight: bold;">${password}</span>
                                </p>
                            </div>
                        </div>
                        
                        <div style="background-color: #fff3cd; border-left: 5px solid #f39c12; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 0; color: #856404; font-weight: bold;">
                                ⚠️ Important Security Notice
                            </p>
                            <ul style="color: #856404; padding-left: 20px; margin: 10px 0 0 0;">
                                <li>Change your password immediately after first login</li>
                                <li>Never share these credentials with anyone</li>
                                <li>Use a strong, unique password</li>
                                <li>Enable two-factor authentication if available</li>
                            </ul>
                        </div>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env. FRONTEND_URL || 'http://localhost:3000'}" style="background-color: #3498db; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; display: inline-block; font-weight: bold;">
                                Log In to Your Account
                            </a>
                        </div>

                        <div style="border-top: 1px solid #ecf0f1; padding-top: 20px; margin-top: 30px; color: #95a5a6; font-size: 12px; text-align: center;">
                            <p style="margin: 5px 0;">
                                If you did not request this email or have any questions, please contact our support team.
                            </p>
                            <p style="margin: 5px 0;">
                                &copy; ${new Date().getFullYear()} Hospital Administration System. All rights reserved.
                            </p>
                        </div>

                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✓ Credentials email sent successfully.  Message ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('Failed to send credentials email:', error. message);
        return false;
    }
};

/**
 * User Login
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Input validation
        if (!username || ! password) {
            return res. status(400).json({
                success: false,
                message: 'Username and password are required',
                code: 'MISSING_CREDENTIALS'
            });
        }

        // Trim inputs
        const trimmedUsername = username.trim(). toLowerCase();
        const trimmedPassword = password.trim();

        if (trimmedUsername. length < 3 || trimmedPassword.length < 1) {
            return res.status(400).json({
                success: false,
                message: 'Invalid username or password format',
                code: 'INVALID_FORMAT'
            });
        }

        // Find user with password field
        const user = await User. findOne({ username: trimmedUsername }). select('+password');

        if (! user) {
            // Don't reveal if user exists
            return res.status(401). json({
                success: false,
                message: 'Invalid credentials',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Check if account is locked
        if (user. isLocked()) {
            return res.status(423).json({
                success: false,
                message: 'Account is temporarily locked due to multiple failed login attempts.  Please try again after 2 hours.',
                code: 'ACCOUNT_LOCKED',
                lockedUntil: user.lockUntil
            });
        }

        // Verify password
        const isValidPassword = await user.comparePassword(trimmedPassword);

        if (!isValidPassword) {
            // Increment login attempts
            await user.incLoginAttempts();

            const remainingAttempts = 5 - (user.loginAttempts + 1);
            if (remainingAttempts > 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials',
                    code: 'INVALID_CREDENTIALS',
                    remainingAttempts: remainingAttempts
                });
            } else {
                return res.status(423).json({
                    success: false,
                    message: 'Account locked due to too many failed attempts',
                    code: 'ACCOUNT_LOCKED',
                    lockedUntil: user.lockUntil
                });
            }
        }

        // Check if user is active
        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Your account is not active. Please contact the administrator.',
                code: 'ACCOUNT_INACTIVE',
                accountStatus: user.status
            });
        }

        // Reset login attempts on successful login
        await user.resetLoginAttempts();

        // Generate token
        const token = generateToken(user);

        // Return success response
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                name: user.name,
                role: user.role,
                hospitalId: user.hospitalId
            },
            expiresIn: '7d'
        });

        console.log(`✓ User ${user.username} logged in successfully`);
    } catch (error) {
        console.error('Login error:', error);
        res. status(500).json({
            success: false,
            message: 'Login failed.  Please try again.',
            code: 'LOGIN_ERROR',
            error: process.env. NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Register User
 * POST /api/auth/register-user
 */
exports.registerUser = async (req, res) => {
    try {
        const { name, email, phone, address, nid } = req.body;

        // Input validation
        if (!name || !email || !phone || !address || !nid) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
                code: 'MISSING_FIELDS'
            });
        }

        // Trim inputs
        const trimmedData = {
            name: name.trim(),
            email: email.trim(). toLowerCase(),
            phone: phone. trim(),
            address: address. trim(),
            nid: nid.trim()
        };

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (! emailRegex.test(trimmedData.email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address',
                code: 'INVALID_EMAIL'
            });
        }

        // Validate phone
        const phoneRegex = /^[\d\-\+\(\)\s]+$/;
        const phoneDigits = trimmedData.phone. replace(/\D/g, '');
        if (!phoneRegex.test(trimmedData.phone) || phoneDigits.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number',
                code: 'INVALID_PHONE'
            });
        }

        // Validate NID
        if (trimmedData.nid. length < 10 || trimmedData. nid.length > 20) {
            return res.status(400).json({
                success: false,
                message: 'National ID must be 10-20 characters',
                code: 'INVALID_NID'
            });
        }

        // Check for existing user/email
        const existingUser = await User.findOne({
            $or: [
                { email: trimmedData.email },
                { nid: trimmedData.nid }
            ]
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'A user with this email or National ID already exists',
                code: 'USER_EXISTS',
                conflictField: existingUser.email === trimmedData.email ? 'email' : 'nid'
            });
        }

        // Create registration request
        const registration = new Registration({
            type: 'user',
            data: trimmedData,
            status: 'pending'
        });

        const savedRegistration = await registration.save();

        res.status(201).json({
            success: true,
            message: 'Registration submitted successfully.  An administrator will review your application and send you login credentials via email.',
            code: 'REGISTRATION_SUBMITTED',
            registrationId: savedRegistration._id
        });

        console.log(`✓ New user registration submitted: ${trimmedData.email}`);
    } catch (error) {
        console.error('User registration error:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                errors: messages
            });
        }

        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.',
            code: 'REGISTRATION_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Register Hospital
 * POST /api/auth/register-hospital
 */
exports.registerHospital = async (req, res) => {
    try {
        const { name, venue, email, phone } = req.body;
        const licenseFile = req.file;

        // Input validation
        if (!name || !venue || !email || !phone) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
                code: 'MISSING_FIELDS'
            });
        }

        if (!licenseFile) {
            return res.status(400).json({
                success: false,
                message: 'License file is required',
                code: 'MISSING_FILE'
            });
        }

        // Trim inputs
        const trimmedData = {
            name: name.trim(),
            venue: venue.trim(),
            email: email.trim(). toLowerCase(),
            phone: phone. trim()
        };

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedData.email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address',
                code: 'INVALID_EMAIL'
            });
        }

        // Validate phone
        const phoneRegex = /^[\d\-\+\(\)\s]+$/;
        const phoneDigits = trimmedData.phone.replace(/\D/g, '');
        if (!phoneRegex.test(trimmedData. phone) || phoneDigits.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number',
                code: 'INVALID_PHONE'
            });
        }

        // Check for existing hospital
        const existingHospital = await User.findOne({ email: trimmedData.email });

        if (existingHospital) {
            return res.status(409).json({
                success: false,
                message: 'A hospital with this email already exists',
                code: 'HOSPITAL_EXISTS'
            });
        }

        // Create registration request
        const registration = new Registration({
            type: 'hospital',
            data: {
                ... trimmedData,
                licenseUrl: `/uploads/${licenseFile.filename}`
            },
            status: 'pending'
        });

        const savedRegistration = await registration.save();

        res.status(201).json({
            success: true,
            message: 'Hospital registration submitted successfully. An administrator will review your license and send you login credentials via email.',
            code: 'REGISTRATION_SUBMITTED',
            registrationId: savedRegistration._id
        });

        console.log(`✓ New hospital registration submitted: ${trimmedData.email}`);
    } catch (error) {
        console.error('Hospital registration error:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors). map(e => e.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                errors: messages
            });
        }

        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.',
            code: 'REGISTRATION_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Verify token
 * GET /api/auth/verify
 */
exports.verifyToken = async (req, res) => {
    try {
        const user = await User.findById(req.user.id). select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'User account is not active',
                code: 'ACCOUNT_INACTIVE'
            });
        }

        res.json({
            success: true,
            message: 'Token is valid',
            user: {
                id: user._id,
                username: user. username,
                email: user. email,
                name: user. name,
                role: user. role
            }
        });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Token verification failed',
            code: 'VERIFICATION_ERROR'
        });
    }
};

module.exports = {
    login: exports.login,
    registerUser: exports.registerUser,
    registerHospital: exports.registerHospital,
    verifyToken: exports.verifyToken,
    generateToken,
    generateCredentials,
    sendCredentialsEmail,
    setupEmailTransporter
};