// Require login middleware
const requireLogin = (req, res, next) => {
    console.log('[DEBUG] requireLogin - Session:', {
        exists: !!req.session,
        user: req.session?.user,
        id: req.sessionID
    });

    if (!req.session || !req.session.user) {
        console.log('[DEBUG] No session or user, redirecting to login');
        // Store the requested URL to redirect back after login
        if (req.session) {
            req.session.returnTo = req.originalUrl;
            console.log('[DEBUG] Stored returnTo:', req.originalUrl);
        }
        return res.redirect('/login');
    }
    console.log('[DEBUG] User authenticated, proceeding');
    next();
};

// Require admin middleware
const requireAdmin = (req, res, next) => {
    console.log('[DEBUG] requireAdmin - Session:', {
        exists: !!req.session,
        user: req.session?.user,
        isAdmin: req.session?.user?.isAdmin,
        id: req.sessionID
    });

    if (!req.session || !req.session.user || !req.session.user.isAdmin) {
        console.log('[DEBUG] Not admin, access denied');
        return res.status(403).render('error', {
            message: 'Access Denied',
            error: { status: 403, stack: 'You do not have permission to access this page.' }
        });
    }
    console.log('[DEBUG] Admin access granted');
    next();
};

// Add user to res.locals for all views
const addUserToLocals = (req, res, next) => {
    console.log('[DEBUG] addUserToLocals - Session:', {
        exists: !!req.session,
        user: req.session?.user,
        id: req.sessionID
    });

    // Check if session exists
    if (req.session) {
        res.locals.user = req.session.user || null;
        console.log('[DEBUG] User added to locals:', res.locals.user);
        
        // Save session if modified
        if (req.session.modified) {
            console.log('[DEBUG] Session modified, saving');
            req.session.save(err => {
                if (err) {
                    console.error('[DEBUG] Session save error:', err);
                }
                next();
            });
            return;
        }
    } else {
        console.log('[DEBUG] No session, user set to null');
        res.locals.user = null;
    }
    next();
};

module.exports = {
    requireLogin,
    requireAdmin,
    addUserToLocals
};