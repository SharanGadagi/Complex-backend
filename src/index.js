import dotenv from "dotenv";
import app from "./app.js";
import connectDb from "./db/database.js";

//path must be add for consistency
dotenv.config({
  path: "./.env",
});
//connect database
connectDb()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(
        `Server running at port: http://localhost:${process.env.PORT || 8000}`
      );
    });
  })
  .catch((error) => {
    console.log("Mongo DB failed !!!", error);
  });
