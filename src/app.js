import express from "express";
const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";

//connect with frontend
//options are access the frontend which url
//CORS_ORIGIN=* means allow for all frontend url or set specific url
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
//read the data from form or json anything and set the each data limit
app.use(
  express.json({
    limit: "20kb",
  })
);
//read data from url
app.use(
  express.urlencoded({
    extended: true,
  })
);
//curd operation with cookie data
app.use(cookieParser());

export default app;
