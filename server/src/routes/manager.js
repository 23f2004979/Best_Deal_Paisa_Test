const express   = require('express');
const router    = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const ctrl      = require('../controllers/managerController');

router.use(verifyToken, requireRole('MANAGER'));

router.get('/dashboard',            ctrl.getDashboard);
router.get('/team',                  ctrl.getTeam);
router.get('/files',                 ctrl.getFiles);
router.patch('/files/:id/status',    ctrl.updateFileStatus);
router.get('/loan',                  ctrl.getLoan);
router.post('/loan/approve/:id',     ctrl.approveLoan);
router.post('/loan/insert',          ctrl.insertLoan);
router.get('/subordinate-attendance', ctrl.getSubordinatesAttendance);
router.post('/subordinate-attendance/:id', ctrl.markSubordinateAttendance);

module.exports = router;
