/**
 * Department Model
 * ACCURATE & PRODUCTION-READY
 */

const mongoose = require('mongoose');

const departmentSchema = new mongoose. Schema({
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: [true, 'Hospital reference is required']
    },
    name: {
        type: String,
        required: [true, 'Department name is required'],
        trim: true,
        minlength: [2, 'Department name must be at least 2 characters'],
        maxlength: [100, 'Department name cannot exceed 100 characters']
    },
    description: {
        type: String,
        default: '',
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    doctors: [{
        type: mongoose. Schema.Types.ObjectId,
        ref: 'Doctor'
    }],
    headDoctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        default: null
    },
    totalBeds: {
        type: Number,
        default: 0,
        min: [0, 'Total beds cannot be negative']
    },
    availableBeds: {
        type: Number,
        default: 0,
        min: [0, 'Available beds cannot be negative']
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
departmentSchema.index({ hospitalId: 1 });
departmentSchema.index({ name: 1 });

module.exports = mongoose.model('Department', departmentSchema);