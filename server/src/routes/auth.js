const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const prisma  = require('../config/db');
const { verifyToken, verifyRole } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return res.status(401).json({ message: 'Invalid email or password.' });

    if (user.status !== 'ACTIVE')
      return res.status(403).json({ message: 'Account not active. Contact admin.' });

    const token = jwt.sign(
      { id: user.id, name: user.name, empId: user.empId, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );
    res.json({ token, user: { id: user.id, name: user.name, empId: user.empId, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, empId: true, name: true, email: true, role: true, status: true, dailyWage: true, baseSalary: true }
    });
    res.json(user);
  } catch (err) {
    console.error('Auth me error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Admin creates a user
router.post('/register', verifyToken, verifyRole(['ADMIN']), async (req, res) => {
  try {
    const { name, email, password, role, phone, baseSalary, dailyWage, managerId, teamLeadId } = req.body;

    if (role === 'ADMIN' || role === 'MASTER_ADMIN') {
      return res.status(400).json({ message: 'Creating an Admin user is not allowed.' });
    }
    
    // Generate empId based on role
    const prefixMap = {
      'MANAGER': 'MGR',
      'TEAM_LEAD': 'TL',
      'TELE_CALLER': 'TC',
      'ADMIN': 'ADM'
    };
    const prefix = prefixMap[role] || 'EMP';
    
    // find latest empId for this prefix
    const latestUser = await prisma.user.findFirst({
      where: { empId: { startsWith: prefix } },
      orderBy: { empId: 'desc' }
    });
    
    let nextNum = 1001;
    if (latestUser && latestUser.empId) {
      const parts = latestUser.empId.split('-');
      if (parts.length > 1) {
        nextNum = parseInt(parts[1]) + 1;
      }
    }
    
    const empId = `${prefix}-${nextNum}`;
    const passwordHash = await bcrypt.hash(password, 10);
    
    const newUser = await prisma.user.create({
      data: {
        empId,
        name,
        email,
        passwordHash,
        role,
        phone,
        baseSalary: Number(baseSalary) || 0,
        dailyWage: Number(dailyWage) || 0,
        managerId: managerId ? Number(managerId) : null,
        teamLeadId: teamLeadId ? Number(teamLeadId) : null,
        status: 'ACTIVE'
      }
    });

    // Auto-initialize attendance record for today (since role is MANAGER, TEAM_LEAD, or TELE_CALLER)
    if (['MANAGER', 'TEAM_LEAD', 'TELE_CALLER'].includes(role)) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      await prisma.attendance.create({
        data: {
          userId: newUser.id,
          date: today,
          status: 'ABSENT',
          dailyWage: 0,
          month: now.getMonth() + 1,
          year: now.getFullYear()
        }
      });
    }

    res.json({ message: 'User created', user: newUser });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

module.exports = router;
