/**
 * Registration Request Model
 * ACCURATE & PRODUCTION-READY
 */

const mongoose = require('mongoose');

const registrationSchema = new mongoose. Schema({
    type: {
        type: String,
        enum: {
            values: ['user', 'hospital'],
            message: 'Type must be user or hospital'
        },
        required: [true, 'Registration type is required']
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, 'Registration data is required']
    },
    status: {
        type: String,
        enum: {
            values: ['pending', 'accepted', 'rejected'],
            message: 'Status must be pending, accepted, or rejected'
        },
        default: 'pending'
    },
    rejectionReason: {
        type: String,
        default: null,
        maxlength: [500, 'Rejection reason cannot exceed 500 characters']
    },
    username: {
        type: String,
        default: null,
        trim: true
    },
    password: {
        type: String,
        default: null,
        select: false
    },
    userId: {
        type: mongoose. Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    reviewedAt: {
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

// ============ INDEXES ============
registrationSchema.index({ type: 1, status: 1 });
registrationSchema.index({ createdAt: -1 });
registrationSchema.index({ status: 1 });

module. exports = mongoose.model('Registration', registrationSchema);