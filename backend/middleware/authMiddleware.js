const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: 'Server authentication is not configured.' });

  const authHeader = req.get('authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ error: 'Access denied. Please log in.' });

  try {
    req.user = jwt.verify(match[1], secret);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
};
