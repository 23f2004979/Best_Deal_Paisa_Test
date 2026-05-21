const prisma = require('../config/db');

exports.createReport = async (req, res) => {
  try {
    const { title, description, customerDetails } = req.body;
    
    // Generate Report Number
    const year = new Date().getFullYear();
    const latestFile = await prisma.file.findFirst({
      where: { reportNumber: { startsWith: `CRF-${year}-` } },
      orderBy: { id: 'desc' }
    });
    
    let nextNum = 1;
    if (latestFile && latestFile.reportNumber) {
      const parts = latestFile.reportNumber.split('-');
      if (parts.length > 2) {
        nextNum = parseInt(parts[2]) + 1;
      }
    }
    const reportNumber = `CRF-${year}-${String(nextNum).padStart(4, '0')}`;

    const file = await prisma.file.create({
      data: {
        reportNumber,
        title,
        description,
        customerDetails: JSON.stringify(customerDetails),
        status: 'PENDING_APPROVAL',
        createdById: req.user.id,
        approvalLevel: 1 // Start at TL
      }
    });

    res.json({ message: 'Report created', file });
  } catch (err) {
    console.error('createReport error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, customerDetails } = req.body;
    
    const file = await prisma.file.findUnique({ where: { id: Number(id) } });
    if (!file) return res.status(404).json({ message: 'File not found' });
    if (file.createdById !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    // Re-Approval Logic: If approved report is edited, status resets
    let newStatus = file.status;
    let newLevel = file.approvalLevel;
    if (file.status === 'APPROVED' || file.status === 'REJECTED' || file.status === 'CHANGES_REQUESTED') {
      newStatus = 'PENDING_APPROVAL';
      newLevel = 1;
    }

    const updatedFile = await prisma.file.update({
      where: { id: Number(id) },
      data: {
        title,
        description,
        customerDetails: JSON.stringify(customerDetails),
        status: newStatus,
        approvalLevel: newLevel
      }
    });

    res.json({ message: 'Report updated', file: updatedFile });
  } catch (err) {
    console.error('updateReport error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getReports = async (req, res) => {
  try {
    let where = {};
    const { status, month, year } = req.query;
    
    if (req.user.role === 'TELE_CALLER') {
      where.createdById = req.user.id;
    } else if (req.user.role === 'TEAM_LEAD') {
      // TL can see reports of their telecallers or just by level
      where.approvalLevel = { gte: 1 };
      const users = await prisma.user.findMany({ where: { teamLeadId: req.user.id }, select: { id: true } });
      where.createdById = { in: users.map(u => u.id) };
    } else if (req.user.role === 'MANAGER') {
      where.approvalLevel = { gte: 1 };
    } else if (req.user.role === 'ADMIN' || req.user.role === 'MASTER_ADMIN') {
      // Admin sees all
    }

    if (status) where.status = status;
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      where.createdAt = { gte: startDate, lte: endDate };
    }

    const files = await prisma.file.findMany({
      where,
      include: { 
        createdBy: { select: { name: true, role: true } },
        approvalLogs: {
          include: { user: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(files);
  } catch (err) {
    console.error('getReports error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.approveReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comments } = req.body; // action: APPROVED, REJECTED, REQUESTED_CHANGES

    const file = await prisma.file.findUnique({ where: { id: Number(id) } });
    if (!file) return res.status(404).json({ message: 'File not found' });

    let newStatus = action;
    let newLevel = file.approvalLevel;

    if (action === 'APPROVED') {
      if (req.user.role === 'TEAM_LEAD') newLevel = 2; // Next is Manager
      else if (req.user.role === 'MANAGER') newLevel = 3; // Next is Admin
      else if (req.user.role === 'ADMIN' || req.user.role === 'MASTER_ADMIN') {
        newLevel = 4; // Fully approved
        newStatus = 'APPROVED';
      } else {
        newStatus = 'PENDING_APPROVAL'; // Remains pending until admin approves
      }
      
      if (newLevel < 4) newStatus = 'PENDING_APPROVAL';
      else newStatus = 'APPROVED';
    }

    const updatedFile = await prisma.file.update({
      where: { id: Number(id) },
      data: { status: newStatus, approvalLevel: newLevel }
    });

    // Log the approval
    await prisma.approvalLog.create({
      data: {
        fileId: updatedFile.id,
        userId: req.user.id,
        action,
        comments
      }
    });

    // Create Notification for the telecaller
    await prisma.notification.create({
      data: {
        userId: file.createdById,
        title: `Report ${action}`,
        message: `Your report ${file.reportNumber} was ${action.toLowerCase()} by ${req.user.role}.`
      }
    });

    res.json({ message: `Report ${action}`, file: updatedFile });
  } catch (err) {
    console.error('approveReport error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};
