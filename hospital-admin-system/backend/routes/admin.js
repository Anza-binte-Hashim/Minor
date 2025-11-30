/**
 * Admin Routes
 * ACCURATE & PRODUCTION-READY
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken } = require('../middleware/auth');
const { checkRole, checkPermission } = require('../middleware/rbac');

// All admin routes require authentication and admin role
router.use(verifyToken);
router.use(checkRole('admin'));

/**
 * User Management
 */
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController. getUserById);
router.put('/users/:id', adminController. updateUser);
router.delete('/users/:id', adminController.deleteUser);

/**
 * Hospital Management
 */
router.get('/hospitals', adminController.getHospitals);
router.get('/hospitals/:id', adminController.getHospitalById);
router.put('/hospitals/:id', adminController.updateHospital);
router.delete('/hospitals/:id', adminController. deleteHospital);

/**
 * Registration Requests
 */
router.get('/registrations', adminController.getRegistrationRequests);
router.get('/registrations/:id', adminController.getRegistrationRequestById);
router.post('/registrations/:id/accept', adminController.acceptRegistration);
router.post('/registrations/:id/reject', adminController.rejectRegistration);

/**
 * Send Credentials Email
 */
router.post('/send-credentials', adminController.sendCredentialsEmail);

/**
 * Dashboard Statistics
 */
router.get('/stats', adminController.getDashboardStats);

module.exports = router;