export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export const TOO_MANY_AUTH_ATTEMPTS_MESSAGE = "Demasiados intentos. Intente de nuevo más tarde.";

export class RateLimitedError extends AppError {
  constructor(
    public readonly retryAfterSeconds: number,
    message: string = TOO_MANY_AUTH_ATTEMPTS_MESSAGE
  ) {
    super(message, 429);
  }
}
