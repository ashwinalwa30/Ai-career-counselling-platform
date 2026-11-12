export function success(res, data, message, status = 200) {
  return res.status(status).json({ success: true, data, message });
}

export function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}
