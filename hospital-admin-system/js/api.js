/**
 * API Helper Class
 * Handles all API requests to backend with proper error handling and token management
 */

class APIHelper {
    constructor(baseURL = 'http://localhost:5000/api') {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('authToken') || null;
    }

    /**
     * Get authorization headers
     * @returns {Object} Headers object with Authorization
     */
    getHeaders(isFormData = false) {
        const headers = {
            ... (!isFormData && { 'Content-Type': 'application/json' })
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    /**
     * Set authentication token
     * @param {string} token - JWT token
     */
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage. setItem('authToken', token);
        }
    }

    /**
     * Clear authentication token
     */
    clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    /**
     * Make API request
     * @param {string} endpoint - API endpoint
     * @param {string} method - HTTP method
     * @param {Object} data - Request body data
     * @param {boolean} isFormData - Is form data request
     * @returns {Promise<Object>} Response data
     */
    async request(endpoint, method = 'GET', data = null, isFormData = false) {
        try {
            const options = {
                method,
                headers: this.getHeaders(isFormData)
            };

            if (data) {
                if (isFormData) {
                    options.body = data; // FormData object
                } else {
                    options.body = JSON.stringify(data);
                }
            }

            const response = await fetch(`${this.baseURL}${endpoint}`, options);

            // Handle unauthorized access
            if (response.status === 401) {
                this.clearToken();
                rbac.logout();
                window.location.href = '/index.html';
                throw new Error('Unauthorized - Please login again');
            }

            if (! response.ok) {
                const error = await response.json(). catch(() => ({}));
                throw new Error(error.message || `HTTP Error: ${response.status}`);
            }

            const responseData = await response.json();
            return responseData;
        } catch (error) {
            console.error(`API Error [${method} ${endpoint}]:`, error);
            throw error;
        }
    }

    // ============ AUTHENTICATION ENDPOINTS ============

    /**
     * User login
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Promise<Object>} User data and token
     */
    async login(username, password) {
        return this.request('/auth/login', 'POST', { username, password });
    }

    /**
     * Register new user
     * @param {Object} userData - User registration data
     * @returns {Promise<Object>} Registration response
     */
    async registerUser(userData) {
        return this.request('/auth/register-user', 'POST', userData);
    }

    /**
     * Register new hospital
     * @param {FormData} hospitalData - Hospital registration data with file
     * @returns {Promise<Object>} Registration response
     */
    async registerHospital(hospitalData) {
        return this. request('/auth/register-hospital', 'POST', hospitalData, true);
    }

    /**
     * Verify email
     * @param {string} token - Verification token
     * @returns {Promise<Object>} Verification response
     */
    async verifyEmail(token) {
        return this.request('/auth/verify-email', 'POST', { token });
    }

    /**
     * Request password reset
     * @param {string} email - User email
     * @returns {Promise<Object>} Reset request response
     */
    async requestPasswordReset(email) {
        return this.request('/auth/request-reset', 'POST', { email });
    }

    /**
     * Reset password
     * @param {string} token - Reset token
     * @param {string} newPassword - New password
     * @returns {Promise<Object>} Reset response
     */
    async resetPassword(token, newPassword) {
        return this.request('/auth/reset-password', 'POST', { token, newPassword });
    }

    // ============ ADMIN ENDPOINTS ============

    /**
     * Get all users
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} List of users
     */
    async getUsers(filters = {}) {
        const queryString = new URLSearchParams(filters). toString();
        return this.request(`/admin/users${queryString ?  '?' + queryString : ''}`, 'GET');
    }

    /**
     * Get user by ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} User data
     */
    async getUserById(userId) {
        return this.request(`/admin/users/${userId}`, 'GET');
    }

    /**
     * Update user
     * @param {string} userId - User ID
     * @param {Object} userData - Updated user data
     * @returns {Promise<Object>} Updated user
     */
    async updateUser(userId, userData) {
        return this.request(`/admin/users/${userId}`, 'PUT', userData);
    }

