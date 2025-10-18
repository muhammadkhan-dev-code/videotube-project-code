export const errorHandler = (err, _req, res, _next) => {
  const status = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";
  const errors = err.errors || undefined;

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  return res.status(status).json({
    success: false,
    statusCode: status,
    message,
    errors,
  });
};