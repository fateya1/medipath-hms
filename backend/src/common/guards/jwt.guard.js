// backend/src/common/guards/jwt.guard.js

import jwt from 'jsonwebtoken';

/**
 * authenticate — verifies JWT from Authorization: Bearer <token>
 * Attaches decoded payload to req.user
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized', message: 'Token expired' });
    }
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
  }
}

/**
 * authorize — role-based access control
 * Usage: authorize('ADMIN', 'DOCTOR')
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access restricted to: ${roles.join(', ')}`,
      });
    }
    next();
  };
}

/**
 * optionalAuth — attaches user if token is present, does not block if missing
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    } catch (_) {
      // ignore invalid token in optional mode
    }
  }
  next();
}
