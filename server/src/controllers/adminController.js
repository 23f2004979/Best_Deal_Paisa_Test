const prisma = require('../config/db');
const bcrypt = require('bcrypt');

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  // 8+ chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/~`\-]).{8,}$/.test(password);
}

// GET /api/admin/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const [managers, teamLeads, teleCallers, pendingUsers, pendingFiles] = await Promise.all([
      prisma.user.count({ where: { role: 'MANAGER',     status: 'ACTIVE'   } }),
      prisma.user.count({ where: { role: 'TEAM_LEAD',   status: 'ACTIVE'   } }),
      prisma.user.count({ where: { role: 'TELE_CALLER', status: 'ACTIVE'   } }),
      prisma.user.count({ where: { status: 'PENDING' } }),
      prisma.file.count({ where: { status: 'PENDING_APPROVAL' } }),
    ]);
    res.json({ managers, teamLeads, teleCallers, pendingUsers, pendingFiles });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/admin/users?role=&status=
exports.getUsers = async (req, res) => {
  try {
    const where = { status: { not: 'DELETED' } };
    if (req.query.role)   where.role   = req.query.role;
    if (req.query.status) where.status = req.query.status;
    const users = await prisma.user.findMany({
      where,
      select: { id: true, empId: true, name: true, email: true, role: true, status: true, baseSalary: true, dailyWage: true, createdAt: true, managerId: true, teamLeadId: true }
    });
    res.json(users);
  } catch (err) {
    console.error('Admin getUsers error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { name, email, role, phone, baseSalary, dailyWage, status, managerId, teamLeadId, password } = req.body;

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Role-based privilege escalation checks
    if (req.user.role !== 'MASTER_ADMIN') {
      // Standard ADMIN cannot edit ADMIN/MASTER_ADMIN profiles
      if (targetUser.role === 'ADMIN' || targetUser.role === 'MASTER_ADMIN') {
        return res.status(403).json({ message: 'You do not have permission to edit administrative accounts.' });
      }
      // Standard ADMIN cannot promote users to ADMIN or MASTER_ADMIN
      if (role === 'ADMIN' || role === 'MASTER_ADMIN') {
        return res.status(403).json({ message: 'You do not have permission to grant administrative roles.' });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (baseSalary !== undefined) updateData.baseSalary = Number(baseSalary) || 0;
    if (dailyWage !== undefined) updateData.dailyWage = Number(dailyWage) || 0;
    if (managerId !== undefined) updateData.managerId = managerId ? Number(managerId) : null;
    if (teamLeadId !== undefined) updateData.teamLeadId = teamLeadId ? Number(teamLeadId) : null;

    if (email !== undefined) {
      if (!validateEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format.' });
      }
      updateData.email = email;
    }

    if (role !== undefined) {
      updateData.role = role;
      const prefixMap = {
        'MANAGER': 'MGR',
        'TEAM_LEAD': 'TL',
        'TELE_CALLER': 'TC',
        'ADMIN': 'ADM'
      };
      if (prefixMap[role] && !targetUser.empId.startsWith(prefixMap[role])) {
        const prefix = prefixMap[role];
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
        updateData.empId = `${prefix}-${nextNum}`;
      }
    }

    if (status !== undefined) {
      if (targetUser.role === 'ADMIN' || targetUser.role === 'MASTER_ADMIN') {
        if (['BLACKLISTED', 'DEACTIVATED', 'DELETED'].includes(status)) {
          return res.status(400).json({ message: 'Administrative accounts cannot be blacklisted, deactivated, or deleted.' });
        }
      }
      updateData.status = status;
    }

    if (password !== undefined && password !== '') {
      if (!validatePassword(password)) {
        return res.status(400).json({
          message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
        });
      }
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    res.json({ message: 'User profile updated successfully.', user: updatedUser });
  } catch (err) {
    console.error('updateUserProfile error:', err);
    if (err.code === 'P2002') {
      return res.status(400).json({ message: 'Email address already in use.' });
    }
    res.status(500).json({ message: 'Server error during user update.' });
  }
};

// PATCH /api/admin/users/:id/status  — body: { status: 'ACTIVE' | 'REJECTED' | 'BLACKLISTED' | 'DELETED' }
exports.updateUserStatus = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (targetUser.role === 'ADMIN' || targetUser.role === 'MASTER_ADMIN') {
      if (['BLACKLISTED', 'DEACTIVATED', 'DELETED'].includes(req.body.status)) {
        return res.status(400).json({ message: 'Administrative accounts cannot be blacklisted, deactivated, or deleted.' });
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data:  { status: req.body.status }
    });
    res.json({ message: req.body.status === 'DELETED' ? 'User deleted successfully.' : 'User status updated.', user });
  } catch (err) {
    console.error('Admin updateUserStatus error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/admin/files?status=
exports.getFiles = async (req, res) => {
  try {
    const where = {};
    if (req.query.status) {
      where.status = req.query.status === 'PENDING' ? 'PENDING_APPROVAL' : req.query.status;
    }
    const files = await prisma.file.findMany({
      where,
      include: { createdBy: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(files);
  } catch (err) {
    console.error('Admin getFiles error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// PATCH /api/admin/files/:id/status — body: { status: 'APPROVED' | 'REJECTED' }
exports.updateFileStatus = async (req, res) => {
  try {
    const file = await prisma.file.update({
      where: { id: Number(req.params.id) },
      data:  { status: req.body.status }
    });
    res.json({ message: 'File status updated.', file });
  } catch (err) {
    console.error('Admin updateFileStatus error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/admin/loan-report?month=6&year=2025
exports.getLoanReport = async (req, res) => {
  try {
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const year  = Number(req.query.year)  || new Date().getFullYear();
    const loans = await prisma.loanDisbursed.findMany({
      where: { month, year },
      include: { teleCaller: { select: { id: true, name: true } } },
      orderBy: { disbursedDate: 'asc' }
    });
    res.json({ loans, month, year });
  } catch (err) {
    console.error('Admin getLoanReport error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/admin/reports/download — returns JSON user data for PDF generation
exports.downloadReport = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, status: true, baseSalary: true, createdAt: true }
    });
    res.json(users);
  } catch (err) {
    console.error('Admin downloadReport error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/admin/subordinate-attendance — Only MANAGER (CM) users for MA to mark
exports.getSubordinatesAttendance = async (req, res) => {
  try {
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const year  = Number(req.query.year)  || new Date().getFullYear();
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const users = await prisma.user.findMany({
      where: { role: 'MANAGER', status: 'ACTIVE' },
      select: { id: true, name: true, role: true, baseSalary: true, dailyWage: true, attendance: { where: { month, year } } }
    });
    
    const now = new Date();
    const data = users.map(u => {
      const presentDays = u.attendance.filter(a => a.status === 'PRESENT').length;
      const absentDays = u.attendance.filter(a => a.status === 'ABSENT').length;
      const leaveDays = u.attendance.filter(a => a.status === 'LEAVE').length;
      const projectedSalary = Math.round(u.dailyWage * presentDays);
      const todayRecord = u.attendance.find(a => {
        const d = new Date(a.date);
        return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      return {
        id: u.id, name: u.name, role: u.role, baseSalary: u.baseSalary, dailyWage: u.dailyWage,
        presentDays, absentDays, leaveDays, projectedSalary,
        isMarkedToday: !!todayRecord,
        todayStatus: todayRecord ? todayRecord.status : null
      };
    });
    
    res.json(data);
  } catch (err) {
    console.error('Admin getSubordinatesAttendance error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/admin/subordinate-attendance/:id — body: { status: 'PRESENT' | 'ABSENT' | 'LEAVE' }
exports.markSubordinateAttendance = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const status = req.body.status || 'PRESENT';
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Verify that the target user is a MANAGER
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser || targetUser.role !== 'MANAGER') {
      return res.status(403).json({ message: 'You can only mark attendance for Company Managers.' });
    }

    const activeDailyWage = targetUser.dailyWage > 0 ? targetUser.dailyWage : Math.round(targetUser.baseSalary / 30);

    const attendance = await prisma.attendance.upsert({
      where: {
        userId_date: { userId, date: today }
      },
      update: {
        status,
        dailyWage: status === 'PRESENT' ? activeDailyWage : 0
      },
      create: {
        userId,
        date: today,
        status,
        dailyWage: status === 'PRESENT' ? activeDailyWage : 0,
        month: now.getMonth() + 1,
        year: now.getFullYear()
      }
    });
    res.json({ message: 'Attendance marked successfully.', attendance });
  } catch (err) {
    console.error('Admin markSubordinateAttendance error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/admin/analytics — Attendance analytics + operational tracking for CMs and TLs
exports.getAnalytics = async (req, res) => {
  try {
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const year  = Number(req.query.year)  || new Date().getFullYear();
    const daysInMonth = new Date(year, month, 0).getDate();

    // Fetch Managers and Team Leads with attendance
    const users = await prisma.user.findMany({
      where: { role: { in: ['MANAGER', 'TEAM_LEAD'] }, status: 'ACTIVE' },
      select: {
        id: true, name: true, empId: true, role: true, baseSalary: true, dailyWage: true,
        attendance: { where: { month, year } }
      }
    });

    const attendanceData = users.map(u => {
      const presentDays = u.attendance.filter(a => a.status === 'PRESENT').length;
      const absentDays = u.attendance.filter(a => a.status === 'ABSENT').length;
      const leaveDays = u.attendance.filter(a => a.status === 'LEAVE').length;
      const projectedSalary = Math.round(u.dailyWage * presentDays);
      return {
        id: u.id, empId: u.empId, name: u.name, role: u.role,
        presentDays, absentDays, leaveDays, totalDays: daysInMonth, projectedSalary
      };
    });

    // Fetch recent file activity (approval logs) from CMs and TLs
    const userIds = users.map(u => u.id);
    const recentActivity = await prisma.approvalLog.findMany({
      where: { userId: { in: userIds } },
      include: {
        file: { select: { id: true, reportNumber: true, title: true, status: true } },
        user: { select: { id: true, name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 30
    });

    // Fetch files currently being worked on (PENDING_APPROVAL files assigned to these users' hierarchy)
    const activeFiles = await prisma.file.findMany({
      where: { status: 'PENDING_APPROVAL' },
      include: {
        createdBy: { select: { id: true, name: true, role: true } }
      },
      orderBy: { updatedAt: 'desc' },
      take: 20
    });

    res.json({ attendanceData, recentActivity, activeFiles, month, year });
  } catch (err) {
    console.error('Admin getAnalytics error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};
