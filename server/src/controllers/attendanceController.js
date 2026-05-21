const prisma = require('../config/db');

exports.getAttendance = async (req, res) => {
  try {
    const { userId, month, year } = req.query;
    const uid = userId ? Number(userId) : req.user.id;
    const m = month ? Number(month) : new Date().getMonth() + 1;
    const y = year ? Number(year) : new Date().getFullYear();

    const attendance = await prisma.attendance.findMany({
      where: { userId: uid, month: m, year: y },
      orderBy: { date: 'asc' }
    });

    const user = await prisma.user.findUnique({ where: { id: uid } });

    // Calculate totals
    const presentDays = attendance.filter(a => a.status === 'PRESENT').length;
    const earnedSalary = attendance.reduce((sum, a) => sum + (a.status === 'PRESENT' ? a.dailyWage : 0), 0);

    res.json({
      attendance,
      summary: {
        presentDays,
        earnedSalary,
        baseSalary: user.baseSalary,
        dailyWage: user.dailyWage > 0 ? user.dailyWage : Math.round(user.baseSalary / 30)
      }
    });
  } catch (err) {
    console.error('getAttendance error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const { userId, date, status } = req.body; // status: PRESENT, ABSENT, LEAVE
    const d = new Date(date);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();

    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const activeDailyWage = user.dailyWage > 0 ? user.dailyWage : Math.round(user.baseSalary / 30);

    const attendance = await prisma.attendance.upsert({
      where: {
        userId_date: {
          userId: Number(userId),
          date: d
        }
      },
      update: {
        status,
        dailyWage: status === 'PRESENT' ? activeDailyWage : 0
      },
      create: {
        userId: Number(userId),
        date: d,
        status,
        dailyWage: status === 'PRESENT' ? activeDailyWage : 0,
        month: m,
        year: y
      }
    });

    res.json({ message: 'Attendance marked', attendance });
  } catch (err) {
    console.error('markAttendance error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};
