class BaseError extends Error {
  constructor (message, name = 'Error', httpStatus = 400) {
    super()
    this.message = message
    this.name = name
    this.httpStatus = httpStatus
  }

  getHttpStatus () {
    return this.httpStatus
  }
}

class UnknownIdentityError extends BaseError {
  constructor () {
    super('Unknown identity!', 'UnknownIdentityError', 400)
  }
}

module.exports = {
  BaseError,
  UnknownIdentityError
}
