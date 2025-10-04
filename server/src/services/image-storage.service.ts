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
import {
	InternalError,
	NotFoundError,
	ValidationError,
} from "../errors/index.js";
import { insertImageSchema, selectImageSchema } from "../schemas/index.js";

export interface IImageStorageService {
	delete(data: { url: string }): Promise<void>;
	replace(data: { file: InsertImage; url: string }): Promise<SelectImage>;
	upload(data: { file: InsertImage }): Promise<string>;
}

type StorageResult<T> = Result<T>;

export class ImageStorageService implements IImageStorageService {
	private readonly _provider = cloudinary;

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

			const res = await this._provider.uploader.destroy(
				`proShop/${publicIdResult.data}`,
			);

			if (res.result === "not found") {
				throw new NotFoundError("Image");
			} else if (res.result !== "ok") {
				throw new InternalError("Failed to delete image from storage");
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
		const newImageURL = await this.upload({ file });
		await this.delete({ url });

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

		const promise = await new Promise<SelectImage>((resolve, reject) => {
			const stream = this._provider.uploader.upload_stream(
				DEFAULT_CLOUDINARY_UPLOAD_CONFIG,
				(error, result) => {
					if (error) {
						return reject(
							new InternalError("Image Upload to storage provider failed", {
								cause: error,
							}),
						);
					}

					if (!result) {
						return reject(
							new InternalError("Storage provider did not return a result"),
						);
					}

					return resolve(result.secure_url);
				},
			);

			stream.end(fileValidationResult.data.buffer);
		});

		return promise;
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
