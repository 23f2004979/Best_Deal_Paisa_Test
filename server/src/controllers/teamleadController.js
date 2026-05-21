const prisma = require('../config/db');

// GET /api/teamlead/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const teleCallers = await prisma.user.count({
      where: { teamLeadId: req.user.id, role: 'TELE_CALLER', status: 'ACTIVE' }
    });
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const pendingLoans = await prisma.loanDisbursed.count({
      where: { teleCaller: { teamLeadId: req.user.id }, status: 'PENDING', month, year }
    });
    res.json({ teleCallers, pendingLoans, month, year });
  } catch (err) {
    console.error('TeamLead dashboard error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/teamlead/attendance?month=&year= — TL views only their OWN attendance
exports.getAttendance = async (req, res) => {
  try {
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const year  = Number(req.query.year)  || new Date().getFullYear();
    const records = await prisma.attendance.findMany({
      where: { userId: req.user.id, month, year },
      orderBy: { date: 'asc' }
    });
    res.json({ records, month, year });
  } catch (err) {
    console.error('TeamLead attendance error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/teamlead/salary
exports.getSalary = async (req, res) => {
  try {
    const salaries = await prisma.salary.findMany({
      where: { userId: req.user.id },
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    });
    res.json(salaries);
  } catch (err) {
    console.error('TeamLead salary error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/teamlead/loan?month=&year=
exports.getLoan = async (req, res) => {
  try {
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const year  = Number(req.query.year)  || new Date().getFullYear();
    const tcIds = (await prisma.user.findMany({
      where: { teamLeadId: req.user.id, role: 'TELE_CALLER' },
      select: { id: true }
    })).map(u => u.id);
    const loans = await prisma.loanDisbursed.findMany({
      where: { month, year, teleCallerId: { in: tcIds } },
      include: { teleCaller: { select: { id: true, name: true } } },
      orderBy: { disbursedDate: 'asc' }
    });
    res.json({ loans, month, year });
  } catch (err) {
    console.error('TeamLead loan error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/teamlead/subordinate-attendance — Only TELE_CALLER users assigned to this TL
exports.getSubordinatesAttendance = async (req, res) => {
  try {
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const year  = Number(req.query.year)  || new Date().getFullYear();
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const users = await prisma.user.findMany({
      where: { teamLeadId: req.user.id, role: 'TELE_CALLER', status: 'ACTIVE' },
      select: { id: true, name: true, role: true, baseSalary: true, attendance: { where: { month, year } } }
    });
    
    const now = new Date();
    const data = users.map(u => {
      const presentDays = u.attendance.filter(a => a.status === 'PRESENT').length;
      const absentDays = u.attendance.filter(a => a.status === 'ABSENT').length;
      const leaveDays = u.attendance.filter(a => a.status === 'LEAVE').length;
      const projectedSalary = Math.round((u.baseSalary / daysInMonth) * presentDays);
      const todayRecord = u.attendance.find(a => {
        const d = new Date(a.date);
        return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      return {
        id: u.id, name: u.name, role: u.role, baseSalary: u.baseSalary,
        presentDays, absentDays, leaveDays, projectedSalary,
        isMarkedToday: !!todayRecord,
        todayStatus: todayRecord ? todayRecord.status : null
      };
    });
    
    res.json(data);
  } catch (err) {
    console.error('TeamLead getSubordinatesAttendance error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/teamlead/subordinate-attendance/:id — body: { status: 'PRESENT' | 'ABSENT' | 'LEAVE' }
exports.markSubordinateAttendance = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const status = req.body.status || 'PRESENT';
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Verify that the target user is a TELE_CALLER assigned to this TL
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser || targetUser.role !== 'TELE_CALLER' || targetUser.teamLeadId !== req.user.id) {
      return res.status(403).json({ message: 'You can only mark attendance for your assigned Tele Callers.' });
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
    console.error('TeamLead markSubordinateAttendance error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};