    /**
     * Delete user
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Deletion response
     */
    async deleteUser(userId) {
        return this.request(`/admin/users/${userId}`, 'DELETE');
    }

    /**
     * Get all hospitals
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} List of hospitals
     */
    async getHospitals(filters = {}) {
        const queryString = new URLSearchParams(filters).toString();
        return this. request(`/admin/hospitals${queryString ? '?' + queryString : ''}`, 'GET');
    }

    /**
     * Get hospital by ID
     * @param {string} hospitalId - Hospital ID
     * @returns {Promise<Object>} Hospital data
     */
    async getHospitalById(hospitalId) {
        return this.request(`/admin/hospitals/${hospitalId}`, 'GET');
    }

    /**
     * Update hospital
     * @param {string} hospitalId - Hospital ID
     * @param {Object} hospitalData - Updated hospital data
     * @returns {Promise<Object>} Updated hospital
     */
    async updateHospital(hospitalId, hospitalData) {
        return this.request(`/admin/hospitals/${hospitalId}`, 'PUT', hospitalData);
    }

    /**
     * Delete hospital
     * @param {string} hospitalId - Hospital ID
     * @returns {Promise<Object>} Deletion response
     */
    async deleteHospital(hospitalId) {
        return this. request(`/admin/hospitals/${hospitalId}`, 'DELETE');
    }

    /**
     * Get pending registration requests
     * @param {string} type - Registration type ('user' or 'hospital')
     * @returns {Promise<Array>} List of registration requests
     */
    async getRegistrationRequests(type = null) {
        const endpoint = type 
            ? `/admin/registrations? type=${type}` 
            : '/admin/registrations';
        return this. request(endpoint, 'GET');
    }

    /**
     * Get registration request by ID
     * @param {string} requestId - Registration request ID
     * @returns {Promise<Object>} Registration request details
     */
    async getRegistrationRequestById(requestId) {
        return this.request(`/admin/registrations/${requestId}`, 'GET');
    }

    /**
     * Accept registration request
     * @param {string} requestId - Registration request ID
     * @param {string} username - Generated username
     * @param {string} password - Generated password
     * @returns {Promise<Object>} Acceptance response
     */
    async acceptRegistration(requestId, username, password) {
        return this.request(
            `/admin/registrations/${requestId}/accept`,
            'POST',
            { username, password }
        );
    }

    /**
     * Reject registration request
     * @param {string} requestId - Registration request ID
     * @param {string} reason - Rejection reason
     * @returns {Promise<Object>} Rejection response
     */
    async rejectRegistration(requestId, reason) {
        return this. request(
            `/admin/registrations/${requestId}/reject`,
            'POST',
            { reason }
        );
    }

    /**
     * Send credentials email
     * @param {string} username - Username
     * @param {string} password - Password
     * @param {string} email - Recipient email
     * @returns {Promise<Object>} Email send response
     */
    async sendCredentialsEmail(username, password, email) {
        return this.request(
            '/admin/send-credentials',
            'POST',
            { username, password, email }
        );
    }

    /**
     * Get dashboard statistics
     * @returns {Promise<Object>} Dashboard stats
     */
    async getDashboardStats() {
        return this.request('/admin/stats', 'GET');
    }

    // ============ HOSPITAL ENDPOINTS ============

    /**
     * Get hospital's doctors
     * @param {string} hospitalId - Hospital ID
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} List of doctors
     */
    async getHospitalDoctors(hospitalId, filters = {}) {
        const queryString = new URLSearchParams(filters).toString();
        return this.request(
            `/hospitals/${hospitalId}/doctors${queryString ? '?' + queryString : ''}`,
            'GET'
        );
    }

    /**
     * Get doctor by ID
     * @param {string} hospitalId - Hospital ID
     * @param {string} doctorId - Doctor ID
     * @returns {Promise<Object>} Doctor data
     */
    async getDoctorById(hospitalId, doctorId) {
        return this.request(`/hospitals/${hospitalId}/doctors/${doctorId}`, 'GET');
    }

