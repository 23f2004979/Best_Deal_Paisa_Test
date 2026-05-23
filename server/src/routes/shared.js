const express = require('express');
const router = express.Router();
const { verifyToken, verifyRole } = require('../middleware/auth');
const attendanceController = require('../controllers/attendanceController');
const salaryController = require('../controllers/salaryController');
const reportController = require('../controllers/reportController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads folder exists in project root
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const cleanBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${cleanBaseName}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Attendance Routes
router.get('/attendance', verifyToken, attendanceController.getAttendance);
router.post('/attendance', verifyToken, attendanceController.markAttendance);

// Salary Routes
router.post('/salary/update', verifyToken, verifyRole(['ADMIN']), salaryController.updateSalary);
router.get('/salary/history/:userId', verifyToken, verifyRole(['ADMIN']), salaryController.getSalaryHistory);

// Report Routes
router.post('/reports', verifyToken, verifyRole(['TELE_CALLER']), reportController.createReport);
router.put('/reports/:id', verifyToken, verifyRole(['TELE_CALLER']), reportController.updateReport);
router.get('/reports', verifyToken, reportController.getReports);
router.post('/reports/:id/approve', verifyToken, verifyRole(['TEAM_LEAD', 'MANAGER', 'ADMIN']), reportController.approveReport);
router.post('/reports/bulk-share', verifyToken, reportController.bulkShareReports);

// File Upload Route
router.post('/upload', verifyToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ message: 'File uploaded successfully.', fileUrl });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ message: 'File upload failed.' });
  }
});

// Get list of active users to share files with (excluding current user)
router.get('/users', verifyToken, async (req, res) => {
  try {
    const prisma = require('../config/db');
    const users = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        id: { not: req.user.id }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        empId: true
      },
      orderBy: { name: 'asc' }
    });
    res.json(users);
  } catch (err) {
    console.error('Get active users error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Dashboard routes depending on role
router.get('/dashboard', verifyToken, require('../controllers/dashboardController').getDashboard);

// Report file tracking (for operational visibility in MA dashboard)
router.post('/reports/:id/track', verifyToken, async (req, res) => {
  try {
    const prisma = require('../config/db');
    const fileId = Number(req.params.id);
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) return res.status(404).json({ message: 'Report not found.' });
    
    await prisma.appHistory.create({
      data: {
        userId: req.user.id,
        fileId,
        status: 'AUDITING'
      }
    });
    res.json({ message: 'Activity tracked.' });
  } catch (err) {
    console.error('Track report error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get active managers and team leads for dropdowns during employee creation
router.get('/active-seniors', verifyToken, verifyRole(['ADMIN']), async (req, res) => {
  try {
    const prisma = require('../config/db');
    const managers = await prisma.user.findMany({
      where: { role: 'MANAGER', status: 'ACTIVE' },
      select: { id: true, name: true, empId: true }
    });
    const teamLeads = await prisma.user.findMany({
      where: { role: 'TEAM_LEAD', status: 'ACTIVE' },
      select: { id: true, name: true, empId: true, managerId: true }
    });
    res.json({ managers, teamLeads });
  } catch (err) {
    console.error('Get active seniors error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
