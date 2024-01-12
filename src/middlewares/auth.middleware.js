import { User } from "../models/user.models.js";
import { ApiError } from "../utils/apiErrorHandler.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJwt = asyncHandler(async (req, res, next) => {
  try {
    //get token form cookie or header
    //check token is present or not
    //verify the token with secret key
    //token is verified find the user using verifiedToken id
    //user found
    //then store user in request using req.anyName
    //then call next()

    // req.header("Authorization")   this will send user
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    // use the access token for auth
    const decodeToken = await jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );

    //we set some data while creating tokens
    const user = await User.findById(decodeToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid access token!!");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
