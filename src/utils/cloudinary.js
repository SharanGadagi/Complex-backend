import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

//note process is=====>
//* we can't upload file directly to clodinary or any server
//we first upload file in temporary in one folder then pass that link to cloudinary then they give us url

cloudinary.config({
  cloud_name: "shaangadagi",
  api_key: "283361743496748",
  api_secret: "zppa2fxr6X33dw9IPv46j7sWY4M",
});

const uploadOnCloudinay = async (localFile) => {
  console.log("uploadOnCloudinay ~ localFile:", localFile);
  try {
    //local file not found
    if (!localFile) {
      console.log("1111111");
      return null;
    }
    //file found then upload on cloudinary
    console.log("2222222222");

    const response = await cloudinary.uploader.upload(localFile, {
      //which format file
      resource_type: "auto",
    });
    console.log("uploadOnCloudinay ~ response:", response);
    console.log("uploadOnCloudinay ~ file url:", response.url);
    fs.unlinkSync(localFile);
    return response;
  } catch (error) {
    console.log("uploadOnCloudinay ~ error:", error);
    //any problem in uploading
    //then remove local file from server it kept as temporary file

    fs.unlinkSync(localFile);
    return null;
  }
};

export default uploadOnCloudinay;
