/**
 * Hospital Controller - COMPLETE & ACCURATE
 * Handles hospital-specific operations (doctors, departments, hospital info)
 * PRODUCTION-READY WITH COMPREHENSIVE ERROR HANDLING
 */

const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const Department = require('../models/Department');
const User = require('../models/User');

// ============ DOCTOR MANAGEMENT ============

/**
 * Get hospital doctors with filtering and pagination
 * GET /api/hospitals/:hospitalId/doctors
 */
exports.getDoctors = async (req, res) => {
    try {
        const { hospitalId } = req.params;
        const { status, department, search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = -1 } = req.query;

        // Validate hospital ID format
        if (!hospitalId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid hospital ID format',
                code: 'INVALID_HOSPITAL_ID'
            });
        }

        // Verify hospital exists
        const hospitalExists = await Hospital.exists({ _id: hospitalId });
        if (!hospitalExists) {
            return res.status(404). json({
                success: false,
                message: 'Hospital not found',
                code: 'HOSPITAL_NOT_FOUND'
            });
        }

        // Build query filter
        let query = { hospitalId };

        // Status filter (available, busy, unavailable)
        if (status && ['available', 'busy', 'unavailable'].includes(status)) {
            query.status = status;
        }

        // Department filter
        if (department && department.trim()) {
            query.department = new RegExp(department.trim(), 'i');
        }

        // Search filter
        if (search && search.trim()) {
            const searchRegex = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.$or = [
                { name: { $regex: searchRegex, $options: 'i' } },
                { email: { $regex: searchRegex, $options: 'i' } },
                { specialization: { $regex: searchRegex, $options: 'i' } }
            ];
        }

        // Validate and process pagination
        const pageNum = Math. max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
        const skip = (pageNum - 1) * limitNum;

        // Build sort object
        const sortObj = {};
        const validSortFields = ['createdAt', 'name', 'status', 'department'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
        sortObj[sortField] = parseInt(sortOrder) === 1 ? 1 : -1;

        // Execute query
        const doctors = await Doctor.find(query)
            .select('-__v')
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Get total count
        const total = await Doctor.countDocuments(query);

        res.json({
            success: true,
            message: 'Doctors retrieved successfully',
            data: doctors,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum),
                hasNextPage: skip + limitNum < total,
                hasPrevPage: pageNum > 1
            }
        });

        console.log(`✓ Retrieved ${doctors.length} doctors for hospital ${hospitalId} (status: ${status || 'all'})`);
    } catch (error) {
        console.error('Get doctors error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve doctors',
            code: 'FETCH_ERROR',
            error: process.env.NODE_ENV === 'development' ? error. message : undefined
        });
    }
};

/**
 * Get single doctor by ID
 * GET /api/hospitals/:hospitalId/doctors/:doctorId
 */
