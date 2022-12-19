const notFound = (req, res, next) => {
  const error = new Error(`Not Found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const error = res.statusCode === 200 ? 500 : res.statusCode;
  console.log(res);
  res.status(error);
  res.json({
    message: err.message,
    stack: err.stack,
  });
};

export { notFound, errorHandler };