import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrorHandler.js";
import { User } from "../models/user.models.js";
import uploadOnCloudinay from "../utils/cloudinary.js";
uploadOnCloudinay;
import { ApiResponse } from "../utils/apiResponseHandler.js";
import jwt from "jsonwebtoken";
import { deleteFromCloudinary } from "../utils/deleteImageFromCloudinary.js";
import { extractPublicIdFromUrl } from "../utils/extractCloudinaryId.js";

//common method for generating both tokens
const generatingAccessAndRefreshTokens = async (userId) => {
  try {
    //find user
    const user = await User.findById(userId);
    console.log("generatingAccessAndRefreshTokens ~ user:", user);
    //use find user methods
    const accessToken = await user.accessTokenGenerate();
    console.log("generatingAccessAndRefreshTokens ~ accessToken:", accessToken);
    const refreshToken = await user.refreshTokenGenerate();
    console.log(
      "generatingAccessAndRefreshTokens ~ refreshToken:",
      refreshToken
    );

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

//note :::::: refresh and access token
//access token have less time to expires then use the refresh token again generate a access token

const refreshAccessToken = asyncHandler(async (req, res, next) => {
  //take refresh token from cookie or body
  //decode the taken refresh token (take _id from decode token )
  //find the user using _id
  //compare user.refreshToken and taken refresh
  //generate both tokens again and set this generate refresh token in user.refreshToken from DB

  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;
    console.log(
      "refreshAccessToken ~ incomingRefreshToken:",
      incomingRefreshToken
    );

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized  request");
    }
    const decodeRefreshToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    console.log("refreshAccessToken ~ decodeRefreshToken:", decodeRefreshToken);

    const user = await User.findById(decodeRefreshToken._id);
    console.log("refreshAccessToken ~ user:", user);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used!!");
    }

    const { accessToken, refreshToken } =
      await generatingAccessAndRefreshTokens(user._id);
    console.log("refreshAccessToken ~ newRefreshToken:", refreshToken);
    console.log("refreshAccessToken ~ accessToken:", accessToken);
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
            accessToken,
            refreshToken,
          },
          "Access token refreshed"
        )
      );
  } catch (error) {
    console.log("refreshAccessToken ~ error:", error);
    throw new ApiError(401, error.message || "Something went wrong!!");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  //taken oldPassword,newPassword
  //find login user details
  //compare the oldPassword with DB password
  //then update password

  // try {
  const { oldPassword, newPassword } = req.body;

  // Validate that newPassword meets your password policy

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  // Set and hash the new password
  user.password = newPassword;
  await user.save({ validationBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
  // } catch (error) {
  //   console.log("changePassword ~ error:", error);
  // }
});

const currentLoggedInUserDetails = asyncHandler(async (req, res) => {
  //login user only

  // if (!req.user) {
  //   throw new ApiError(401, "Unauthorized - User not logged in");
  // }

  const user = await User.findById(req.user._id).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // You might want to clear sensitive information before sending the response
  user.sensitiveInfo = undefined;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user,
        "Current logged-in user details fetched successfully"
      )
    );
});

const updateAvatar = asyncHandler(async (req, res, next) => {
  //take file from multer
  //upload to cloudinary
  //delete prev avatar from cloudinary
  //update the avatar

  const avatarLocalPath = req.file.path;
  console.log("updateAvatar ~ avatarLocalPath:", avatarLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const uploadAvatar = await uploadOnCloudinay(avatarLocalPath);
  console.log("updateAvatar ~ uploadAvatar:", uploadAvatar);

  if (!uploadAvatar) {
    throw new ApiError(400, "Error while uploading avatar");
  }

  // Get the current user data
  const currentUser = await User.findById(req.user._id);
  console.log("updateAvatar ~ currentUser:", currentUser);

  // Extract public ID from the current avatar URL
  const currentAvatarPublicId = extractPublicIdFromUrl(currentUser.avatar);
  console.log("updateAvatar ~ currentAvatarPublicId:", currentAvatarPublicId);

  // Delete the previous avatar from Cloudinary
  if (currentAvatarPublicId) {
    await deleteFromCloudinary(currentAvatarPublicId);
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: uploadAvatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const updateCoverImage = asyncHandler(async (req, res, next) => {
  // Take file from multer
  // Upload to Cloudinary
  // Update the CoverImage

  const coverImageLocalPath = req.file.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missing");
  }

  const uploadCoverImage = await uploadOnCloudinay(coverImageLocalPath);

  if (!uploadCoverImage) {
    throw new ApiError(400, "Error while uploading Cover image");
  }

  // Get the current user data
  const currentUser = await User.findById(req.user._id);

  // Extract public ID from the current coverImage URL
  const currentCoverImagePublicId = extractPublicIdFromUrl(
    currentUser.coverImage
  );

  // Delete the previous coverImage from Cloudinary
  if (currentCoverImagePublicId) {
    await deleteFromCloudinary(currentCoverImagePublicId);
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: uploadCoverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

const getChannelProfile = asyncHandler(async (req, res, next) => {
  const { userName } = req.params;

  if (!userName.trim()) {
    throw new ApiError(400, "UserName is missing");
  }

  const channel = await User.aggregate([
    {
      //1st pipeLine to find user
      $match: {
        userName: userName.toLowerCase(),
      },
    },
    {
      //2nd pipe join fields from another model
      //for my channel subscribers
      $lookup: {
        //model name
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      //3rd pipe join fields from another model
      //for i subscribed to another channels

      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      //add new fields to hit this end point
      $addFields: {
        subscribersCount: {
          // use as field from $lookup
          $size: "$subscribers",
        },
        channelSubscribedTosCount: {
          // use as field from $lookup
          $size: "$subscribedTo",
        },

        isSubscribed: {
          //means i some one visit my channel that user is subscribed or not

          $cond: {
            if: {
              $in: [req.user._id, "$subscribers.subscriber"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      //needed values only send
      //need use 1
      $project: {
        fullName: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        channelSubscribedTosCount: 1,
        isSubscribed: 1,
      },
    },
  ]);
  console.log("getChannelProfile ~ channel:", channel);
  if (channel?.length) {
    throw new ApiError(404, "Channel doesn't exist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel, "Channel profile fetched successfully")
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  currentLoggedInUserDetails,
  updateAvatar,
  updateCoverImage,
};