    /**
     * Add new doctor
     * @param {string} hospitalId - Hospital ID
     * @param {Object} doctorData - Doctor information
     * @returns {Promise<Object>} Created doctor
     */
    async addDoctor(hospitalId, doctorData) {
        return this. request(`/hospitals/${hospitalId}/doctors`, 'POST', doctorData);
    }

    /**
     * Update doctor
     * @param {string} hospitalId - Hospital ID
     * @param {string} doctorId - Doctor ID
     * @param {Object} doctorData - Updated doctor data
     * @returns {Promise<Object>} Updated doctor
     */
    async updateDoctor(hospitalId, doctorId, doctorData) {
        return this.request(
            `/hospitals/${hospitalId}/doctors/${doctorId}`,
            'PUT',
            doctorData
        );
    }

    /**
     * Delete doctor
     * @param {string} hospitalId - Hospital ID
     * @param {string} doctorId - Doctor ID
     * @returns {Promise<Object>} Deletion response
     */
    async deleteDoctor(hospitalId, doctorId) {
        return this.request(`/hospitals/${hospitalId}/doctors/${doctorId}`, 'DELETE');
    }

    /**
     * Update doctor status
     * @param {string} hospitalId - Hospital ID
     * @param {string} doctorId - Doctor ID
     * @param {string} status - Doctor status ('available', 'busy', 'unavailable')
     * @returns {Promise<Object>} Updated doctor
     */
    async updateDoctorStatus(hospitalId, doctorId, status) {
        return this.request(
            `/hospitals/${hospitalId}/doctors/${doctorId}/status`,
            'PUT',
            { status }
        );
    }

    /**
     * Get hospital's departments
     * @param {string} hospitalId - Hospital ID
     * @returns {Promise<Array>} List of departments
     */
    async getHospitalDepartments(hospitalId) {
        return this.request(`/hospitals/${hospitalId}/departments`, 'GET');
    }

    /**
     * Get department by ID
     * @param {string} hospitalId - Hospital ID
     * @param {string} departmentId - Department ID
     * @returns {Promise<Object>} Department data
     */
    async getDepartmentById(hospitalId, departmentId) {
        return this.request(
            `/hospitals/${hospitalId}/departments/${departmentId}`,
            'GET'
        );
    }

    /**
     * Add new department
     * @param {string} hospitalId - Hospital ID
     * @param {Object} departmentData - Department information
     * @returns {Promise<Object>} Created department
     */
    async addDepartment(hospitalId, departmentData) {
        return this.request(`/hospitals/${hospitalId}/departments`, 'POST', departmentData);
    }

    /**
     * Update department
     * @param {string} hospitalId - Hospital ID
     * @param {string} departmentId - Department ID
     * @param {Object} departmentData - Updated department data
     * @returns {Promise<Object>} Updated department
     */
    async updateDepartment(hospitalId, departmentId, departmentData) {
        return this.request(
            `/hospitals/${hospitalId}/departments/${departmentId}`,
            'PUT',
            departmentData
        );
    }

    /**
     * Delete department
     * @param {string} hospitalId - Hospital ID
     * @param {string} departmentId - Department ID
     * @returns {Promise<Object>} Deletion response
     */
    async deleteDepartment(hospitalId, departmentId) {
        return this.request(
            `/hospitals/${hospitalId}/departments/${departmentId}`,
            'DELETE'
        );
    }

    /**
     * Update hospital information
     * @param {string} hospitalId - Hospital ID
     * @param {Object} hospitalData - Hospital information
     * @returns {Promise<Object>} Updated hospital
     */
    async updateHospitalInfo(hospitalId, hospitalData) {
        return this.request(
            `/hospitals/${hospitalId}/info`,
            'PUT',
            hospitalData
        );
    }

