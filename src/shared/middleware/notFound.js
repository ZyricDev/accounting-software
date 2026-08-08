import AppError from "../errors/AppError.js";

const notFoundHandler = (req, res, next) => {
  if (req.accepts("json") && req.originalUrl.startsWith("/api")) {
    throw new AppError(`Cannot find ${req.originalUrl} on this server!`, 404);
  }

  res.status(404).type("txt").send("Not Found");
};

export default notFoundHandler;
