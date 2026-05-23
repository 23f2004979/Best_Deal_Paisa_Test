const prisma = require('../config/db');

// GET /api/manager/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const teamLeads = await prisma.user.findMany({
      where: { managerId: req.user.id, role: 'TEAM_LEAD', status: 'ACTIVE' },
      select: { id: true, name: true }
    });
    const tlIds = teamLeads.map(tl => tl.id);
    const teleCallers = await prisma.user.count({
      where: { teamLeadId: { in: tlIds }, role: 'TELE_CALLER', status: 'ACTIVE' }
    });
    const pendingFiles = await prisma.file.count({
      where: {
        status: 'PENDING_APPROVAL',
        approvalLevel: { lte: 2 },
        createdBy: { OR: [{ managerId: req.user.id }, { teamLeadId: { in: tlIds } }] }
      }
    });
    res.json({ teamLeads: teamLeads.length, teleCallers, pendingFiles, teamLeadsList: teamLeads });
  } catch (err) {
    console.error('Manager dashboard error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/manager/team
exports.getTeam = async (req, res) => {
  try {
    const teamLeads = await prisma.user.findMany({
      where: { managerId: req.user.id, role: 'TEAM_LEAD' },
      select: { id: true, name: true, email: true, status: true, teleCallers: { select: { id: true, name: true, email: true, status: true } } }
    });
    res.json(teamLeads);
  } catch (err) {
    console.error('Manager getTeam error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/manager/files
exports.getFiles = async (req, res) => {
  try {
    const teamLeads = await prisma.user.findMany({
      where: { managerId: req.user.id },
      select: { id: true, teleCallers: { select: { id: true } } }
    });
    const allIds = [];
    teamLeads.forEach(tl => {
      allIds.push(tl.id);
      tl.teleCallers.forEach(tc => allIds.push(tc.id));
    });
    const files = await prisma.file.findMany({
      where: { createdById: { in: allIds } },
      include: { createdBy: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(files);
  } catch (err) {
    console.error('Manager getFiles error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// PATCH /api/manager/files/:id/status
exports.updateFileStatus = async (req, res) => {
  try {
    const file = await prisma.file.update({
      where: { id: Number(req.params.id) },
      data:  { status: req.body.status }
    });
    res.json({ message: 'File status updated.', file });
  } catch (err) {
    console.error('Manager updateFileStatus error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/manager/loan?month=&year=
exports.getLoan = async (req, res) => {
  try {
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const year  = Number(req.query.year)  || new Date().getFullYear();
    const teamLeads = await prisma.user.findMany({
      where: { managerId: req.user.id },
      select: { id: true, teleCallers: { select: { id: true } } }
    });
    const tcIds = [];
    teamLeads.forEach(tl => tl.teleCallers.forEach(tc => tcIds.push(tc.id)));
    const loans = await prisma.loanDisbursed.findMany({
      where: { month, year, teleCallerId: { in: tcIds } },
      include: { teleCaller: { select: { id: true, name: true } } },
      orderBy: { disbursedDate: 'asc' }
    });
    res.json({ loans, month, year });
  } catch (err) {
    console.error('Manager getLoan error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/manager/loan/approve/:id
exports.approveLoan = async (req, res) => {
  try {
    const loan = await prisma.loanDisbursed.update({
      where: { id: Number(req.params.id) },
      data:  { status: 'APPROVED', approvedById: req.user.id }
    });
    res.json({ message: 'Loan approved.', loan });
  } catch (err) {
    console.error('Manager approveLoan error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/manager/loan/insert — { teleCallerId, amount, disbursedDate }
exports.insertLoan = async (req, res) => {
  try {
    const { teleCallerId, amount, disbursedDate } = req.body;
    const d = new Date(disbursedDate);
    const loan = await prisma.loanDisbursed.create({
      data: {
        teleCallerId: Number(teleCallerId),
        amount: Number(amount),
        disbursedDate: d,
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        status: 'PENDING'
      }
    });
    res.json({ message: 'Loan entry created.', loan });
  } catch (err) {
    console.error('Manager insertLoan error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/manager/subordinate-attendance — Only TEAM_LEAD users assigned to this manager
exports.getSubordinatesAttendance = async (req, res) => {
  try {
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const year  = Number(req.query.year)  || new Date().getFullYear();
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const users = await prisma.user.findMany({
      where: { managerId: req.user.id, role: 'TEAM_LEAD', status: 'ACTIVE' },
      select: { id: true, name: true, role: true, baseSalary: true, dailyWage: true, attendance: { where: { month, year } } }
    });
    
    const now = new Date();
    const todayStr = now.toLocaleDateString('sv-SE');
    const data = users.map(u => {
      const presentCount = u.attendance.filter(a => a.status === 'PRESENT').length;
      const halfCount = u.attendance.filter(a => a.status === 'HALF_DAY').length;
      const absentCount = u.attendance.filter(a => a.status === 'ABSENT').length;
      const leaveCount = u.attendance.filter(a => a.status === 'LEAVE').length;
      const effectiveDailyWage = u.dailyWage > 0 ? u.dailyWage : Math.round(u.baseSalary / daysInMonth);
      const presentDays = presentCount + (halfCount * 0.5);
      const absentDays = absentCount + (halfCount * 0.5);
      const leaveDays = leaveCount;
      const projectedSalary = Math.round(effectiveDailyWage * presentDays);
      const todayRecord = u.attendance.find(a => {
        return new Date(a.date).toLocaleDateString('sv-SE') === todayStr;
      });
      return {
        id: u.id, name: u.name, role: u.role, baseSalary: u.baseSalary, dailyWage: u.dailyWage,
        presentDays, absentDays, leaveDays, halfDays: halfCount, projectedSalary,
        isMarkedToday: !!todayRecord,
        todayStatus: todayRecord ? todayRecord.status : null
      };
    });
    
    res.json(data);
  } catch (err) {
    console.error('Manager getSubordinatesAttendance error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/manager/subordinate-attendance/:id — body: { status: 'PRESENT' | 'ABSENT' | 'LEAVE' }
exports.markSubordinateAttendance = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const status = req.body.status || 'PRESENT';
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Verify that the target user is a TEAM_LEAD assigned to this manager
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser || targetUser.role !== 'TEAM_LEAD' || targetUser.managerId !== req.user.id) {
      return res.status(403).json({ message: 'You can only mark attendance for your assigned Team Leads.' });
    }

    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const daysInMonth = new Date(year, month, 0).getDate();
    const activeDailyWage = targetUser.dailyWage > 0 ? targetUser.dailyWage : Math.round(targetUser.baseSalary / daysInMonth);

    const attendance = await prisma.attendance.upsert({
      where: {
        userId_date: { userId, date: today }
      },
      update: {
        status,
        dailyWage: status === 'PRESENT' ? activeDailyWage : (status === 'HALF_DAY' ? Math.round(activeDailyWage / 2) : 0)
      },
      create: {
        userId,
        date: today,
        status,
        dailyWage: status === 'PRESENT' ? activeDailyWage : (status === 'HALF_DAY' ? Math.round(activeDailyWage / 2) : 0),
        month: now.getMonth() + 1,
        year: now.getFullYear()
      }
    });
    res.json({ message: 'Attendance marked successfully.', attendance });
  } catch (err) {
    console.error('Manager markSubordinateAttendance error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};
