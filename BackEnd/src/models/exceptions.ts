import { StatusCode } from "./statusCode";

export class AppException extends Error {
  status: StatusCode;

  constructor(message: string, status: StatusCode) {
    super(message);
    this.status = status;

    // Fix the prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// Examples of specific exceptions you can use in code:
export class ValidationException extends AppException {
  constructor(message: string) {
    super(message, StatusCode.BadRequest);
  }
}

export class AuthException extends AppException {
  constructor(message: string) {
    super(message, StatusCode.Unauthorized);
  }
}

export class ForbiddenException extends AppException {
  constructor(message: string) {
    super(message, StatusCode.Forbidden);
  }
}

export { StatusCode };