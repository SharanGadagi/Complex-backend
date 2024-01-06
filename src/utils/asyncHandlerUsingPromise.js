//using promises
const promiseAsyncHandler = (requestFunction) => {
  (req, res, next) => {
    //use the promise
    Promise.resolve(requestFunction(req, res, next)).catch((error) => {
      next(err);
    });
  };
};

export default promiseAsyncHandler;
