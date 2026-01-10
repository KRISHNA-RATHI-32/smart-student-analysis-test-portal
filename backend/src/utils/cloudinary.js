import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; // File System to handle temporary files

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        // Upload the file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        // File has been uploaded successfully
        fs.unlinkSync(localFilePath); // Remove the local temporary file
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); // Remove the local temporary file even if upload fails
        return null;
    }
};

export { uploadOnCloudinary };