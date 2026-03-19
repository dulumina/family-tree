const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(requiredRole) {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token tidak ditemukan' });
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload;
      if (requiredRole) {
        const levels = { viewer: 0, editor: 1, admin: 2 };
        if (levels[payload.role] < levels[requiredRole])
          return res.status(403).json({ error: 'Akses ditolak' });
      }
      next();
    } catch {
      res.status(401).json({ error: 'Token tidak valid' });
    }
  };
};
