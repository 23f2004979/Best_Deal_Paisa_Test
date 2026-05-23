const prisma = require('../config/db');

// GET /api/telecaller/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const [totalFiles, pendingFiles, attendanceRecords, loans] = await Promise.all([
      prisma.file.count({ where: { createdById: req.user.id } }),
      prisma.file.count({ where: { createdById: req.user.id, status: 'PENDING_APPROVAL' } }),
      prisma.attendance.findMany({ where: { userId: req.user.id, month, year } }),
      prisma.loanDisbursed.count({ where: { teleCallerId: req.user.id, month, year } }),
    ]);
    const presentCount = attendanceRecords.filter(a => a.status === 'PRESENT').length;
    const halfCount = attendanceRecords.filter(a => a.status === 'HALF_DAY').length;
    const presentDays = presentCount + (halfCount * 0.5);

    res.json({ totalFiles, pendingFiles, presentDays, loans, month, year });
  } catch (err) {
    console.error('TC dashboard error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/telecaller/files
exports.getFiles = async (req, res) => {
  try {
    const files = await prisma.file.findMany({
      where: { createdById: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(files);
  } catch (err) {
    console.error('TC getFiles error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/telecaller/files — { title, description }
exports.createFile = async (req, res) => {
  try {
    const { title, description } = req.body;
    const file = await prisma.file.create({
      data: { title, description, createdById: req.user.id }
    });
    res.json({ message: 'File created.', file });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ message: 'You already have a file with this title.' });
    }
    console.error('TC createFile error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/telecaller/attendance
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
    console.error('TC attendance error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/telecaller/attendance
exports.markAttendance = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const existing = await prisma.attendance.findFirst({
      where: {
        userId: req.user.id,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    if (existing) {
      return res.status(400).json({ message: 'Attendance already marked for today.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const daysInMonth = new Date(year, month, 0).getDate();
    const activeDailyWage = user.dailyWage > 0 ? user.dailyWage : Math.round(user.baseSalary / daysInMonth);

    const attendance = await prisma.attendance.create({
      data: {
        userId: req.user.id,
        date: today,
        status: 'PRESENT',
        dailyWage: activeDailyWage,
        month,
        year
      }
    });
    res.json({ message: 'Attendance marked successfully.', attendance });
  } catch (err) {
    console.error('TC mark attendance error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/telecaller/salary
exports.getSalary = async (req, res) => {
  try {
    const salaries = await prisma.salary.findMany({
      where: { userId: req.user.id },
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    });
    res.json(salaries);
  } catch (err) {
    console.error('TC salary error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/telecaller/loan?month=&year=
exports.getLoan = async (req, res) => {
  try {
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const year  = Number(req.query.year)  || new Date().getFullYear();
    const loans = await prisma.loanDisbursed.findMany({
      where: { teleCallerId: req.user.id, month, year },
      orderBy: { disbursedDate: 'asc' }
    });
    res.json({ loans, month, year });
  } catch (err) {
    console.error('TC loan error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/telecaller/history
exports.getHistory = async (req, res) => {
  try {
    const history = await prisma.appHistory.findMany({
      where: { userId: req.user.id },
      include: { file: { select: { id: true, title: true } } },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(history);
  } catch (err) {
    console.error('TC history error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};
