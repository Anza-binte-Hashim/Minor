/**
 * User Routes
 * ACCURATE & PRODUCTION-READY
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');

// All user routes require authentication
router.use(verifyToken);

/**
 * Profile Management
 */
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

/**
 * Appointment Management
 */
router.get('/appointments', userController.getAppointments);
router.get('/appointments/:id', userController. getAppointmentById);
router.post('/appointments', userController.bookAppointment);
router.delete('/appointments/:id', userController. cancelAppointment);

/**
 * Hospital Search and Browse
 */
router.get('/hospitals', userController.searchHospitals);
router. get('/hospitals/:id', userController.getHospitalDetails);
router.get('/hospitals/:id/doctors', userController.getHospitalDoctors);

module.exports = router;