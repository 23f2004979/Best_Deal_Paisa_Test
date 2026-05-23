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
    const presentCount = attendance.filter(a => a.status === 'PRESENT').length;
    const halfCount = attendance.filter(a => a.status === 'HALF_DAY').length;
    const presentDays = presentCount + (halfCount * 0.5);
    const earnedSalary = attendance.reduce((sum, a) => sum + ((a.status === 'PRESENT' || a.status === 'HALF_DAY') ? a.dailyWage : 0), 0);

    res.json({
      attendance,
      summary: {
        presentDays,
        earnedSalary,
        baseSalary: user.baseSalary,
        dailyWage: user.dailyWage > 0 ? user.dailyWage : Math.round(user.baseSalary / new Date(y, m, 0).getDate())
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
    const parsedDate = new Date(date);
    const d = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
    const m = d.getMonth() + 1;
    const y = d.getFullYear();

    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const daysInMonth = new Date(y, m, 0).getDate();
    const activeDailyWage = user.dailyWage > 0 ? user.dailyWage : Math.round(user.baseSalary / daysInMonth);

    const attendance = await prisma.attendance.upsert({
      where: {
        userId_date: {
          userId: Number(userId),
          date: d
        }
      },
      update: {
        status,
        dailyWage: status === 'PRESENT' ? activeDailyWage : (status === 'HALF_DAY' ? Math.round(activeDailyWage / 2) : 0)
      },
      create: {
        userId: Number(userId),
        date: d,
        status,
        dailyWage: status === 'PRESENT' ? activeDailyWage : (status === 'HALF_DAY' ? Math.round(activeDailyWage / 2) : 0),
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
