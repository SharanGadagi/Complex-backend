//or use like this using async
const asyncHandler = (requestFunction) => async (req, res, next) => {
  try {
    //this is the series err req res next
    await requestFunction(req, res, next);
  } catch (error) {
    res.status(error.code).json({
      success: false,
      message: error.message || "Something went wrong!!",
    });
  }
};
export default asyncHandler;
