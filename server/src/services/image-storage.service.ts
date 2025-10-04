import type { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";

import type {
	InsertImage,
	MethodParams,
	MethodReturn,
	Result,
	SelectImage,
} from "../types/index.js";

import cloudinary, {
	DEFAULT_CLOUDINARY_UPLOAD_CONFIG,
} from "../config/cloudinary.config.js";
import { ValidationError } from "../errors/index.js";
import { insertImageSchema, selectImageSchema } from "../schemas/index.js";

export interface IImageStorageService {
	delete(data: { url: string }): Promise<void>;
	replace(data: { file: InsertImage; url: string }): Promise<SelectImage>;
	upload(data: { file: InsertImage }): Promise<string>;
}

type StorageResult<T> = Result<T>;

export class ImageStorageService implements IImageStorageService {
	private readonly provider = cloudinary;

	async delete({
		url,
	}: MethodParams<IImageStorageService, "delete">): MethodReturn<
		IImageStorageService,
		"delete"
	> {
		try {
			const urlValidationResult = this._validateImageUrl(url);
			if (!urlValidationResult.success) {
				throw urlValidationResult.error;
			}

			const publicIdResult = this._extractPublicId({
				url: urlValidationResult.data,
			});
			if (!publicIdResult.success) {
				throw publicIdResult.error;
			}

			const res = await this.provider.uploader.destroy(
				`proShop/${publicIdResult.data}`,
			);

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
		const fileValidationResult = this._validateImageFile(file);
		if (!fileValidationResult.success) {
			throw fileValidationResult.error;
		}

		return new Promise((resolve, reject) => {
			this.provider.uploader
				.upload_stream(
					DEFAULT_CLOUDINARY_UPLOAD_CONFIG,
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
				.end(fileValidationResult.data.buffer);
		});
	}

	private _extractPublicId({ url }: { url: string }): StorageResult<string> {
		// Extracts the public ID from a URL
		const regex = /\/([^/]+)\.(avif)(?:\?|#|$)/i;
		const match = url.match(regex);
		const publicId = match ? match[1] : null;
		if (!publicId) {
			return {
				error: new ValidationError("Invalid URL format"),
				success: false,
			};
		}

		return {
			data: publicId,
			success: true,
		};
	}

	private _validateImageFile(file: InsertImage): StorageResult<InsertImage> {
		const result = insertImageSchema.safeParse(file);
		if (!result.success) {
			return {
				error: new ValidationError("Invalid image file data", {
					cause: result.error,
				}),
				success: false,
			};
		}

		return {
			data: result.data,
			success: true,
		};
	}

	private _validateImageUrl(url: string): StorageResult<string> {
		const result = selectImageSchema.safeParse(url);
		if (!result.success) {
			return {
				error: new ValidationError("Invalid Image URL", {
					cause: result.error,
				}),
				success: false,
			};
		}

		return {
			data: result.data,
			success: true,
		};
	}
}
