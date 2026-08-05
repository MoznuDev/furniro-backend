const successResponse = (res, statusCode, message, data = {}) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const errorResponse = (res, statusCode, message, error = null) => {
  // Server এ পুরো error log করো
  console.error("Error:", error?.stack || error);

  res.status(statusCode).json({
    success: false,
    message,
    //  Production এ error details hide করো
    error: process.env.NODE_ENV === "development" ? error?.message : null,
  });
};

module.exports = { successResponse, errorResponse };