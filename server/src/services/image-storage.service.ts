import type { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";

import type {
	InsertImage,
	MethodParams,
	MethodReturn,
	SelectImage,
} from "../types/index.js";

import cloudinary from "../config/cloudinary.config.js";

export interface IImageStorageService {
	delete(data: { url: string }): Promise<void>;
	replace(data: { file: InsertImage; url: string }): Promise<SelectImage>;
	upload(data: { file: InsertImage }): Promise<string>;
}

export class ImageStorageService implements IImageStorageService {
	private readonly provider = cloudinary;

	async delete({
		url,
	}: MethodParams<IImageStorageService, "delete">): MethodReturn<
		IImageStorageService,
		"delete"
	> {
		try {
			const publicId = this._extractPublicId({ url });
			const res = await this.provider.uploader.destroy(`proShop/${publicId}`);

			if (res.result === "not found") {
				throw new Error("File not found");
			} else if (res.result !== "ok") {
				throw new Error("Error while deleting file");
			}
		} catch (error) {
			console.error(error);
			throw new Error(
				`Delete failed: ${
					error instanceof Error ? error.message : "Unknown error"
				}`,
			);
		}
	}

	async replace({
		file,
		url,
	}: MethodParams<IImageStorageService, "replace">): MethodReturn<
		IImageStorageService,
		"replace"
	> {
		const deleteImage = this.delete({ url });
		const uploadImage = this.upload({ file });

		const [_, newImageURL] = await Promise.all([deleteImage, uploadImage]);
		return newImageURL;
	}

	async upload({
		file,
	}: MethodParams<IImageStorageService, "upload">): MethodReturn<
		IImageStorageService,
		"upload"
	> {
		return new Promise((resolve, reject) => {
			this.provider.uploader
				.upload_stream(
					{
						folder: "proShop",
						format: "avif",
						resource_type: "image",
						transformation: {
							aspect_ratio: "16:9",
							crop: "auto",
							gravity: "auto",
							height: 272,
							width: 482,
						},
					},
					(
						error: undefined | UploadApiErrorResponse,
						result?: UploadApiResponse,
					) => {
						if (error) {
							reject(new Error(`Upload failed: ${error.message}`));
						} else if (!result?.secure_url) {
							reject(new Error("No secure URL returned"));
						} else {
							resolve(result.secure_url);
						}
					},
				)
				.end(file.buffer);
		});
	}

	private _extractPublicId({ url }: { url: string }): string {
		const publicId = url.split("/").pop()?.split(".").shift();
		if (!publicId) {
			throw new Error("Invalid URL");
		}

		return publicId;
	}
}