exports.getDoctorById = async (req, res) => {
    try {
        const { hospitalId, doctorId } = req.params;

        // Validate ID formats
        if (!hospitalId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid hospital ID format',
                code: 'INVALID_HOSPITAL_ID'
            });
        }

        if (!doctorId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid doctor ID format',
                code: 'INVALID_DOCTOR_ID'
            });
        }

        // Find doctor
        const doctor = await Doctor.findOne({
            _id: doctorId,
            hospitalId
        });

        if (!doctor) {
            return res.status(404). json({
                success: false,
                message: 'Doctor not found',
                code: 'NOT_FOUND'
            });
        }

        res.json({
            success: true,
            message: 'Doctor retrieved successfully',
            data: doctor
        });

        console.log(`✓ Retrieved doctor: ${doctor.name}`);
    } catch (error) {
        console.error('Get doctor error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve doctor',
            code: 'FETCH_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Add new doctor
 * POST /api/hospitals/:hospitalId/doctors
 */
exports.addDoctor = async (req, res) => {
    try {
        const { hospitalId } = req.params;
        const { name, email, phone, department, gender, specialization, experience, consultationFee } = req.body;

        // Validate hospital ID format
        if (!hospitalId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid hospital ID format',
                code: 'INVALID_HOSPITAL_ID'
            });
        }

        // Verify hospital exists
        const hospital = await Hospital.findById(hospitalId);
        if (! hospital) {
            return res. status(404).json({
                success: false,
                message: 'Hospital not found',
                code: 'HOSPITAL_NOT_FOUND'
            });
        }

        // Validate required fields
        if (!name || ! email || !phone || !department || !gender) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be provided',
                code: 'MISSING_FIELDS',
                requiredFields: ['name', 'email', 'phone', 'department', 'gender']
            });
        }

        // Validate and sanitize name
        const trimmedName = name.trim();
        if (trimmedName.length < 2 || trimmedName.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Name must be between 2 and 100 characters',
                code: 'INVALID_NAME'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const trimmedEmail = email.trim(). toLowerCase();
        if (!emailRegex.test(trimmedEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format',
                code: 'INVALID_EMAIL'
            });
        }

        // Validate phone
        const phoneRegex = /^[\d\-\+\(\)\s]+$/;
        const phoneDigits = phone.replace(/\D/g, '');
        if (!phoneRegex. test(phone) || phoneDigits.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number (minimum 10 digits required)',
                code: 'INVALID_PHONE'
            });
        }

        // Validate department
        const trimmedDepartment = department.trim();
        if (trimmedDepartment.length < 2 || trimmedDepartment. length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Department must be between 2 and 100 characters',
                code: 'INVALID_DEPARTMENT'
            });
        }

        // Validate gender
        if (!['Male', 'Female']. includes(gender)) {
            return res.status(400).json({
                success: false,
                message: 'Gender must be Male or Female',
                code: 'INVALID_GENDER'
            });
        }

        // Check if doctor email already exists in this hospital
        const existingDoctor = await Doctor.findOne({
            hospitalId,
            email: trimmedEmail
        });

        if (existingDoctor) {
            return res.status(409). json({
                success: false,
                message: 'Doctor with this email already exists in this hospital',
                code: 'DOCTOR_EMAIL_EXISTS'
            });
        }

        // Create doctor object
        const doctorData = {
            hospitalId,
            name: trimmedName,
            email: trimmedEmail,
            phone: phone. trim(),
            department: trimmedDepartment,
            gender,
            status: 'available',
            specialization: specialization ?  specialization.trim() : '',
            experience: experience ? Math.max(0, Math.min(70, parseInt(experience) || 0)) : 0,
            consultationFee: consultationFee ? Math.max(0, parseFloat(consultationFee)) : 0
        };

        // Create and save doctor
        const doctor = new Doctor(doctorData);
        await doctor.save();

        // Update hospital's doctor count
        hospital.totalDoctors = await Doctor.countDocuments({ hospitalId });
        hospital.doctors.push(doctor._id);
        await hospital.save();

        res.status(201).json({
            success: true,
            message: 'Doctor added successfully',
            data: doctor
        });

        console.log(`✓ Added doctor: ${doctor.name} to hospital ${hospital.name}`);
    } catch (error) {
        console.error('Add doctor error:', error);

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
                message: `${field} already exists`,
                code: 'DUPLICATE_ENTRY',
                field
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to add doctor',
            code: 'ADD_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Update doctor information
 * PUT /api/hospitals/:hospitalId/doctors/:doctorId
 */
exports.updateDoctor = async (req, res) => {
    try {
        const { hospitalId, doctorId } = req.params;
        const updateFields = req.body;

        // Validate ID formats
        if (!hospitalId. match(/^[0-9a-fA-F]{24}$/)) {
            return res. status(400).json({
                success: false,
                message: 'Invalid hospital ID format',
                code: 'INVALID_HOSPITAL_ID'
            });
        }

        if (!doctorId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid doctor ID format',
                code: 'INVALID_DOCTOR_ID'
            });
        }

        // Find doctor
        const doctor = await Doctor.findOne({
            _id: doctorId,
            hospitalId
        });

        if (! doctor) {
            return res. status(404).json({
                success: false,
                message: 'Doctor not found',
                code: 'NOT_FOUND'
            });
        }

        // Build update object with validation
        const updateData = {};

        if (updateFields.name !== undefined) {
            const trimmedName = updateFields.name.trim();
            if (trimmedName.length < 2 || trimmedName.length > 100) {
                return res. status(400).json({
                    success: false,
                    message: 'Name must be between 2 and 100 characters',
                    code: 'INVALID_NAME'
                });
            }
            updateData. name = trimmedName;
        }

        if (updateFields. email !== undefined) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const trimmedEmail = updateFields.email.trim().toLowerCase();
            if (!emailRegex. test(trimmedEmail)) {
                return res.status(400). json({
                    success: false,
                    message: 'Invalid email format',
                    code: 'INVALID_EMAIL'
                });
            }

            // Check if email is already in use by another doctor
            const emailExists = await Doctor.findOne({
                hospitalId,
                email: trimmedEmail,
                _id: { $ne: doctorId }
            });

            if (emailExists) {
                return res.status(409).json({
                    success: false,
                    message: 'Email is already in use by another doctor',
                    code: 'EMAIL_EXISTS'
                });
            }

            updateData.email = trimmedEmail;
        }

        if (updateFields.phone !== undefined) {
            const phoneRegex = /^[\d\-\+\(\)\s]+$/;
            const phoneDigits = updateFields.phone.replace(/\D/g, '');
            if (! phoneRegex.test(updateFields.phone) || phoneDigits.length < 10) {
                return res.status(400). json({
                    success: false,
                    message: 'Invalid phone number (minimum 10 digits required)',
                    code: 'INVALID_PHONE'
                });
            }
            updateData.phone = updateFields.phone. trim();
        }

        if (updateFields.department !== undefined) {
            const trimmedDept = updateFields.department.trim();
            if (trimmedDept.length < 2 || trimmedDept.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Department must be between 2 and 100 characters',
                    code: 'INVALID_DEPARTMENT'
                });
            }
            updateData. department = trimmedDept;
        }

        if (updateFields.gender !== undefined) {
            if (!['Male', 'Female'].includes(updateFields.gender)) {
                return res.status(400).json({
                    success: false,
                    message: 'Gender must be Male or Female',
                    code: 'INVALID_GENDER'
                });
            }
            updateData.gender = updateFields.gender;
        }

        if (updateFields.specialization !== undefined) {
            updateData.specialization = updateFields. specialization. trim();
        }

        if (updateFields.experience !== undefined) {
            const exp = parseInt(updateFields.experience) || 0;
            if (exp < 0 || exp > 70) {
                return res.status(400). json({
                    success: false,
                    message: 'Experience must be between 0 and 70 years',
                    code: 'INVALID_EXPERIENCE'
                });
            }
            updateData.experience = exp;
        }

        if (updateFields.consultationFee !== undefined) {
            const fee = parseFloat(updateFields.consultationFee) || 0;
            if (fee < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Consultation fee cannot be negative',
                    code: 'INVALID_FEE'
                });
            }
            updateData.consultationFee = fee;
        }

        if (updateFields.bio !== undefined) {
            const trimmedBio = updateFields. bio.trim();
            if (trimmedBio.length > 500) {
                return res.status(400).json({
                    success: false,
                    message: 'Bio cannot exceed 500 characters',
                    code: 'BIO_TOO_LONG'
                });
            }
            updateData.bio = trimmedBio;
        }

        if (updateFields.qualifications !== undefined) {
            if (Array.isArray(updateFields.qualifications)) {
                updateData. qualifications = updateFields.qualifications.filter(q => q && q.trim()). slice(0, 10);
            }
        }

        updateData.updatedAt = new Date();

        // Update doctor
        const updatedDoctor = await Doctor.findByIdAndUpdate(
            doctorId,
            updateData,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Doctor updated successfully',
            data: updatedDoctor
        });

        console.log(`✓ Updated doctor: ${updatedDoctor.name}`);
    } catch (error) {
        console.error('Update doctor error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors). map(e => e.message);
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
                message: `${field} already exists`,
                code: 'DUPLICATE_ENTRY',
                field
            });
        }

        res. status(500).json({
            success: false,
            message: 'Failed to update doctor',
            code: 'UPDATE_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Delete doctor
 * DELETE /api/hospitals/:hospitalId/doctors/:doctorId
 */
exports.deleteDoctor = async (req, res) => {
    try {
        const { hospitalId, doctorId } = req.params;

        // Validate ID formats
        if (!hospitalId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid hospital ID format',
                code: 'INVALID_HOSPITAL_ID'
            });
        }

        if (!doctorId. match(/^[0-9a-fA-F]{24}$/)) {
            return res. status(400).json({
                success: false,
                message: 'Invalid doctor ID format',
                code: 'INVALID_DOCTOR_ID'
            });
        }

        // Find and delete doctor
        const doctor = await Doctor.findOneAndDelete({
            _id: doctorId,
            hospitalId
        });

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found',
                code: 'NOT_FOUND'
            });
        }

        // Update hospital's doctor count and remove from doctors array
        const hospital = await Hospital.findById(hospitalId);
        if (hospital) {
            hospital.doctors = hospital.doctors.filter(id => id. toString() !== doctorId);
            hospital.totalDoctors = await Doctor.countDocuments({ hospitalId });
            await hospital.save();
        }

        res.json({
            success: true,
            message: 'Doctor deleted successfully',
            deletedDoctor: {
                id: doctor._id,
                name: doctor.name,
                email: doctor.email
            }
        });

        console.log(`✓ Deleted doctor: ${doctor.name}`);
    } catch (error) {
        console.error('Delete doctor error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete doctor',
            code: 'DELETE_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Update doctor status (available, busy, unavailable)
 * PUT /api/hospitals/:hospitalId/doctors/:doctorId/status
 */
exports.updateDoctorStatus = async (req, res) => {
    try {
        const { hospitalId, doctorId } = req.params;
        const { status } = req.body;

        // Validate ID formats
        if (!hospitalId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid hospital ID format',
                code: 'INVALID_HOSPITAL_ID'
            });
        }

        if (!doctorId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid doctor ID format',
                code: 'INVALID_DOCTOR_ID'
            });
        }

        // Validate status
        if (!status || !['available', 'busy', 'unavailable'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status.  Must be: available, busy, or unavailable',
                code: 'INVALID_STATUS',
                validStatuses: ['available', 'busy', 'unavailable']
            });
        }

        // Update doctor status
        const doctor = await Doctor.findOneAndUpdate(
            { _id: doctorId, hospitalId },
            { status, updatedAt: new Date() },
            { new: true }
        );

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found',
                code: 'NOT_FOUND'
            });
        }

        res.json({
            success: true,
            message: 'Doctor status updated successfully',
            data: {
                doctorId: doctor._id,
                name: doctor.name,
                status: doctor.status,
                updatedAt: doctor.updatedAt
            }
        });

        console.log(`✓ Updated doctor ${doctor.name} status to: ${status}`);
    } catch (error) {
        console.error('Update doctor status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update doctor status',
            code: 'UPDATE_ERROR',
            error: process.env.NODE_ENV === 'development' ? error. message : undefined
        });
    }
};

