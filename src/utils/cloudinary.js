import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

//note process is=====>
//* we can't upload file directly to clodinary or any server
//we first upload file in temporary in one folder then pass that link to cloudinary then they give us url

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinay = async (localFile) => {
  try {
    //local file not found
    if (!localFile) null;
    //file found then upload on cloudinary
    const response = await cloudinary.uploader.upload(localFile, {
      //which format file
      resource_type: "auto",
    });
    console.log("uploadOnCloudinay ~ response:", response);
    console.log("uploadOnCloudinay ~ file url:", response.url);

    return response;
  } catch (error) {
    //any problem in uploading
    //then remove local file from server it kept as temporary file
    fs.unlinkSync(localFile);
    return null;
  }
};

export default uploadOnCloudinay;
