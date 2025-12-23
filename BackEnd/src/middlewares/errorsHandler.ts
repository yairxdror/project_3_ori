import { NextFunction, Request, Response } from "express";
import { AppException } from "../models/exceptions";
import { StatusCode } from "../models/statusCode";
import { logIt } from "../helpers/logHelpers";

export function errorHandler(
  error: any,
  request: Request,
  response: Response,
  next: NextFunction
) {
  // If a response has already been sent, don't attempt to modify it
  if (response.headersSent) {
    return next(error);
  }

  // Known application error
  if (error instanceof AppException) {
    return response
      .status(error.status)
      .json({ message: error.message });
  }

  // Unknown error
  const msg = `Unknown error. message: ${error?.message}.\nTB:\n${error?.stack}`;
  logIt(msg, true);

  return response
    .status(StatusCode.ServerError)
    .json({ message: "Internal Server Error" });
}

export default errorHandler;