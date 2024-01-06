import mongoose from "mongoose";
import jwt from "json-web-token";
import bcrypt from "bcrypt";
import { emit } from "nodemon";

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      trim: true,
      lowerCase: true,
      unique: true,
      //index for searching this field for good
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      //from cloudinary url
      type: String,
      required: true,
    },
    avatar: {
      //from cloudinary url
      type: String,
    },
    watchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    refreshToke: {
      type: String,
    },
  },
  { timestamps: true }
);

//middleware use hooks
// * for encrypt the password before save
//don't use arrow function bcoz we want this key word
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    await bcrypt.hash(this.password, 10);
  }
  next();
});

// also use methods use can use this method in any function controllers or create common function in utils then use

// * compare the password with encrypted password
userSchema.methods.isPasswordCorrect = async function (password) {
  // password is user typing password it returns true or false
  return await bcrypt.compare(password, this.password);
};

//# access token has less expire time than refresh token
//* for access token
userSchema.methods.accessTokenGenerate = async function () {
  return await jwt.sign(
    //payload,secret,expire
    {
      _id: this._id,
      email: this.email,
      userName: this.userName,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expire: process.env.ACCESS_TOKEN_EXPIRE,
    }
  );
};

//* for refresh token
//this token has less payload
userSchema.methods.refreshTokenGenerate = async function () {
  return await bcrypt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expire: process.env.REFRESH_TOKEN_eXPIRE,
    }
  );
};

export const User = mongoose.model("User", userSchema);
