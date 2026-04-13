const DEFAULT_ADMIN_EMAIL = 'admin@flashcards.com';

const parseAdminEmails = () => {
  const raw = process.env.ADMIN_EMAILS;
  if (raw && raw.trim()) {
    return raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  }
  return [DEFAULT_ADMIN_EMAIL.toLowerCase()];
};

const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  if (req.user.isAdmin) {
    return next();
  }
  const allowed = parseAdminEmails();
  const email = (req.user.email || '').toLowerCase();
  if (email && allowed.includes(email)) {
    return next();
  }
  return res.status(403).json({ message: 'Admin access required' });
};

export { adminOnly, parseAdminEmails };
