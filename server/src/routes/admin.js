const express   = require('express');
const router    = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const ctrl      = require('../controllers/adminController');

// All routes below require login AND either ADMIN or MASTER_ADMIN role
router.use(verifyToken, requireRole('ADMIN', 'MASTER_ADMIN'));

router.get('/dashboard',          ctrl.getDashboard);
router.get('/users',              ctrl.getUsers);
router.patch('/users/:id',        ctrl.updateUserProfile);
router.patch('/users/:id/status', ctrl.updateUserStatus);
router.get('/files',              ctrl.getFiles);
router.patch('/files/:id/status', ctrl.updateFileStatus);
router.get('/loan-report',        ctrl.getLoanReport);
router.get('/reports/download',   requireRole('MASTER_ADMIN'), ctrl.downloadReport);
router.get('/subordinate-attendance', ctrl.getSubordinatesAttendance);
router.post('/subordinate-attendance/:id', ctrl.markSubordinateAttendance);
router.get('/analytics',              ctrl.getAnalytics);

module.exports = router;
