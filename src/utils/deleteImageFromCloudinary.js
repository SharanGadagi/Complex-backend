import { v2 as cloudinary } from "cloudinary";

export const deleteFromCloudinary = async (imageId) => {
  console.log("deleteFromCloudinary ~ imageId:", imageId);
  try {
    cloudinary.config({
      cloud_name: "shaangadagi",
      api_key: "283361743496748",
      api_secret: "zppa2fxr6X33dw9IPv46j7sWY4M",
    });

    // Delete the image using its public ID
    const deletedImage = await cloudinary.uploader.destroy(imageId);

    console.log(`Image with public ID ${imageId} deleted from Cloudinary`);
  } catch (error) {
    console.error(`Error deleting image from Cloudinary: ${error.message}`);
    throw new ApiError(500, "Internal Server Error");
  }
};
