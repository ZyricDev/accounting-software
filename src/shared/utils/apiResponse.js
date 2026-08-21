export const sendSuccess = (
  res,
  message = null,
  data = null,
  statusCode = 200,
) => {
  return res.status(statusCode).json({
    status: "success",
    message,
    data,
  });
};

export const generatePaginationData = (data) => {
  return {
    page: data.page,
    limit: data.limit,
    total: data.total,
    totalPages: Math.ceil(data.total / data.limit),
  };
};
