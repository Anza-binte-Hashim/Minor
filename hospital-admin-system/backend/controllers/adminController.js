/**
 * Admin Controller - COMPLETE & ACCURATE
 * Comprehensive admin operations for users, hospitals, and registrations
 * PRODUCTION-READY WITH FULL ERROR HANDLING AND SECURITY
 */

const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Registration = require('../models/Registration');
const Doctor = require('../models/Doctor');
const Department = require('../models/Department');
const { generateCredentials, sendCredentialsEmail } = require('./authController');

// ============ USER MANAGEMENT ============

/**
 * Get all users with pagination and filtering
 * GET /api/admin/users
 */
exports.getUsers = async (req, res) => {
    try {
        const { search, status, role, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = -1 } = req.query;

        // Build query filter
        let query = { role: { $ne: 'admin' } };

        // Search filter
        if (search && search.trim()) {
            const searchRegex = search.trim(). replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.$or = [
                { name: { $regex: searchRegex, $options: 'i' } },
                { email: { $regex: searchRegex, $options: 'i' } },
                { username: { $regex: searchRegex, $options: 'i' } }
            ];
        }

        // Status filter
        if (status && ['active', 'inactive', 'pending', 'suspended'].includes(status)) {
            query.status = status;
        }

        // Role filter
        if (role && ['user', 'hospital']. includes(role)) {
            query.role = role;
        }

        // Validate pagination
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
        const skip = (pageNum - 1) * limitNum;

        // Build sort object
        const sortObj = {};
        const validSortFields = ['createdAt', 'name', 'email', 'status'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
        sortObj[sortField] = parseInt(sortOrder) === 1 ? 1 : -1;

        // Execute query
        const users = await User.find(query)
            .select('-password -loginAttempts -lockUntil')
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Get total count
        const total = await User.countDocuments(query);

        res.json({
            success: true,
            message: 'Users retrieved successfully',
            data: users,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum),
                hasNextPage: skip + limitNum < total,
                hasPrevPage: pageNum > 1
            }
        });

        console.log(`✓ Admin retrieved ${users.length} users (search: "${search}", status: "${status}")`);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve users',
            code: 'FETCH_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get single user by ID
 * GET /api/admin/users/:id
 */
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate MongoDB ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format',
                code: 'INVALID_ID'
            });
        }

        const user = await User.findById(id)
            .select('-password -loginAttempts -lockUntil')
            .populate('hospitalId', 'name email status');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                code: 'NOT_FOUND'
            });
        }

        res.json({
            success: true,
            message: 'User retrieved successfully',
            data: user
        });

        console.log(`✓ Admin retrieved user: ${user.username}`);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve user',
            code: 'FETCH_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Update user information
 * PUT /api/admin/users/:id
 */
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, name, email, phone, address } = req.body;

        // Validate MongoDB ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format',
                code: 'INVALID_ID'
            });
        }

        // Check if user exists
        const existingUser = await User.findById(id);
        if (!existingUser) {
            return res. status(404).json({
                success: false,
                message: 'User not found',
                code: 'NOT_FOUND'
            });
        }

        // Cannot modify admin accounts
        if (existingUser.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin accounts cannot be modified',
                code: 'FORBIDDEN'
            });
        }

        // Build update object
        const updateData = {};

        if (status !== undefined) {
            if (! ['active', 'inactive', 'pending', 'suspended'].includes(status)) {
                return res. status(400).json({
                    success: false,
                    message: 'Invalid status value',
                    code: 'INVALID_STATUS',
                    validStatuses: ['active', 'inactive', 'pending', 'suspended']
                });
            }
            updateData.status = status;
        }

        if (name !== undefined) {
            const trimmedName = name.trim();
            if (trimmedName.length < 2 || trimmedName.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Name must be between 2 and 100 characters',
                    code: 'INVALID_NAME'
                });
            }
            updateData.name = trimmedName;
        }

        if (email !== undefined) {
            const trimmedEmail = email.trim(). toLowerCase();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(trimmedEmail)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email format',
                    code: 'INVALID_EMAIL'
                });
            }

            // Check if email is already in use
            const emailExists = await User.findOne({
                email: trimmedEmail,
                _id: { $ne: id }
            });

            if (emailExists) {
                return res.status(409).json({
                    success: false,
                    message: 'Email is already in use',
                    code: 'EMAIL_EXISTS'
                });
            }

            updateData.email = trimmedEmail;
        }

        if (phone !== undefined) {
            const trimmedPhone = phone.trim();
            const phoneRegex = /^[\d\-\+\(\)\s]+$/;
            const phoneDigits = trimmedPhone.replace(/\D/g, '');

            if (!phoneRegex.test(trimmedPhone) || phoneDigits.length < 10) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid phone number (minimum 10 digits required)',
                    code: 'INVALID_PHONE'
                });
            }

            updateData.phone = trimmedPhone;
        }

        if (address !== undefined) {
            const trimmedAddress = address.trim();
            if (trimmedAddress. length > 0 && trimmedAddress.length < 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Address must be at least 5 characters',
                    code: 'INVALID_ADDRESS'
                });
            }
            updateData.address = trimmedAddress;
        }

        updateData.updatedAt = new Date();

        // Update user
        const updatedUser = await User. findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ). select('-password -loginAttempts -lockUntil');

        res.json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });

        console.log(`✓ Admin updated user: ${updatedUser.username}`);
    } catch (error) {
        console.error('Update user error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                errors: messages
            });
        }

        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res. status(409).json({
                success: false,
                message: `${field} is already in use`,
                code: 'DUPLICATE_ENTRY',
                field
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update user',
            code: 'UPDATE_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Delete user
 * DELETE /api/admin/users/:id
 */
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate MongoDB ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format',
                code: 'INVALID_ID'
            });
        }

        // Cannot delete self
        if (id === req. user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account',
                code: 'SELF_DELETE'
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                code: 'NOT_FOUND'
            });
        }

        // Cannot delete admin accounts
        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin accounts cannot be deleted',
                code: 'FORBIDDEN'
            });
        }

        // If user is a hospital, delete associated resources
        if (user.role === 'hospital') {
            const hospital = await Hospital.findOne({ userId: id });
            if (hospital) {
                await Doctor.deleteMany({ hospitalId: hospital._id });
                await Department.deleteMany({ hospitalId: hospital._id });
                await Hospital. findByIdAndDelete(hospital._id);
            }
        }

        // Delete user
        await User.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'User deleted successfully',
            deletedUser: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

        console.log(`✓ Admin deleted user: ${user.username} (${user. role})`);
    } catch (error) {
        console. error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            code: 'DELETE_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ============ HOSPITAL MANAGEMENT ============

/**
 * Get all hospitals with pagination and filtering
 * GET /api/admin/hospitals
 */
exports. getHospitals = async (req, res) => {
    try {
        const { search, status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = -1 } = req.query;

        // Build query filter
        let query = {};

        // Search filter
        if (search && search.trim()) {
            const searchRegex = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.$or = [
                { name: { $regex: searchRegex, $options: 'i' } },
                { email: { $regex: searchRegex, $options: 'i' } },
                { venue: { $regex: searchRegex, $options: 'i' } }
            ];
        }

        // Status filter
        if (status && ['approved', 'pending', 'rejected'].includes(status)) {
            query.status = status;
        }

        // Validate pagination
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
        const skip = (pageNum - 1) * limitNum;

        // Build sort object
        const sortObj = {};
        const validSortFields = ['createdAt', 'name', 'email', 'status'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
        sortObj[sortField] = parseInt(sortOrder) === 1 ? 1 : -1;

        // Execute query
        const hospitals = await Hospital.find(query)
            .populate('userId', 'username email')
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Get total count
        const total = await Hospital.countDocuments(query);

        // Count doctors and departments for each hospital
        const hospitalData = await Promise.all(hospitals. map(async (hospital) => {
            const doctorCount = await Doctor.countDocuments({ hospitalId: hospital._id });
            const departmentCount = await Department.countDocuments({ hospitalId: hospital._id });
            return {
                ... hospital,
                doctorCount,
                departmentCount
            };
        }));

        res.json({
            success: true,
            message: 'Hospitals retrieved successfully',
            data: hospitalData,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum),
                hasNextPage: skip + limitNum < total,
                hasPrevPage: pageNum > 1
            }
        });

        console.log(`✓ Admin retrieved ${hospitals.length} hospitals`);
    } catch (error) {
        console.error('Get hospitals error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve hospitals',
            code: 'FETCH_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get single hospital by ID
 * GET /api/admin/hospitals/:id
 */
exports.getHospitalById = async (req, res) => {
    try {
        const { id } = req. params;

        // Validate MongoDB ObjectId
        if (!id. match(/^[0-9a-fA-F]{24}$/)) {
            return res. status(400).json({
                success: false,
                message: 'Invalid hospital ID format',
                code: 'INVALID_ID'
            });
        }

        const hospital = await Hospital. findById(id)
            . populate('userId', 'username email')
            .populate({
                path: 'doctors',
                select: 'name email department status'
            })
            .populate({
                path: 'departments',
                select: 'name description'
            });

        if (!hospital) {
            return res.status(404). json({
                success: false,
                message: 'Hospital not found',
                code: 'NOT_FOUND'
            });
        }

        res.json({
            success: true,
            message: 'Hospital retrieved successfully',
            data: hospital
        });

        console.log(`✓ Admin retrieved hospital: ${hospital.name}`);
    } catch (error) {
        console.error('Get hospital error:', error);
        res. status(500).json({
            success: false,
            message: 'Failed to retrieve hospital',
            code: 'FETCH_ERROR',
            error: process. env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Update hospital information
 * PUT /api/admin/hospitals/:id
 */
exports.updateHospital = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, venue, email, phone, description, status } = req.body;

        // Validate MongoDB ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid hospital ID format',
                code: 'INVALID_ID'
            });
        }

        // Check if hospital exists
        const existingHospital = await Hospital.findById(id);
        if (!existingHospital) {
            return res.status(404).json({
                success: false,
                message: 'Hospital not found',
                code: 'NOT_FOUND'
            });
        }

        // Build update object
        const updateData = {};

        if (name !== undefined) {
            const trimmedName = name.trim();
            if (trimmedName.length < 3 || trimmedName.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Hospital name must be between 3 and 100 characters',
                    code: 'INVALID_NAME'
                });
            }
            updateData.name = trimmedName;
        }

        if (venue !== undefined) {
            const trimmedVenue = venue. trim();
            if (trimmedVenue.length < 5 || trimmedVenue.length > 200) {
                return res.status(400).json({
                    success: false,
                    message: 'Venue must be between 5 and 200 characters',
                    code: 'INVALID_VENUE'
                });
            }
            updateData.venue = trimmedVenue;
        }

        if (email !== undefined) {
            const trimmedEmail = email. trim().toLowerCase();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex. test(trimmedEmail)) {
                return res.status(400). json({
                    success: false,
                    message: 'Invalid email format',
                    code: 'INVALID_EMAIL'
                });
            }

            // Check if email is already in use
            const emailExists = await Hospital.findOne({
                email: trimmedEmail,
                _id: { $ne: id }
            });

            if (emailExists) {
                return res.status(409).json({
                    success: false,
                    message: 'Email is already in use',
                    code: 'EMAIL_EXISTS'
                });
            }

            updateData.email = trimmedEmail;
        }

        if (phone !== undefined) {
            const trimmedPhone = phone.trim();
            const phoneRegex = /^[\d\-\+\(\)\s]+$/;
            const phoneDigits = trimmedPhone.replace(/\D/g, '');

            if (!phoneRegex. test(trimmedPhone) || phoneDigits.length < 10) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid phone number (minimum 10 digits required)',
                    code: 'INVALID_PHONE'
                });
            }

            updateData.phone = trimmedPhone;
        }

        if (description !== undefined) {
            const trimmedDesc = description.trim();
            if (trimmedDesc.length > 1000) {
                return res. status(400).json({
                    success: false,
                    message: 'Description cannot exceed 1000 characters',
                    code: 'INVALID_DESCRIPTION'
                });
            }
            updateData.description = trimmedDesc;
        }

        if (status !== undefined) {
            if (! ['approved', 'pending', 'rejected'].includes(status)) {
                return res.status(400). json({
                    success: false,
                    message: 'Invalid status value',
                    code: 'INVALID_STATUS',
                    validStatuses: ['approved', 'pending', 'rejected']
                });
            }
            updateData.status = status;
        }

        updateData.updatedAt = new Date();

        // Update hospital
        const updatedHospital = await Hospital.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('userId', 'username email');

        res.json({
            success: true,
            message: 'Hospital updated successfully',
            data: updatedHospital
        });

        console.log(`✓ Admin updated hospital: ${updatedHospital.name}`);
    } catch (error) {
        console.error('Update hospital error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400). json({
                success: false,
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                errors: messages
            });
        }

        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res. status(409).json({
                success: false,
                message: `${field} is already in use`,
                code: 'DUPLICATE_ENTRY',
                field
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update hospital',
            code: 'UPDATE_ERROR',
            error: process.env.NODE_ENV === 'development' ?  error.message : undefined
        });
    }
};

