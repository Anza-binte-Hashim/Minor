/**
 * Role-Based Access Control (RBAC) Middleware
 * Handles authorization and permission checking
 * ACCURATE & PRODUCTION-READY WITH COMPREHENSIVE SECURITY
 */

/**
 * Define roles and their permissions
 * Centralized permission management
 */
const rolesAndPermissions = {
    admin: {
        name: 'Administrator',
        permissions: [
            'view_users',
            'edit_users',
            'delete_users',
            'view_hospitals',
            'edit_hospitals',
            'delete_hospitals',
            'manage_registrations',
            'send_emails',
            'view_all_data',
            'manage_admins',
            'view_analytics'
        ]
    },
    hospital: {
        name: 'Hospital Manager',
        permissions: [
            'manage_doctors',
            'manage_departments',
            'edit_hospital_info',
            'view_hospital_data',
            'manage_schedules',
            'view_appointments',
            'manage_appointments'
        ]
    },
    user: {
        name: 'Patient/User',
        permissions: [
            'view_doctors',
            'book_appointment',
            'edit_profile',
            'view_own_appointments',
            'send_messages',
            'view_hospitals'
        ]
    }
};

/**
 * Check if user has required role(s)
 * @param {... string} allowedRoles - One or more allowed roles
 * @returns {Function} Express middleware function
 */
const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            // Check if user is authenticated
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required.  Please login.',
                    code: 'UNAUTHORIZED'
                });
            }

            // Check if user has valid role
            if (!req.user.role) {
                return res.status(403).json({
                    success: false,
                    message: 'User role not assigned',
                    code: 'INVALID_ROLE'
                });
            }

            // Check if user's role is in allowed roles
            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: `Access forbidden. Required role(s): ${allowedRoles. join(' or ')}`,
                    code: 'FORBIDDEN',
                    requiredRoles: allowedRoles,
                    userRole: req. user.role
                });
            }

            // Log successful role check
            console.log(`✓ Role check passed for user ${req.user.id} (${req.user.role})`);
            
            next();
        } catch (error) {
            console.error('Role check error:', error);
            return res. status(500).json({
                success: false,
                message: 'Authorization check failed',
                code: 'AUTH_ERROR',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    };
};

/**
 * Check if user has specific permission
 * @param {string} requiredPermission - Permission to check
 * @returns {Function} Express middleware function
 */
const checkPermission = (requiredPermission) => {
    return (req, res, next) => {
        try {
            // Check if user is authenticated
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required. Please login.',
                    code: 'UNAUTHORIZED'
                });
            }

            // Check if user has valid role
            const userRole = req.user.role;
            const roleConfig = rolesAndPermissions[userRole];

            if (!roleConfig) {
                return res.status(403). json({
                    success: false,
                    message: 'User role is not configured',
                    code: 'INVALID_ROLE'
                });
            }

            // Check if user has required permission
            if (!roleConfig.permissions.includes(requiredPermission)) {
                return res.status(403).json({
                    success: false,
                    message: `Permission denied. Required: ${requiredPermission}`,
                    code: 'FORBIDDEN',
                    requiredPermission: requiredPermission,
                    userRole: userRole,
                    userPermissions: roleConfig.permissions
                });
            }

            // Log successful permission check
            console.log(`✓ Permission check passed for user ${req.user.id} (${requiredPermission})`);
            
            next();
        } catch (error) {
            console. error('Permission check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Permission check failed',
                code: 'PERMISSION_ERROR',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    };
};

/**
 * Check if user is the resource owner or admin
 * @param {string|Function} resourceOwnerId - Owner ID or function that returns owner ID
 * @returns {Function} Express middleware function
 */
const checkOwnerOrAdmin = (resourceOwnerId) => {
    return (req, res, next) => {
        try {
            // Check if user is authenticated
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required.  Please login.',
                    code: 'UNAUTHORIZED'
                });
            }

            // If user is admin, allow access
            if (req.user. role === 'admin') {
                console.log(`✓ Admin access granted to user ${req.user.id}`);
                return next();
            }

            // Get the actual owner ID
            let ownerId = resourceOwnerId;
            if (typeof resourceOwnerId === 'function') {
                ownerId = resourceOwnerId(req);
            }

            // Check if user is the owner
            if (req.user.id !== ownerId) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to access this resource',
                    code: 'FORBIDDEN',
                    reason: 'Not resource owner'
                });
            }

            console.log(`✓ Owner access granted to user ${req.user.id}`);
            next();
        } catch (error) {
            console.error('Owner check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Ownership check failed',
                code: 'OWNERSHIP_ERROR',
                error: process.env.NODE_ENV === 'development' ?  error.message : undefined
            });
        }
    };
};

/**
 * Check if user belongs to a specific hospital
 * @param {string|Function} hospitalId - Hospital ID or function that returns hospital ID
 * @returns {Function} Express middleware function
 */
const checkHospitalAccess = (hospitalId) => {
    return (req, res, next) => {
        try {
            // Check if user is authenticated
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required. Please login.',
                    code: 'UNAUTHORIZED'
                });
            }

            // Admin has access to all hospitals
            if (req.user.role === 'admin') {
                console.log(`✓ Admin hospital access granted to user ${req.user.id}`);
                return next();
            }

            // Only hospital role can have hospital-specific access
            if (req. user.role !== 'hospital') {
                return res.status(403).json({
                    success: false,
                    message: 'Only hospital administrators can access this resource',
                    code: 'FORBIDDEN',
                    userRole: req.user.role
                });
            }

            // Get the actual hospital ID
            let targetHospitalId = hospitalId;
            if (typeof hospitalId === 'function') {
                targetHospitalId = hospitalId(req);
            }

            // Convert to string for comparison
            const userHospitalId = req.user.hospitalId ?  req.user.hospitalId. toString() : null;
            const targetId = targetHospitalId ? targetHospitalId.toString() : null;

            // Check if user's hospital matches the target hospital
            if (userHospitalId !== targetId) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have access to this hospital',
                    code: 'FORBIDDEN',
                    reason: 'Hospital mismatch'
                });
            }

            console.log(`✓ Hospital access granted to user ${req.user.id} for hospital ${targetId}`);
            next();
        } catch (error) {
            console.error('Hospital access check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Hospital access check failed',
                code: 'HOSPITAL_ERROR',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    };
};

/**
 * Get all roles and their permissions
 * @returns {Object} Roles and permissions configuration
 */
const getRolesAndPermissions = () => {
    return rolesAndPermissions;
};

/**
 * Get permissions for a specific role
 * @param {string} role - Role name
 * @returns {Array|null} Array of permissions or null if role doesn't exist
 */
const getPermissionsForRole = (role) => {
    return rolesAndPermissions[role]?.permissions || null;
};

/**
 * Check if a role has a specific permission
 * @param {string} role - Role name
 * @param {string} permission - Permission name
 * @returns {boolean} True if role has permission
 */
const hasPermission = (role, permission) => {
    const roleConfig = rolesAndPermissions[role];
    return roleConfig && roleConfig.permissions.includes(permission);
};

module.exports = {
    checkRole,
    checkPermission,
    checkOwnerOrAdmin,
    checkHospitalAccess,
    getRolesAndPermissions,
    getPermissionsForRole,
    hasPermission,
    rolesAndPermissions
};