    /**
     * Get hospital information
     * @param {string} hospitalId - Hospital ID
     * @returns {Promise<Object>} Hospital information
     */
    async getHospitalInfo(hospitalId) {
        return this.request(`/hospitals/${hospitalId}/info`, 'GET');
    }

    // ============ USER ENDPOINTS ============

    /**
     * Get user profile
     * @returns {Promise<Object>} User profile data
     */
    async getUserProfile() {
        return this. request('/users/profile', 'GET');
    }

    /**
     * Update user profile
     * @param {Object} userData - Updated user data
     * @returns {Promise<Object>} Updated user profile
     */
    async updateUserProfile(userData) {
        return this.request('/users/profile', 'PUT', userData);
    }

    /**
     * Get user's appointments
     * @returns {Promise<Array>} List of appointments
     */
    async getUserAppointments() {
        return this.request('/users/appointments', 'GET');
    }

    /**
     * Get appointment by ID
     * @param {string} appointmentId - Appointment ID
     * @returns {Promise<Object>} Appointment details
     */
    async getAppointmentById(appointmentId) {
        return this.request(`/users/appointments/${appointmentId}`, 'GET');
    }

    /**
     * Book appointment with doctor
     * @param {string} hospitalId - Hospital ID
     * @param {string} doctorId - Doctor ID
     * @param {Object} appointmentData - Appointment details
     * @returns {Promise<Object>} Created appointment
     */
    async bookAppointment(hospitalId, doctorId, appointmentData) {
        return this.request(
            `/users/appointments`,
            'POST',
            { ... appointmentData, hospitalId, doctorId }
        );
    }

    /**
     * Cancel appointment
     * @param {string} appointmentId - Appointment ID
     * @returns {Promise<Object>} Cancellation response
     */
    async cancelAppointment(appointmentId) {
        return this.request(`/users/appointments/${appointmentId}`, 'DELETE');
    }

    /**
     * Search hospitals
     * @param {Object} filters - Search filters
     * @returns {Promise<Array>} List of hospitals
     */
    async searchHospitals(filters = {}) {
        const queryString = new URLSearchParams(filters).toString();
        return this.request(`/users/hospitals${queryString ? '?' + queryString : ''}`, 'GET');
    }

    /**
     * Get hospital details for user
     * @param {string} hospitalId - Hospital ID
     * @returns {Promise<Object>} Hospital details
     */
    async getHospitalDetails(hospitalId) {
        return this.request(`/users/hospitals/${hospitalId}`, 'GET');
    }

    /**
     * Get available doctors in hospital
     * @param {string} hospitalId - Hospital ID
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} List of available doctors
     */
    async getAvailableDoctors(hospitalId, filters = {}) {
        const queryString = new URLSearchParams(filters).toString();
        return this.request(
            `/users/hospitals/${hospitalId}/doctors${queryString ? '?' + queryString : ''}`,
            'GET'
        );
    }

    // ============ MESSAGING ENDPOINTS ============

    /**
     * Get conversation with doctor
     * @param {string} doctorId - Doctor ID
     * @returns {Promise<Array>} List of messages
     */
    async getConversation(doctorId) {
        return this.request(`/messages/conversations/${doctorId}`, 'GET');
    }

    /**
     * Send message to doctor
     * @param {string} doctorId - Doctor ID
     * @param {string} message - Message content
     * @returns {Promise<Object>} Sent message
     */
    async sendMessage(doctorId, message) {
        return this.request(
            `/messages/send`,
            'POST',
            { recipientId: doctorId, message }
        );
    }

    /**
     * Get all conversations
     * @returns {Promise<Array>} List of conversations
     */
    async getConversations() {
        return this.request('/messages/conversations', 'GET');
    }

    /**
     * Mark conversation as read
     * @param {string} conversationId - Conversation ID
     * @returns {Promise<Object>} Update response
     */
    async markConversationAsRead(conversationId) {
        return this. request(
            `/messages/conversations/${conversationId}/read`,
            'PUT'
        );
    }
}

// Create global API instance
const api = new APIHelper();