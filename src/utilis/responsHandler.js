const successResponse = (
  res,
  statusCode = 200,
  message = "Success",
  data = {}
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const errorResponse = (
  res,
  statusCode = 500,
  message = "Error occurred",
  error = null
) => {

  console.log("Received Error:", error);

  return res.status(statusCode).json({
    success: false,
    message,
    error:
      typeof error === "string"
        ? error
        : error?.message || null,
  });
};

module.exports = {
  successResponse,
  errorResponse,
};