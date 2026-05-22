const prisma = require('../config/db');

exports.createReport = async (req, res) => {
  try {
    const { title, description, customerDetails, attachmentUrl } = req.body;
    
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
        approvalLevel: 1, // Start at TL
        attachmentUrl
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
    const { title, description, customerDetails, attachmentUrl } = req.body;
    
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
        approvalLevel: newLevel,
        attachmentUrl
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
    const {
      status,
      month,
      year,
      employeeName,
      employeeRole,
      date,
      managerId,
      teamLeadId
    } = req.query;

    let baseWhere = {};
    if (status) baseWhere.status = status;

    if (date) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const startDate = new Date(date + 'T00:00:00');
        const endDate = new Date(date + 'T23:59:59.999');
        baseWhere.createdAt = { gte: startDate, lte: endDate };
      } else if (/^\d{4}-\d{2}$/.test(date)) {
        const [y, m] = date.split('-').map(Number);
        const startDate = new Date(y, m - 1, 1);
        const endDate = new Date(y, m, 0, 23, 59, 59, 999);
        baseWhere.createdAt = { gte: startDate, lte: endDate };
      } else if (/^\d{2}-\d{4}$/.test(date)) {
        const [m, y] = date.split('-').map(Number);
        const startDate = new Date(y, m - 1, 1);
        const endDate = new Date(y, m, 0, 23, 59, 59, 999);
        baseWhere.createdAt = { gte: startDate, lte: endDate };
      } else {
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) {
          const startDate = new Date(parsed);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(parsed);
          endDate.setHours(23, 59, 59, 999);
          baseWhere.createdAt = { gte: startDate, lte: endDate };
        }
      }
    } else if (month && year) {
      const m = Number(month);
      const y = Number(year);
      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 0, 23, 59, 59, 999);
      baseWhere.createdAt = { gte: startDate, lte: endDate };
    }

    const createdByFilter = {};
    if (employeeName) {
      createdByFilter.name = {
        contains: employeeName
      };
    }
    if (employeeRole) {
      createdByFilter.role = employeeRole;
    }
    if (managerId) {
      createdByFilter.managerId = Number(managerId);
    }
    if (teamLeadId) {
      createdByFilter.teamLeadId = Number(teamLeadId);
    }

    if (Object.keys(createdByFilter).length > 0) {
      baseWhere.createdBy = createdByFilter;
    }

    let accessCondition = {};
    if (req.user.role === 'ADMIN' || req.user.role === 'MASTER_ADMIN') {
      accessCondition = {};
    } else if (req.user.role === 'MANAGER') {
      const tlIds = (await prisma.user.findMany({
        where: { managerId: req.user.id },
        select: { id: true }
      })).map(u => u.id);

      const tcIds = (await prisma.user.findMany({
        where: { teamLeadId: { in: tlIds } },
        select: { id: true }
      })).map(u => u.id);

      const allowedCreatorIds = [req.user.id, ...tlIds, ...tcIds];
      accessCondition = {
        createdById: { in: allowedCreatorIds }
      };
    } else if (req.user.role === 'TEAM_LEAD') {
      const tcIds = (await prisma.user.findMany({
        where: { teamLeadId: req.user.id },
        select: { id: true }
      })).map(u => u.id);

      const allowedCreatorIds = [req.user.id, ...tcIds];
      accessCondition = {
        OR: [
          { createdById: { in: allowedCreatorIds } },
          { shares: { some: { sharedWithId: req.user.id } } }
        ]
      };
    } else {
      accessCondition = {
        OR: [
          { createdById: req.user.id },
          { shares: { some: { sharedWithId: req.user.id } } }
        ]
      };
    }

    const queryWhere = {
      AND: [
        accessCondition,
        baseWhere
      ]
    };

    const files = await prisma.file.findMany({
      where: queryWhere,
      include: { 
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true,
            teamLeadId: true,
            teamLead: {
              select: {
                id: true,
                name: true
              }
            },
            managerId: true,
            manager: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        approvalLogs: {
          include: { user: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'desc' }
        },
        shares: {
          select: { sharedWithId: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    let enrichedFiles = [];
    if (files.length > 0) {
      enrichedFiles = files.map(file => {
        return {
          id: file.id,
          reportNumber: file.reportNumber,
          title: file.title,
          description: file.description,
          customerDetails: file.customerDetails,
          status: file.status,
          createdById: file.createdById,
          approvalLevel: file.approvalLevel,
          attachmentUrl: file.attachmentUrl,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt,
          createdBy: file.createdBy,
          approvalLogs: file.approvalLogs,
          shares: file.shares,
          creatorDetails: {
            id: file.createdBy.id,
            name: file.createdBy.name,
            role: file.createdBy.role,
            assignedTLId: file.createdBy.teamLeadId,
            assignedTLName: file.createdBy.teamLead ? file.createdBy.teamLead.name : null,
            assignedManagerId: file.createdBy.managerId,
            assignedManagerName: file.createdBy.manager ? file.createdBy.manager.name : null
          }
        };
      });
    }

    res.json(enrichedFiles);
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

exports.bulkShareReports = async (req, res) => {
  try {
    const { fileIds, sharedWithIds } = req.body;

    if (!Array.isArray(fileIds) || !Array.isArray(sharedWithIds) || fileIds.length === 0 || sharedWithIds.length === 0) {
      return res.status(400).json({ message: 'Invalid input. fileIds and sharedWithIds must be non-empty arrays.' });
    }

    const currentUserId = req.user.id;

    // 1. Fetch reports to verify user has access to share them
    const files = await prisma.file.findMany({
      where: { id: { in: fileIds.map(Number) } },
      include: { shares: true }
    });

    if (files.length === 0) {
      return res.status(404).json({ message: 'No reports found for the provided IDs.' });
    }

    // Verify sharing permission for each file
    for (const file of files) {
      let hasAccess = false;
      if (req.user.role === 'ADMIN' || req.user.role === 'MASTER_ADMIN') {
        hasAccess = true;
      } else if (file.createdById === currentUserId) {
        hasAccess = true;
      } else if (file.shares.some(s => s.sharedWithId === currentUserId)) {
        hasAccess = true;
      } else if (req.user.role === 'TEAM_LEAD') {
        const sub = await prisma.user.findFirst({
          where: { id: file.createdById, teamLeadId: currentUserId }
        });
        if (sub && file.approvalLevel >= 1) {
          hasAccess = true;
        }
      } else if (req.user.role === 'MANAGER') {
        const tlIds = (await prisma.user.findMany({
          where: { managerId: currentUserId },
          select: { id: true }
        })).map(u => u.id);

        const tcIds = (await prisma.user.findMany({
          where: { teamLeadId: { in: tlIds } },
          select: { id: true }
        })).map(u => u.id);

        const allowedCreatorIds = [currentUserId, ...tlIds, ...tcIds];
        if (allowedCreatorIds.includes(file.createdById) && file.approvalLevel >= 1) {
          hasAccess = true;
        }
      }

      if (!hasAccess) {
        return res.status(403).json({ message: `You do not have permission to share report ${file.reportNumber}.` });
      }
    }

    const targetUserIds = sharedWithIds.map(Number).filter(id => id !== currentUserId);

    if (targetUserIds.length === 0) {
      return res.status(400).json({ message: 'Cannot share reports with yourself.' });
    }

    // Prepare shares array
    const shareData = [];
    for (const fileId of fileIds.map(Number)) {
      for (const sharedWithId of targetUserIds) {
        shareData.push({
          fileId,
          sharedWithId,
          sharedById: currentUserId
        });
      }
    }

    // Create the shares
    await prisma.fileShare.createMany({
      data: shareData,
      skipDuplicates: true
    });

    // Create notifications for the recipients
    for (const sharedWithId of targetUserIds) {
      const fileCount = fileIds.length;
      const message = fileCount === 1 
        ? `${req.user.name} shared a report with you.`
        : `${req.user.name} shared ${fileCount} reports with you.`;
      
      await prisma.notification.create({
        data: {
          userId: sharedWithId,
          title: 'Reports Shared',
          message
        }
      });
    }

    res.json({ message: `Successfully shared ${fileIds.length} reports with ${targetUserIds.length} users.` });
  } catch (err) {
    console.error('bulkShareReports error:', err);
    res.status(500).json({ message: 'Server error while sharing reports.' });
  }
};
