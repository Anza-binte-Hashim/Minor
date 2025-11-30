/**
 * Hospital Model
 * ACCURATE & PRODUCTION-READY WITH SECURITY
 */

const mongoose = require('mongoose');
const validator = require('validator');

const hospitalSchema = new mongoose. Schema({
    userId: {
        type: mongoose. Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required']
    },
    name: {
        type: String,
        required: [true, 'Hospital name is required'],
        trim: true,
        minlength: [3, 'Hospital name must be at least 3 characters'],
        maxlength: [100, 'Hospital name cannot exceed 100 characters']
    },
    venue: {
        type: String,
        required: [true, 'Venue is required'],
        trim: true,
        minlength: [5, 'Venue must be at least 5 characters'],
        maxlength: [200, 'Venue cannot exceed 200 characters']
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
    description: {
        type: String,
        default: '',
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    licenseUrl: {
        type: String,
        required: [true, 'License file is required']
    },
    status: {
        type: String,
        enum: {
            values: ['approved', 'pending', 'rejected'],
            message: 'Status must be approved, pending, or rejected'
        },
        default: 'pending'
    },
    rejectionReason: {
        type: String,
        default: null
    },
    doctors: [{
        type: mongoose. Schema.Types.ObjectId,
        ref: 'Doctor'
    }],
    departments: [{
        type: mongoose. Schema.Types.ObjectId,
        ref: 'Department'
    }],
    totalDoctors: {
        type: Number,
        default: 0
    },
    totalDepartments: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date. now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// ============ INDEXES ============
hospitalSchema.index({ email: 1 });
hospitalSchema.index({ userId: 1 });
hospitalSchema.index({ status: 1 });
hospitalSchema.index({ createdAt: -1 });

// ============ INSTANCE METHODS ============

/**
 * Get public hospital info
 */
hospitalSchema.methods.getPublicInfo = function() {
    return {
        _id: this._id,
        name: this.name,
        venue: this.venue,
        email: this.email,
        phone: this.phone,
        description: this.description,
        totalDoctors: this.totalDoctors,
        totalDepartments: this.totalDepartments,
        status: this.status
    };
};

module.exports = mongoose.model('Hospital', hospitalSchema);