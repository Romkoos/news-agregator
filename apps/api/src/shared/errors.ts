export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}

export class EmailAlreadyExistsError extends DomainError {}
export class InvalidCredentialsError extends DomainError {}
export class InvalidTokenError extends DomainError {}
export class NotFoundError extends DomainError {}
export class ForbiddenError extends DomainError {}
export class ValidationError extends DomainError {}
