/**
 * Hospital Routes
 * ACCURATE & PRODUCTION-READY
 */

const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalController');
const { verifyToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');

// All hospital routes require authentication
router.use(verifyToken);

/**
 * Doctor Management
 */
router.get('/:hospitalId/doctors', hospitalController.getDoctors);
router.get('/:hospitalId/doctors/:doctorId', hospitalController.getDoctorById);
router.post('/:hospitalId/doctors', checkRole('hospital', 'admin'), hospitalController.addDoctor);
router.put('/:hospitalId/doctors/:doctorId', checkRole('hospital', 'admin'), hospitalController.updateDoctor);
router.delete('/:hospitalId/doctors/:doctorId', checkRole('hospital', 'admin'), hospitalController.deleteDoctor);
router.put('/:hospitalId/doctors/:doctorId/status', checkRole('hospital', 'admin'), hospitalController.updateDoctorStatus);

/**
 * Department Management
 */
router.get('/:hospitalId/departments', hospitalController.getDepartments);
router.get('/:hospitalId/departments/:departmentId', hospitalController. getDepartmentById);
router. post('/:hospitalId/departments', checkRole('hospital', 'admin'), hospitalController.addDepartment);
router.put('/:hospitalId/departments/:departmentId', checkRole('hospital', 'admin'), hospitalController.updateDepartment);
router.delete('/:hospitalId/departments/:departmentId', checkRole('hospital', 'admin'), hospitalController.deleteDepartment);

/**
 * Hospital Information
 */
router.get('/:hospitalId/info', hospitalController.getHospitalInfo);
router.put('/:hospitalId/info', checkRole('hospital', 'admin'), hospitalController.updateHospitalInfo);

module.exports = router;