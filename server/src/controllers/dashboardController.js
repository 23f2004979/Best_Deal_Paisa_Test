const prisma = require('../config/db');

exports.getDashboard = async (req, res) => {
  try {
    const role = req.user.role;
    let data = {};

    if (role === 'ADMIN' || role === 'MASTER_ADMIN') {
      const totalEmployees = await prisma.user.count({ where: { status: 'ACTIVE', role: { notIn: ['ADMIN', 'MASTER_ADMIN'] } } });
      const pendingApprovals = await prisma.file.count({ where: { status: 'PENDING_APPROVAL', approvalLevel: 3 } });
      const approvedReports = await prisma.file.count({ where: { status: 'APPROVED' } });
      
      // Calculate monthly salary expense
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();
      const attendance = await prisma.attendance.findMany({
        where: {
          month,
          year,
          status: { in: ['PRESENT', 'HALF_DAY'] }
        }
      });
      const salaryExpense = attendance.reduce((sum, a) => sum + a.dailyWage, 0);

      data = { totalEmployees, pendingApprovals, approvedReports, salaryExpense };
    } else {
      // For Manager, TL, Telecaller
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();
      
      const attendance = await prisma.attendance.findMany({ where: { userId: req.user.id, month, year } });
      const presentCount = attendance.filter(a => a.status === 'PRESENT').length;
      const halfCount = attendance.filter(a => a.status === 'HALF_DAY').length;
      const presentDays = presentCount + (halfCount * 0.5);
      const monthlySalary = attendance.reduce((sum, a) => sum + ((a.status === 'PRESENT' || a.status === 'HALF_DAY') ? a.dailyWage : 0), 0);
      
      const reportsCreated = await prisma.file.count({ where: { createdById: req.user.id } });
      const approvedReports = await prisma.file.count({ where: { createdById: req.user.id, status: 'APPROVED' } });
      
      data = { presentDays, monthlySalary, reportsCreated, approvedReports };
    }

    // Include recent notifications
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    data.notifications = notifications;

    res.json(data);
  } catch (err) {
    console.error('getDashboard error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};
