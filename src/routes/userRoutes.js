import express from "express";
import {
  changePassword,
  currentLoggedInUserDetails,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAvatar,
  updateCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = express.Router();

//use images middleware here it's better
router.route("/register").post(
  //this function how many images are needed for ex avatar, coverImage etc....
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJwt, changePassword);
router.route("/login-user").get(verifyJwt, currentLoggedInUserDetails);
router
  .route("/update-avatar/:id")
  .patch(verifyJwt, upload.single("avatar"), updateAvatar);
router
  .route("/update-coverImage/:id")
  .patch(verifyJwt, upload.single("coverImage"), updateCoverImage);

export default router;
