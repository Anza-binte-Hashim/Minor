/**
 * Doctor Model
 * ACCURATE & PRODUCTION-READY
 */

const mongoose = require('mongoose');
const validator = require('validator');

const doctorSchema = new mongoose.Schema({
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: [true, 'Hospital reference is required']
    },
    name: {
        type: String,
        required: [true, 'Doctor name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
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
    department: {
        type: String,
        required: [true, 'Department is required'],
        trim: true
    },
    gender: {
        type: String,
        enum: {
            values: ['Male', 'Female'],
            message: 'Gender must be Male or Female'
        },
        required: [true, 'Gender is required']
    },
    specialization: {
        type: String,
        default: '',
        trim: true,
        maxlength: [100, 'Specialization cannot exceed 100 characters']
    },
    status: {
        type: String,
        enum: {
            values: ['available', 'busy', 'unavailable'],
            message: 'Status must be available, busy, or unavailable'
        },
        default: 'available'
    },
    bio: {
        type: String,
        default: '',
        maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    qualifications: [{
        type: String,
        maxlength: [200, 'Each qualification cannot exceed 200 characters']
    }],
    experience: {
        type: Number,
        default: 0,
        min: [0, 'Experience cannot be negative'],
        max: [70, 'Experience cannot exceed 70 years']
    },
    consultationFee: {
        type: Number,
        default: 0,
        min: [0, 'Consultation fee cannot be negative']
    },
    availability: {
        monday: { from: String, to: String },
        tuesday: { from: String, to: String },
        wednesday: { from: String, to: String },
        thursday: { from: String, to: String },
        friday: { from: String, to: String },
        saturday: { from: String, to: String },
        sunday: { from: String, to: String }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date. now
    }
}, { timestamps: true });

// ============ INDEXES ============
doctorSchema.index({ hospitalId: 1 });
doctorSchema.index({ department: 1 });
doctorSchema.index({ status: 1 });
doctorSchema.index({ email: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);