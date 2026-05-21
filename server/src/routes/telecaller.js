const express   = require('express');
const router    = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const ctrl      = require('../controllers/telecallerController');

router.use(verifyToken, requireRole('TELE_CALLER'));

router.get('/dashboard',  ctrl.getDashboard);
router.get('/files',      ctrl.getFiles);
router.post('/files',     ctrl.createFile);
router.get('/attendance', ctrl.getAttendance);
router.get('/salary',     ctrl.getSalary);
router.get('/loan',       ctrl.getLoan);
router.get('/history',    ctrl.getHistory);

module.exports = router;
