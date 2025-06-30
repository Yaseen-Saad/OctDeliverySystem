const requireAdmin = (req, res, next) => {
    if (!req.session.user || !req.session.user.isAdmin) {
        return res.status(403).render('error', {
            message: 'Access denied',
            error: { status: 403, stack: 'You must be an admin to access this page' }
        });
    }
    next();
};

module.exports = { requireAdmin };