const debug = require('debug');

// Create namespaced loggers
const loggers = {
  auth: debug('app:auth'),
  db: debug('app:db'),
  items: debug('app:items'),
  restaurants: debug('app:restaurants'),
  server: debug('app:server'),
  error: debug('app:error'),
  payment: debug('app:payment'),
  request: debug('app:request')
};

// Enable all loggers by default in development
if (process.env.NODE_ENV !== 'production') {
  // Enable debug for all namespaces
  debug.enable('app:*');
  
  // Also log to console as fallback
  Object.keys(loggers).forEach(key => {
    const originalLogger = loggers[key];
    loggers[key] = (...args) => {
      console.log(`[${key.toUpperCase()}]`, ...args);
      originalLogger(...args);
    };
  });
}

// Helper to log request details
const logRequest = (req, namespace = 'request') => {
  const logger = loggers[namespace];
  logger(`${req.method} ${req.url}`);
  logger('Headers:', req.headers);
  logger('Body:', req.body);
  logger('Query:', req.query);
  logger('Params:', req.params);
  logger('Session:', req.session);
};

// Helper to log errors with stack trace and request details
const logError = (err, req = null) => {
  loggers.error('Error occurred:', err.message);
  loggers.error('Stack:', err.stack);
  if (req) {
    loggers.error('Request details:');
    logRequest(req, 'error');
  }
  
  // Also log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('[ERROR]', err);
    if (err.stack) {
      console.error(err.stack);
    }
  }
};

// Helper to format error messages for users
const formatErrorMessage = (err) => {
  // Common error types that should be user-friendly
  const commonErrors = {
    ValidationError: 'Please check your input and try again.',
    CastError: 'Invalid data format.',
    MongoError: 'Database operation failed.',
    MongoServerError: 'Database operation failed.',
    Error: 'An unexpected error occurred.'
  };

  // Log the original error
  logError(err);

  if (err.name in commonErrors) {
    return {
      message: commonErrors[err.name],
      details: err.message,
      type: err.name
    };
  }

  // Default error message
  return {
    message: 'Something went wrong. Please try again.',
    details: process.env.NODE_ENV === 'development' ? err.message : null,
    type: err.name || 'Error'
  };
};

module.exports = {
  log: loggers,
  logRequest,
  logError,
  formatErrorMessage
};