// ============ DEPARTMENT MANAGEMENT ============

/**
 * Get hospital departments
 * GET /api/hospitals/:hospitalId/departments
 */
exports.getDepartments = async (req, res) => {
    try {
        const { hospitalId } = req.params;
        const { search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = -1 } = req.query;

        // Validate hospital ID format
        if (!hospitalId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid hospital ID format',
                code: 'INVALID_HOSPITAL_ID'
            });
        }

        // Verify hospital exists
        const hospitalExists = await Hospital.exists({ _id: hospitalId });
        if (!hospitalExists) {
            return res.status(404).json({
                success: false,
                message: 'Hospital not found',
                code: 'HOSPITAL_NOT_FOUND'
            });
        }

        // Build query
        let query = { hospitalId };

        if (search && search.trim()) {
            const searchRegex = search.trim(). replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.name = { $regex: searchRegex, $options: 'i' };
        }

        // Validate pagination
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
        const skip = (pageNum - 1) * limitNum;

        // Build sort object
        const sortObj = {};
        const validSortFields = ['createdAt', 'name'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
        sortObj[sortField] = parseInt(sortOrder) === 1 ? 1 : -1;

        // Execute query
        const departments = await Department.find(query)
            .select('-__v')
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Get total count
        const total = await Department.countDocuments(query);

        // Enrich departments with doctor counts
        const departmentsWithStats = await Promise.all(
            departments.map(async (dept) => {
                const doctorCount = await Doctor.countDocuments({
                    hospitalId,
                    department: dept. name
                });
                return {
                    ...dept,
                    doctorCount
                };
            })
        );

        res.json({
            success: true,
            message: 'Departments retrieved successfully',
            data: departmentsWithStats,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum),
                hasNextPage: skip + limitNum < total,
                hasPrevPage: pageNum > 1
            }
        });

        console.log(`✓ Retrieved ${departments.length} departments for hospital ${hospitalId}`);
    } catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve departments',
            code: 'FETCH_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get single department by ID
 * GET /api/hospitals/:hospitalId/departments/:departmentId
 */
