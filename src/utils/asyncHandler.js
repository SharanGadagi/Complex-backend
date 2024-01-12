//or use like this using async
// const asyncHandler = (requestFunction) => async (req, res, next) => {
//   try {
//     //this is the series err req res next
//     await requestFunction(req, res, next);
//   } catch (error) {
//     res.status(error.code).json({
//       success: false,
//       message: error.message || "Something went wrong!!",
//     });
//   }
// };
// export default asyncHandler;

const asyncHandler = (requestFunction) => async (req, res, next) => {
  try {
    // Executes the provided asynchronous function (requestFunction)
    await requestFunction(req, res, next);
  } catch (error) {
    // Handles errors caught during execution
    const statusCode = error.code || 500; // Default status code 500 for unhandled errors
    const errorMessage = error.message || "Something went wrong!";

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
    });
  }
};
export default asyncHandler;
