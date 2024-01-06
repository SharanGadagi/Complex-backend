//use Error for handling error
//this only handling the error not response
export class ApiError extends Error {
  //initialize with constructor
  constructor(
    statuscode,
    message = "Something went wrong!!",
    //[] for passing multiple error
    errors = [],
    stack = ""
  ) {
    //override the properties or add
    super(message);
    (this.statuscode = statuscode),
      (this.data = null),
      (this.errors = errors),
      (this.success = false),
      (this.message = message);

    //   for tracking the error use stack
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
