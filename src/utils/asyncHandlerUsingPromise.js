//using promises
const promiseAsyncHandler = (requestFunction) => {
  return (req, res, next) => {
    //use the promise
    Promise.resolve(requestFunction(req, res, next)).catch((error) => {
      next(err);
    });
  };
};

export default promiseAsyncHandler;
