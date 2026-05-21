const jwt = require('jsonwebtoken');

// Attach decoded user to req.user on every protected route
function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ message: 'No token provided.' });

  try {
    const token = header.split(' ')[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
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
