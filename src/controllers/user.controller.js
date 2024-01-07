import asyncHandler from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res, next) => {
  // Your logic to get a user
  // const user = await User.findById(req.params.id);
  // if (!user) {
  //   const error = new Error('User not found');
  //   error.code = 404;
  //   throw error;
  // }

  res.status(200).json({
    success: true,
    message: "User registered successfully",
  });
});

export { registerUser };
