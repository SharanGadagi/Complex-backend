import dotenv from "dotenv";
import express from "express";
import connectDb from "./db/database.js";

//path must be add for consistency
dotenv.config({
  path: "./.env",
});
//connect database
connectDb();
