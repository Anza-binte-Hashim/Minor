/**
 * Authentication Module
 * Handles login and registration logic
 */

class AuthModule {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // This is handled in main.js
    }

    /**
     * Validate email format
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate password strength
     */
    static isValidPassword(password) {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    }

    /**
     * Validate phone number
     */
    static isValidPhone(phone) {
        const phoneRegex = /^[\d\-\+\(\)\s]+$/;
        return phoneRegex.test(phone) && phone.replace(/\D/g, ''). length >= 10;
    }

    /**
     * Validate NID format
     */
    static isValidNID(nid) {
        return nid.length >= 10 && nid.length <= 20;
    }
}

// Instantiate auth module
const authModule = new AuthModule();