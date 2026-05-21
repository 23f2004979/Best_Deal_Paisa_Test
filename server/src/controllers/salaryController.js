const prisma = require('../config/db');

exports.updateSalary = async (req, res) => {
  try {
    const { userId, baseSalary, dailyWage, effectiveDate } = req.body;
    const uid = Number(userId);

    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Log the change
    await prisma.salaryHistory.create({
      data: {
        userId: uid,
        oldBaseSalary: user.baseSalary,
        newBaseSalary: Number(baseSalary),
        oldDailyWage: user.dailyWage,
        newDailyWage: Number(dailyWage),
        effectiveDate: new Date(effectiveDate)
      }
    });

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: uid },
      data: {
        baseSalary: Number(baseSalary),
        dailyWage: Number(dailyWage)
      }
    });

    res.json({ message: 'Salary updated successfully', user: updatedUser });
  } catch (err) {
    console.error('updateSalary error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getSalaryHistory = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const history = await prisma.salaryHistory.findMany({
      where: { userId },
      orderBy: { changedAt: 'desc' }
    });
    res.json(history);
  } catch (err) {
    console.error('getSalaryHistory error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};
