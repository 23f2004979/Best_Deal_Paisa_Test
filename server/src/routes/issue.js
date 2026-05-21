const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const ctrl = require('../controllers/issueController');

// All issue routes require login
router.use(verifyToken);

router.post('/', ctrl.createIssue);
router.get('/my', ctrl.getMyIssues);
router.get('/incoming', ctrl.getIncomingIssues);
router.patch('/:id/status', ctrl.updateIssueStatus);

module.exports = router;