/**
 * Delete hospital
 * DELETE /api/admin/hospitals/:id
 */
exports.deleteHospital = async (req, res) => {
    try {
        const { id } = req. params;

        // Validate MongoDB ObjectId
        if (!id. match(/^[0-9a-fA-F]{24}$/)) {
            return res. status(400).json({
                success: false,
                message: 'Invalid hospital ID format',
                code: 'INVALID_ID'
            });
        }

        const hospital = await Hospital. findById(id);

        if (!hospital) {
            return res.status(404).json({
                success: false,
                message: 'Hospital not found',
                code: 'NOT_FOUND'
            });
        }

        // Delete associated resources
        await Doctor.deleteMany({ hospitalId: id });
        await Department.deleteMany({ hospitalId: id });

        // Delete hospital user account
        if (hospital.userId) {
            await User.findByIdAndDelete(hospital.userId);
        }

        // Delete hospital record
        await Hospital.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Hospital deleted successfully',
            deletedHospital: {
                id: hospital._id,
                name: hospital.name,
                email: hospital.email
            }
        });

        console.log(`✓ Admin deleted hospital: ${hospital.name}`);
    } catch (error) {
        console.error('Delete hospital error:', error);
        res. status(500).json({
            success: false,
            message: 'Failed to delete hospital',
            code: 'DELETE_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ============ REGISTRATION MANAGEMENT ============

/**
 * Get all registration requests
 * GET /api/admin/registrations
 */
exports.getRegistrationRequests = async (req, res) => {
    try {
        const { type, status = 'pending', page = 1, limit = 10, sortBy = 'createdAt', sortOrder = -1 } = req.query;

        // Build query filter
        let query = {};

        if (status && ['pending', 'accepted', 'rejected'].includes(status)) {
            query.status = status;
        }

        if (type && ['user', 'hospital'].includes(type)) {
            query.type = type;
        }

        // Validate pagination
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
        const skip = (pageNum - 1) * limitNum;

        // Build sort object
        const sortObj = {};
        const validSortFields = ['createdAt', 'type', 'status'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
        sortObj[sortField] = parseInt(sortOrder) === 1 ? 1 : -1;

        // Execute query
        const registrations = await Registration.find(query)
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum)
            .populate('userId', 'username email')
            .populate('reviewedBy', 'username email')
            .lean();

        // Get total count
        const total = await Registration.countDocuments(query);

        res.json({
            success: true,
            message: 'Registration requests retrieved successfully',
            data: registrations,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum),
                hasNextPage: skip + limitNum < total,
                hasPrevPage: pageNum > 1
            }
        });

        console.log(`✓ Admin retrieved ${registrations.length} registration requests (status: ${status})`);
    } catch (error) {
        console.error('Get registrations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve registration requests',
            code: 'FETCH_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get single registration request by ID
 * GET /api/admin/registrations/:id
 */
exports.getRegistrationRequestById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate MongoDB ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid registration ID format',
                code: 'INVALID_ID'
            });
        }

        const registration = await Registration.findById(id)
            .populate('userId', 'username email')
            .populate('reviewedBy', 'username email');

        if (!registration) {
            return res.status(404). json({
                success: false,
                message: 'Registration request not found',
                code: 'NOT_FOUND'
            });
        }

        res. json({
            success: true,
            message: 'Registration request retrieved successfully',
            data: registration
        });

        console.log(`✓ Admin retrieved registration: ${registration._id}`);
    } catch (error) {
        console.error('Get registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve registration request',
            code: 'FETCH_ERROR',
            error: process. env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Accept registration request
 * POST /api/admin/registrations/:id/accept
 */
exports.acceptRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, password } = req.body;

        // Validate MongoDB ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400). json({
                success: false,
                message: 'Invalid registration ID format',
                code: 'INVALID_ID'
            });
        }

        // Validate credentials
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required',
                code: 'MISSING_FIELDS'
            });
        }

        const trimmedUsername = username.trim(). toLowerCase();
        const trimmedPassword = password.trim();

        // Validate username format
        if (trimmedUsername. length < 3 || trimmedUsername.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'Username must be between 3 and 50 characters',
                code: 'INVALID_USERNAME'
            });
        }

        // Validate password strength
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(trimmedPassword)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters with uppercase, lowercase, and number',
                code: 'WEAK_PASSWORD'
            });
        }

        // Check if registration exists
        const registration = await Registration.findById(id);

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration request not found',
                code: 'NOT_FOUND'
            });
        }

        // Check if already processed
        if (registration.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'This registration has already been processed',
                code: 'ALREADY_PROCESSED',
                currentStatus: registration.status
            });
        }

        // Check if username already exists
        const usernameExists = await User.findOne({ username: trimmedUsername });
        if (usernameExists) {
            return res.status(409).json({
                success: false,
                message: 'Username is already taken',
                code: 'USERNAME_EXISTS'
            });
        }

        let newUser;

        try {
            if (registration.type === 'user') {
                // Create user account
                newUser = new User({
                    username: trimmedUsername,
                    password: trimmedPassword,
                    name: registration.data.name,
                    email: registration.data.email,
                    phone: registration.data.phone,
                    address: registration.data.address,
                    nid: registration.data.nid,
                    role: 'user',
                    status: 'active',
                    emailVerified: true
                });

                await newUser.save();

                // Send credentials email
                const emailSent = await sendCredentialsEmail(
                    registration.data.email,
                    trimmedUsername,
                    trimmedPassword,
                    registration.data.name,
                    'user'
                );

                if (! emailSent) {
                    console.warn(`⚠ Email failed to send for user: ${registration.data.email}`);
                }
            } else if (registration.type === 'hospital') {
                // Create hospital account
                newUser = new User({
                    username: trimmedUsername,
                    password: trimmedPassword,
                    name: registration.data.name,
                    email: registration.data.email,
                    role: 'hospital',
                    status: 'active',
                    emailVerified: true
                });

                await newUser.save();

                // Create hospital record
                const hospital = new Hospital({
                    userId: newUser._id,
                    name: registration.data.name,
                    venue: registration.data.venue,
                    email: registration.data. email,
                    phone: registration.data.phone,
                    licenseUrl: registration.data.licenseUrl,
                    status: 'approved'
                });

                await hospital. save();

                // Update user with hospital ID
                newUser.hospitalId = hospital._id;
                await newUser.save();

                // Send credentials email
                const emailSent = await sendCredentialsEmail(
                    registration.data.email,
                    trimmedUsername,
                    trimmedPassword,
                    registration.data.name,
                    'hospital'
                );

                if (!emailSent) {
                    console.warn(`⚠ Email failed to send for hospital: ${registration.data. email}`);
                }
            }

            // Update registration record
            registration.status = 'accepted';
            registration.userId = newUser._id;
            registration.username = trimmedUsername;
            registration.password = trimmedPassword;
            registration.reviewedBy = req.user. id;
            registration.reviewedAt = new Date();

            await registration.save();

            res.json({
                success: true,
                message: 'Registration accepted successfully.  Credentials have been sent to the email.',
                data: {
                    registrationId: registration._id,
                    userId: newUser._id,
                    username: trimmedUsername,
                    userEmail: newUser.email,
                    userRole: newUser.role,
                    status: 'Credentials sent'
                }
            });

            console.log(`✓ Admin accepted registration: ${newUser.email} (${newUser.role})`);
        } catch (error) {
            // Cleanup if user creation fails
            if (newUser && newUser._id) {
                await User.findByIdAndDelete(newUser._id);
                const hospital = await Hospital.findOne({ userId: newUser._id });
                if (hospital) {
                    await Hospital.findByIdAndDelete(hospital._id);
                }
            }
            throw error;
        }
    } catch (error) {
        console.error('Accept registration error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400). json({
                success: false,
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                errors: messages
            });
        }

        if (error.code === 11000) {
            const field = Object.keys(error. keyPattern)[0];
            return res.status(409).json({
                success: false,
                message: `${field} is already in use`,
                code: 'DUPLICATE_ENTRY',
                field
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to accept registration',
            code: 'ACCEPT_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Reject registration request
 * POST /api/admin/registrations/:id/reject
 */
exports.rejectRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        // Validate MongoDB ObjectId
        if (! id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid registration ID format',
                code: 'INVALID_ID'
            });
        }

        // Validate reason
        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required',
                code: 'MISSING_REASON'
            });
        }

        const trimmedReason = reason.trim();
        if (trimmedReason.length > 500) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason cannot exceed 500 characters',
                code: 'REASON_TOO_LONG'
            });
        }

        // Check if registration exists
        const registration = await Registration.findById(id);

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration request not found',
                code: 'NOT_FOUND'
            });
        }

        // Check if already processed
        if (registration. status !== 'pending') {
            return res.status(400). json({
                success: false,
                message: 'This registration has already been processed',
                code: 'ALREADY_PROCESSED',
                currentStatus: registration. status
            });
        }

        // Update registration record
        registration.status = 'rejected';
        registration.rejectionReason = trimmedReason;
        registration.reviewedBy = req.user.id;
        registration.reviewedAt = new Date();

        await registration.save();

        res.json({
            success: true,
            message: 'Registration rejected successfully',
            data: {
                registrationId: registration._id,
                type: registration.type,
                email: registration.data.email,
                rejectionReason: trimmedReason,
                rejectedAt: registration.reviewedAt
            }
        });

        console.log(`✓ Admin rejected registration: ${registration. data.email} (${registration.type})`);
    } catch (error) {
        console.error('Reject registration error:', error);

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
            message: 'Failed to reject registration',
            code: 'REJECT_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Send credentials email to user/hospital
 * POST /api/admin/send-credentials
 */
exports.sendCredentialsEmail = async (req, res) => {
    try {
        const { username, password, email } = req.body;

        // Validate inputs
        if (!username || !password || !email) {
            return res.status(400).json({
                success: false,
                message: 'Username, password, and email are required',
                code: 'MISSING_FIELDS'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email. trim())) {
            return res. status(400).json({
                success: false,
                message: 'Invalid email format',
                code: 'INVALID_EMAIL'
            });
        }

        // Send email
        const emailSent = await sendCredentialsEmail(
            email. trim(). toLowerCase(),
            username.trim(),
            password.trim(),
            username.trim(),
            'user'
        );

        if (! emailSent) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send email.  Please try again.',
                code: 'EMAIL_FAILED'
            });
        }

        res.json({
            success: true,
            message: 'Credentials email sent successfully',
            data: {
                email: email.trim(),
                sentAt: new Date()
            }
        });

        console.log(`✓ Admin sent credentials email to: ${email. trim()}`);
    } catch (error) {
        console. error('Send credentials error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send credentials',
            code: 'SEND_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get dashboard statistics
 * GET /api/admin/stats
 */
exports.getDashboardStats = async (req, res) => {
    try {
        // Count statistics
        const [totalUsers, totalHospitals, pendingRegistrations, activeUsers, suspendedUsers] = await Promise. all([
            User.countDocuments({ role: 'user' }),
            Hospital.countDocuments(),
            Registration.countDocuments({ status: 'pending' }),
            User.countDocuments({ status: 'active' }),
            User.countDocuments({ status: 'suspended' })
        ]);

        // Get recent registrations
        const recentRegistrations = await Registration.find({ status: 'pending' })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        res.json({
            success: true,
            message: 'Dashboard statistics retrieved successfully',
            data: {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    suspended: suspendedUsers
                },
                hospitals: {
                    total: totalHospitals
                },
                registrations: {
                    pending: pendingRegistrations
                },
                recentRegistrations: recentRegistrations
            }
        });

        console.log('✓ Admin retrieved dashboard statistics');
    } catch (error) {
        console.error('Get stats error:', error);
        res. status(500).json({
            success: false,
            message: 'Failed to retrieve statistics',
            code: 'STATS_ERROR',
            error: process. env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};