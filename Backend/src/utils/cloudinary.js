import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async (localPath) => {
    try {
        if (!localPath) return null
        const response = await cloudinary.uploader.upload(localPath, {
                resource_type: "auto"
        })
        // Remove local file after successful upload
        fs.unlinkSync(localPath)
        return response;

    }catch(error)
    {
        console.error("Error uploading file to Cloudinary:", error);

        fs.unlink(localPath, (err) => {
            if (err) {
                console.error("Failed to delete local file:", err);
            } else {
                console.log("Local file deleted successfully");
            }
        });

        return null;
    }

}

const deleteFromCloudinary = async (publicUrl) => {
    try {
        if (!publicUrl) return null;

        // Extract public_id from Cloudinary URL
        // URL format: https://res.cloudinary.com/<cloud>/image/upload/v123/<public_id>.<ext>
        const parts = publicUrl.split("/");
        const fileWithExt = parts[parts.length - 1];
        const publicId = fileWithExt.split(".")[0];

        // Determine resource type from URL
        let resourceType = "image";
        if (publicUrl.includes("/video/upload/")) {
            resourceType = "video";
        } else if (publicUrl.includes("/raw/upload/")) {
            resourceType = "raw";
        }

        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });

        return result;
    } catch (error) {
        console.error("Error deleting from Cloudinary:", error);
        return null;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary }