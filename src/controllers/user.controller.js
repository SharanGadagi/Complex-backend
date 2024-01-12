import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrorHandler.js";
import { User } from "../models/user.models.js";
import uploadOnCloudinay from "../utils/cloudinary.js";
uploadOnCloudinay;
import { ApiResponse } from "../utils/apiResponseHandler.js";

//common method for generating both tokens
const generatingAccessAndRefreshTokens = async (userId) => {
  try {
    //find user
    const user = await User.findById(userId);
    console.log("generatingAccessAndRefreshTokens ~ user:", user);
    //use find user methods
    const accessToken = await user.accessTokenGenerate();
    const refreshToken = await user.refreshTokenGenerate();

    //update the refresh token for that user in DB
    user.refreshToken = refreshToken;
    //save using without validation
    await user.save({ validationBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res, next) => {
  //get user details from frontend means request body
  //check the validation if it required
  //check user already registered or not using email,userName etc....
  //if images is required check that also
  //images properly send to cloudinary or any other servers
  //create object for user details
  //remove password and token from response
  //check user created or not in db
  //check response

  const { userName, email, fullName, password } = req.body;

  console.log("req.body", req.body);

  //you an check every filed like this
  // if (userName === "") {
  //   throw new ApiError(400, "Username cannot be empty");
  // }
  //or check at time
  if (
    [userName, email, password, fullName].some((fields) => {
      return fields?.trim() === "";
    })
  ) {
    throw new ApiError(400, "Must filled required fields");
  }

  const alreadyUserExist = await User.findOne({
    //use $ symbol for operator
    $or: [{ email }, { userName }],
  });

  if (alreadyUserExist) {
    throw new ApiError(409, "Username or email already exist");
  }
  //this from multer as middleware

  console.log("req.files", req.files);

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  console.log("registerUser ~ avatarLocalPath:", avatarLocalPath);
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  console.log("registerUser ~ coverImageLocalPath:", coverImageLocalPath);
  //check multer give local path or not
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinay(avatarLocalPath);
  console.log("registerUser ~ avatar:", avatar);
  const coverImage = await uploadOnCloudinay(coverImageLocalPath);
  console.log("registerUser ~ coverImage:", coverImage);

  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }
  //user object
  const user = await User.create({
    userName,
    fullName,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  //remove refresh token and password from response

  const registeredUser = await User.findById(user?._id).select(
    "-password -refreshToken"
  );

  if (!registeredUser) {
    throw new ApiError(500, "Something went wrong please try again later!!");
  }

  return res.status(201).json({
    success: true,
    registeredUser,
    message: "Registration created successfully",
  });

  // return res
  //   .status(201)
  //   .json(
  //     new ApiResponse(200, registeredUser, "Registration created successfully")
  //   );
});

const loginUser = asyncHandler(async (req, res, next) => {
  // get userName or email and password from req body
  //find user using userName or email
  //compare password
  //create access token and refresh token
  //set value in cookies
  //send response

  const { userName, email, password } = req.body;

  if (!userName && !email) {
    throw new ApiError(400, "Username or email is required!!");
  }

  const existUser = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (!existUser) {
    throw new ApiError(404, "User does not exist!!");
  }
  //this from model methods take from find user
  const isPasswordCompare = await existUser.isPasswordCorrect(password);

  if (!isPasswordCompare) {
    throw new ApiError(500, "User credentials invalid!!");
  }
  //tokens from common token generating function
  const { accessToken, refreshToken } = await generatingAccessAndRefreshTokens(
    existUser._id
  );

  console.log("accessToken", accessToken);
  console.log("refreshToken", refreshToken);

  //send res without password and refreshToken
  const loggedInUser = await User.findById(existUser._id).select(
    "-password -refreshToken"
  );
  //set tokens in cookie

  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          refreshToken,
          accessToken,
        },
        "User Login successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  //login user only can logout
  //get id from req.user._id
  // update the refresh token as undefined from db
  //clear cookies

  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logout successfully"));
});

export { registerUser, loginUser, logoutUser };
