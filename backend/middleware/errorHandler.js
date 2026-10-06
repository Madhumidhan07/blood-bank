module.exports = function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.path}:`, err);
  if (res.headersSent) return next(err);

  const status = Number.isInteger(err.status) ? err.status : 500;
  res.status(status).json({
    error: status >= 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error.'
      : (err.message || 'Internal server error.'),
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
