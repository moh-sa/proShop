import type { UploadApiOptions } from "cloudinary";
import { v2 as cloudinary } from "cloudinary";

import { env } from "./env.js";

cloudinary.config({
	api_key: env.CLOUDINARY_API_KEY,
	api_secret: env.CLOUDINARY_API_SECRET,
	cloud_name: env.CLOUDINARY_CLOUD_NAME,
});

export default cloudinary;

const DEFAULT_CLOUDINARY_TRANSFORMATION: UploadApiOptions["transformation"] = {
	aspect_ratio: "16:9",
	crop: "auto",
	gravity: "auto",
	height: 272,
	width: 482,
};

export const DEFAULT_CLOUDINARY_UPLOAD_CONFIG: UploadApiOptions = {
	folder: "proShop",
	format: "avif",
	resource_type: "image",
	transformation: DEFAULT_CLOUDINARY_TRANSFORMATION,
};
