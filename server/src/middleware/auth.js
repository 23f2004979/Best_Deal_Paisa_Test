const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

// Attach decoded user to req.user on every protected route
async function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ message: 'No token provided.' });

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    // Invalidate session if user status changed or password was reset
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || user.status !== 'ACTIVE' || user.passwordHash !== decoded.passwordHash) {
      return res.status(401).json({ message: 'Session expired or account is not active.' });
    }

    req.user = {
      id: user.id,
      name: user.name,
      empId: user.empId,
      email: user.email,
      role: user.role
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}
function verifyRole(roles) {
  return (req, res, next) => {
    if (!req.user || (!roles.includes(req.user.role) && req.user.role !== 'MASTER_ADMIN')) {
      return res.status(403).json({ message: 'Forbidden. Role not authorized.' });
    }
    next();
  };
}

module.exports = { verifyToken, verifyRole };
