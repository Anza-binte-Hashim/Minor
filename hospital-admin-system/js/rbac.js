/**
 * Role-Based Access Control (RBAC) System
 * Manages user roles, permissions, and access control
 */

class RBAC {
    constructor() {
        this. roles = {
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
                    'view_doctors',
                    'manage_doctors'
                ]
            },
            hospital: {
                name: 'Hospital Manager',
                permissions: [
                    'manage_doctors',
                    'manage_departments',
                    'edit_hospital_info',
                    'view_appointments',
                    'send_messages'
                ]
            },
            user: {
                name: 'Patient/User',
                permissions: [
                    'view_doctors',
                    'book_appointment',
                    'edit_profile',
                    'view_appointments',
                    'send_messages'
                ]
            }
        };

        this. currentUser = this.loadUser();
    }

    /**
     * Set user role and permissions
     * @param {Object} user - User object with id, username, role
     */
    setUser(user) {
        this. currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
    }

    /**
     * Load user from localStorage
     */
    loadUser() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON. parse(user) : null;
    }

    /**
     * Check if user has specific permission
     * @param {string} permission - Permission to check
     * @returns {boolean}
     */
    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        const role = this.roles[this.currentUser.role];
        if (! role) return false;
        
        return role.permissions.includes(permission);
    }

    /**
     * Check if user has specific role
     * @param {string} role - Role to check
     * @returns {boolean}
     */
    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }

    /**
     * Get user's permissions
     * @returns {Array} Array of permissions
     */
    getPermissions() {
        if (!this.currentUser) return [];
        
        const role = this.roles[this.currentUser. role];
        return role ? role.permissions : [];
    }

    /**
     * Get user's role name
     * @returns {string}
     */
    getRoleName() {
        if (! this.currentUser) return null;
        
        const role = this.roles[this.currentUser.role];
        return role ?  role.name : null;
    }

    /**
     * Clear user session
     */
    logout() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        this.currentUser = null;
    }

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return !!this.currentUser && !! localStorage.getItem('authToken');
    }
}

// Create global RBAC instance
const rbac = new RBAC();