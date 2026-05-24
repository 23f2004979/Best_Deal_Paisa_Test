const prisma = require('../config/db');

exports.createIssue = async (req, res) => {
  try {
    const { title, category, description } = req.body;
    const userId = req.user.id;

    // Fetch user with reporting context
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    let assignedSeniorId = null;

    if (user.role === 'TELE_CALLER') {
      assignedSeniorId = user.teamLeadId;
    } else if (user.role === 'TEAM_LEAD') {
      assignedSeniorId = user.managerId;
    } else if (user.role === 'MANAGER') {
      // Find Master Admin
      const admin = await prisma.user.findFirst({
        where: { role: 'MASTER_ADMIN' }
      });
      if (admin) {
        assignedSeniorId = admin.id;
      }
    }

    if (!assignedSeniorId) {
      return res.status(400).json({
        message: 'No supervisor assigned. Please contact the administrator to assign a Team Lead/Manager.'
      });
    }

    const issue = await prisma.issue.create({
      data: {
        title,
        category,
        description,
        reporterId: userId,
        assignedSeniorId,
        status: 'PENDING'
      }
    });

    res.status(201).json(issue);
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ message: 'Failed to create issue.' });
  }
};

exports.getMyIssues = async (req, res) => {
  try {
    const userId = req.user.id;
    const issues = await prisma.issue.findMany({
      where: { reporterId: userId },
      include: {
        resolvedBy: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(issues);
  } catch (error) {
    console.error('Error fetching my issues:', error);
    res.status(500).json({ message: 'Failed to fetch issues.' });
  }
};

exports.getIncomingIssues = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let whereClause = {};

    if (req.user.role === 'ADMIN' || req.user.role === 'MASTER_ADMIN') {
      // Admins see all issues
      whereClause = {};
    } else if (req.user.role === 'MANAGER') {
      // Manager sees issues assigned to themselves OR their Team Leads
      const teamLeads = await prisma.user.findMany({
        where: { managerId: userId, role: 'TEAM_LEAD' },
        select: { id: true }
      });
      const tlIds = teamLeads.map(tl => tl.id);
      whereClause = {
        assignedSeniorId: { in: [userId, ...tlIds] }
      };
    } else {
      // Team Leads see issues assigned to themselves
      whereClause = { assignedSeniorId: userId };
    }

    if (status) {
      whereClause.status = status;
    }

    const issues = await prisma.issue.findMany({
      where: whereClause,
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            empId: true,
            role: true
          }
        },
        resolvedBy: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(issues);
  } catch (error) {
    console.error('Error fetching incoming issues:', error);
    res.status(500).json({ message: 'Failed to fetch incoming issues.' });
  }
};

exports.updateIssueStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!['PENDING', 'IN_PROGRESS', 'RESOLVED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const issue = await prisma.issue.findUnique({
      where: { id: Number(id) }
    });

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found.' });
    }

    // Verify ownership/assignment
    let canResolve = false;
    if (req.user.role === 'ADMIN' || req.user.role === 'MASTER_ADMIN') {
      canResolve = true;
    } else if (req.user.role === 'MANAGER') {
      // Manager can resolve if issue is assigned to them or their Team Leads
      const teamLeads = await prisma.user.findMany({
        where: { managerId: userId, role: 'TEAM_LEAD' },
        select: { id: true }
      });
      const tlIds = teamLeads.map(tl => tl.id);
      if (issue.assignedSeniorId === userId || tlIds.includes(issue.assignedSeniorId)) {
        canResolve = true;
      }
    } else if (issue.assignedSeniorId === userId) {
      canResolve = true;
    }

    if (!canResolve) {
      return res.status(403).json({ message: 'Access denied. You are not authorized to resolve this issue.' });
    }

    const updateData = { status };
    if (status === 'RESOLVED') {
      updateData.resolvedById = userId;
    } else {
      updateData.resolvedById = null;
    }

    const updatedIssue = await prisma.issue.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        resolvedBy: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    res.json(updatedIssue);
  } catch (error) {
    console.error('Error updating issue status:', error);
    res.status(500).json({ message: 'Failed to update status.' });
  }
};