exports. getDepartmentById = async (req, res) => {
    try {
        const { hospitalId, departmentId } = req.params;

        // Validate ID formats
        if (!hospitalId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400). json({
                success: false,
                message: 'Invalid hospital ID format',
                code: 'INVALID_HOSPITAL_ID'
            });
        }

        if (!departmentId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid department ID format',
                code: 'INVALID_DEPARTMENT_ID'
            });
        }

        // Find department
        const department = await Department.findOne({
            _id: departmentId,
            hospitalId
        }). populate('doctors', 'name email specialization status');

        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found',
                code: 'NOT_FOUND'
            });
        }

        // Get doctor count
        const doctorCount = await Doctor.countDocuments({
            hospitalId,
            department: department.name
        });

        res.json({
            success: true,
            message: 'Department retrieved successfully',
            data: {
                ... department. toObject(),
                doctorCount
            }
        });

        console.log(`✓ Retrieved department: ${department.name}`);
    } catch (error) {
        console.error('Get department error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve department',
            code: 'FETCH_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Add new department
 * POST /api/hospitals/:hospitalId/departments
 */
exports.addDepartment = async (req, res) => {
    try {
        const { hospitalId } = req.params;
        const { name, description, headDoctor } = req.body;

        // Validate hospital ID format
        if (!hospitalId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid hospital ID format',
                code: 'INVALID_HOSPITAL_ID'
            });
        }

        // Verify hospital exists
        const hospital = await Hospital.findById(hospitalId);
        if (! hospital) {
            return res. status(404).json({
                success: false,
                message: 'Hospital not found',
                code: 'HOSPITAL_NOT_FOUND'
            });
        }

        // Validate required fields
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Department name is required',
                code: 'MISSING_NAME'
            });
        }

        // Validate and sanitize name
        const trimmedName = name.trim();
        if (trimmedName.length < 2 || trimmedName.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Department name must be between 2 and 100 characters',
                code: 'INVALID_NAME'
            });
        }

        // Check if department already exists
        const existingDept = await Department.findOne({
            hospitalId,
            name: trimmedName
        });

        if (existingDept) {
            return res.status(409).json({
                success: false,
                message: 'Department with this name already exists in this hospital',
                code: 'DEPARTMENT_EXISTS'
            });
        }

        // Validate description
        let trimmedDescription = '';
        if (description) {
            trimmedDescription = description.trim();
            if (trimmedDescription.length > 1000) {
                return res. status(400).json({
                    success: false,
                    message: 'Description cannot exceed 1000 characters',
                    code: 'DESCRIPTION_TOO_LONG'
                });
            }
        }

        // Validate head doctor if provided
        let validHeadDoctorId = null;
        if (headDoctor) {
            if (! headDoctor.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(400). json({
                    success: false,
                    message: 'Invalid head doctor ID format',
                    code: 'INVALID_HEAD_DOCTOR_ID'
                });
            }

            const doctorExists = await Doctor.exists({
                _id: headDoctor,
                hospitalId
            });

            if (! doctorExists) {
                return res.status(404).json({
                    success: false,
                    message: 'Head doctor not found in this hospital',
                    code: 'DOCTOR_NOT_FOUND'
                });
            }

            validHeadDoctorId = headDoctor;
        }

        // Create department
        const departmentData = {
            hospitalId,
            name: trimmedName,
            description: trimmedDescription,
            headDoctor: validHeadDoctorId,
            doctors: []
        };

        const department = new Department(departmentData);
        await department.save();

        // Update hospital's department count
        hospital.totalDepartments = await Department.countDocuments({ hospitalId });
        hospital.departments. push(department._id);
        await hospital.save();

        res.status(201).json({
            success: true,
            message: 'Department added successfully',
            data: department
        });

        console.log(`✓ Added department: ${department.name} to hospital ${hospital.name}`);
    } catch (error) {
        console. error('Add department error:', error);

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
            message: 'Failed to add department',
            code: 'ADD_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Update department
 * PUT /api/hospitals/:hospitalId/departments/:departmentId
 */
exports.updateDepartment = async (req, res) => {
    try {
        const { hospitalId, departmentId } = req.params;
        const { name, description, headDoctor } = req.body;

        // Validate ID formats
        if (!hospitalId. match(/^[0-9a-fA-F]{24}$/)) {
            return res. status(400).json({
                success: false,
                message: 'Invalid hospital ID format',
                code: 'INVALID_HOSPITAL_ID'
            });
        }

        if (!departmentId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid department ID format',
                code: 'INVALID_DEPARTMENT_ID'
            });
        }

        // Find department
        const department = await Department.findOne({
            _id: departmentId,
            hospitalId
        });

        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found',
                code: 'NOT_FOUND'
            });
        }

        // Build update object
        const updateData = {};

        if (name !== undefined) {
            const trimmedName = name.trim();
            if (trimmedName. length < 2 || trimmedName.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Department name must be between 2 and 100 characters',
                    code: 'INVALID_NAME'
                });
            }

            // Check if new name is already used by another department
            const nameExists = await Department.findOne({
                hospitalId,
                name: trimmedName,
                _id: { $ne: departmentId }
            });

            if (nameExists) {
                return res.status(409).json({
                    success: false,
                    message: 'Department with this name already exists in this hospital',
                    code: 'DEPARTMENT_EXISTS'
                });
            }

            updateData.name = trimmedName;
        }

        if (description !== undefined) {
            const trimmedDesc = description.trim();
            if (trimmedDesc.length > 1000) {
                return res.status(400).json({
                    success: false,
                    message: 'Description cannot exceed 1000 characters',
                    code: 'DESCRIPTION_TOO_LONG'
                });
            }
            updateData.description = trimmedDesc;
        }

        if (headDoctor !== undefined && headDoctor !== null) {
            if (!headDoctor.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid head doctor ID format',
                    code: 'INVALID_HEAD_DOCTOR_ID'
                });
            }

            const doctorExists = await Doctor. exists({
                _id: headDoctor,
                hospitalId
            });

            if (!doctorExists) {
                return res. status(404).json({
                    success: false,
                    message: 'Head doctor not found in this hospital',
                    code: 'DOCTOR_NOT_FOUND'
                });
            }

            updateData.headDoctor = headDoctor;
        } else if (headDoctor === null) {
            updateData.headDoctor = null;
        }

        updateData.updatedAt = new Date();

        // Update department
        const updatedDepartment = await Department.findByIdAndUpdate(
            departmentId,
            updateData,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Department updated successfully',
            data: updatedDepartment
        });

        console.log(`✓ Updated department: ${updatedDepartment.name}`);
    } catch (error) {
        console.error('Update department error:', error);

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
            message: 'Failed to update department',
            code: 'UPDATE_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Delete department
 * DELETE /api/hospitals/:hospitalId/departments/:departmentId
 */
exports.deleteDepartment = async (req, res) => {
    try {
        const { hospitalId, departmentId } = req.params;

        // Validate ID formats
        if (!hospitalId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid hospital ID format',
                code: 'INVALID_HOSPITAL_ID'
            });
        }

        if (! departmentId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400). json({
                success: false,
                message: 'Invalid department ID format',
                code: 'INVALID_DEPARTMENT_ID'
            });
        }

        // Find and delete department
        const department = await Department.findOneAndDelete({
            _id: departmentId,
            hospitalId
        });

        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found',
                code: 'NOT_FOUND'
            });
        }

        // Update hospital's department count and remove from departments array
        const hospital = await Hospital.findById(hospitalId);
        if (hospital) {
            hospital.departments = hospital.departments.filter(
                id => id. toString() !== departmentId
            );
            hospital.totalDepartments = await Department.countDocuments({ hospitalId });
            await hospital.save();
        }

        res.json({
            success: true,
            message: 'Department deleted successfully',
            deletedDepartment: {
                id: department._id,
                name: department.name
            }
        });

        console.log(`✓ Deleted department: ${department.name}`);
    } catch (error) {
        console.error('Delete department error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete department',
            code: 'DELETE_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ============ HOSPITAL INFORMATION ============

/**
 * Get hospital information
 * GET /api/hospitals/:hospitalId/info
 */
exports.getHospitalInfo = async (req, res) => {
    try {
        const { hospitalId } = req.params;

        // Validate hospital ID format
        if (!hospitalId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid hospital ID format',
                code: 'INVALID_HOSPITAL_ID'
            });
        }

        // Get hospital with populated user info
        const hospital = await Hospital. findById(hospitalId)
            .populate('userId', 'username email');

        if (!hospital) {
            return res.status(404). json({
                success: false,
                message: 'Hospital not found',
                code: 'NOT_FOUND'
            });
        }

        // Get statistics
        const doctorCount = await Doctor.countDocuments({ hospitalId });
        const departmentCount = await Department.countDocuments({ hospitalId });

        res.json({
            success: true,
            message: 'Hospital information retrieved successfully',
            data: {
                ... hospital.toObject(),
                doctorCount,
                departmentCount
            }
        });

        console.log(`✓ Retrieved hospital info: ${hospital.name}`);
    } catch (error) {
        console.error('Get hospital info error:', error);
        res. status(500).json({
            success: false,
            message: 'Failed to retrieve hospital information',
            code: 'FETCH_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Update hospital information
 * PUT /api/hospitals/:hospitalId/info
 */
exports.updateHospitalInfo = async (req, res) => {
    try {
        const { hospitalId } = req. params;
        const { name, venue, email, phone, description } = req.body;

        // Validate hospital ID format
        if (!hospitalId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid hospital ID format',
                code: 'INVALID_HOSPITAL_ID'
            });
        }

        // Find hospital
        const hospital = await Hospital.findById(hospitalId);
        if (! hospital) {
            return res. status(404).json({
                success: false,
                message: 'Hospital not found',
                code: 'NOT_FOUND'
            });
        }

        // Build update object
        const updateData = {};

        if (name !== undefined) {
            const trimmedName = name.trim();
            if (trimmedName. length < 3 || trimmedName.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Hospital name must be between 3 and 100 characters',
                    code: 'INVALID_NAME'
                });
            }
            updateData.name = trimmedName;
        }

        if (venue !== undefined) {
            const trimmedVenue = venue.trim();
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
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const trimmedEmail = email.trim(). toLowerCase();
            if (!emailRegex.test(trimmedEmail)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email format',
                    code: 'INVALID_EMAIL'
                });
            }

            // Check if email is already in use
            const emailExists = await Hospital.findOne({
                email: trimmedEmail,
                _id: { $ne: hospitalId }
            });

            if (emailExists) {
                return res.status(409).json({
                    success: false,
                    message: 'Email is already in use by another hospital',
                    code: 'EMAIL_EXISTS'
                });
            }

            updateData.email = trimmedEmail;
        }

        if (phone !== undefined) {
            const phoneRegex = /^[\d\-\+\(\)\s]+$/;
            const phoneDigits = phone.replace(/\D/g, '');
            if (!phoneRegex. test(phone) || phoneDigits.length < 10) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid phone number (minimum 10 digits required)',
                    code: 'INVALID_PHONE'
                });
            }
            updateData.phone = phone. trim();
        }

        if (description !== undefined) {
            const trimmedDesc = description.trim();
            if (trimmedDesc.length > 1000) {
                return res.status(400).json({
                    success: false,
                    message: 'Description cannot exceed 1000 characters',
                    code: 'DESCRIPTION_TOO_LONG'
                });
            }
            updateData.description = trimmedDesc;
        }

        updateData.updatedAt = new Date();

        // Update hospital
        const updatedHospital = await Hospital.findByIdAndUpdate(
            hospitalId,
            updateData,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Hospital information updated successfully',
            data: updatedHospital
        });

        console.log(`✓ Updated hospital: ${updatedHospital.name}`);
    } catch (error) {
        console.error('Update hospital info error:', error);

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
            return res.status(409).json({
                success: false,
                message: `${field} already exists`,
                code: 'DUPLICATE_ENTRY',
                field
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update hospital information',
            code: 'UPDATE_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};