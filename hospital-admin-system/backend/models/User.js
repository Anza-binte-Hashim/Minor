/**
 * User Model - for Patients/Users
 * ACCURATE & PRODUCTION-READY WITH SECURITY
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [50, 'Username cannot exceed 50 characters'],
        lowercase: true,
        match: [/^[a-z0-9_-]+$/, 'Username can only contain lowercase letters, numbers, underscores, and hyphens']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false // Don't return password by default
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        validate: [validator. isEmail, 'Please provide a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        validate: {
            validator: function(v) {
                return /^[\d\-\+\(\)\s]+$/.test(v) && v.replace(/\D/g, '').length >= 10;
            },
            message: 'Please provide a valid phone number'
        }
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true,
        minlength: [5, 'Address must be at least 5 characters'],
        maxlength: [500, 'Address cannot exceed 500 characters']
    },
    nid: {
        type: String,
        required: [true, 'National ID is required'],
        unique: true,
        trim: true,
        minlength: [10, 'National ID must be at least 10 characters'],
        maxlength: [20, 'National ID cannot exceed 20 characters']
    },
    role: {
        type: String,
        enum: {
            values: ['user', 'hospital', 'admin'],
            message: 'Role must be user, hospital, or admin'
        },
        default: 'user'
    },
    status: {
        type: String,
        enum: {
            values: ['active', 'inactive', 'pending', 'suspended'],
            message: 'Status must be active, inactive, pending, or suspended'
        },
        default: 'pending'
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        default: null
    },
    lastLogin: {
        type: Date,
        default: null
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// ============ INDEXES FOR PERFORMANCE ============
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ nid: 1 });
userSchema.index({ createdAt: -1 });

// ============ PRE-SAVE MIDDLEWARE ============
// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this. password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// ============ INSTANCE METHODS ============

/**
 * Compare password method
 */
userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

/**
 * Get public profile (without sensitive data)
 */
userSchema.methods.getPublicProfile = function() {
    const user = this. toObject();
    delete user. password;
    delete user.loginAttempts;
    delete user.lockUntil;
    return user;
};

/**
 * Check if account is locked
 */
userSchema.methods.isLocked = function() {
    return this.lockUntil && this.lockUntil > Date. now();
};

/**
 * Increment login attempts
 */
userSchema.methods.incLoginAttempts = function() {
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }

    const updates = { $inc: { loginAttempts: 1 } };
    const maxAttempts = 5;
    const lockTimeMs = 2 * 60 * 60 * 1000; // 2 hours

    if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
        updates.$set = { lockUntil: Date.now() + lockTimeMs };
    }

    return this.updateOne(updates);
};

/**
 * Reset login attempts
 */
userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $set: { loginAttempts: 0, lastLogin: Date.now() },
        $unset: { lockUntil: 1 }
    });
};

module.exports = mongoose.model('User', userSchema);