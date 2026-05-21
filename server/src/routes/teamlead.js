const express   = require('express');
const router    = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const ctrl      = require('../controllers/teamleadController');

router.use(verifyToken, requireRole('TEAM_LEAD'));

router.get('/dashboard',  ctrl.getDashboard);
router.get('/attendance', ctrl.getAttendance);
router.get('/salary',     ctrl.getSalary);
router.get('/loan',       ctrl.getLoan);
router.get('/subordinate-attendance', ctrl.getSubordinatesAttendance);
router.post('/subordinate-attendance/:id', ctrl.markSubordinateAttendance);

module.exports = router;
