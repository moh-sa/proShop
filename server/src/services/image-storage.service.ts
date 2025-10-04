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
	delete(data: { url: string }): Promise<StorageResult<void>>;
	replace(data: {
		file: InsertImage;
		url: string;
	}): Promise<StorageResult<SelectImage>>;
	upload(data: { file: InsertImage }): Promise<StorageResult<SelectImage>>;
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
				return urlValidationResult;
			}

			const publicIdResult = this._extractPublicId({
				url: urlValidationResult.data,
			});
			if (!publicIdResult.success) {
				return publicIdResult;
			}

			const res = await this._provider.uploader.destroy(
				`proShop/${publicIdResult.data}`,
			);

			if (res.result === "not found") {
				return {
					error: new NotFoundError("Image"),
					success: false,
				};
			} else if (res.result !== "ok") {
				return {
					error: new InternalError("Failed to delete image from storage"),
					success: false,
				};
			}

			return {
				data: undefined,
				success: true,
			};
		} catch (error) {
			console.error(error);
			if (error instanceof Error) {
				return {
					error,
					success: false,
				};
			}

			return {
				error: new InternalError("Something unexpected happened", {
					cause: String(error),
				}),
				success: false,
			};
		}
	}

	async replace({
		file,
		url,
	}: MethodParams<IImageStorageService, "replace">): MethodReturn<
		IImageStorageService,
		"replace"
	> {
		const uploadResult = await this.upload({ file });
		if (!uploadResult.success) {
			return uploadResult;
		}

		const deleteResult = await this.delete({ url });
		if (!deleteResult.success) {
			return deleteResult;
		}

		return {
			data: uploadResult.data,
			success: true,
		};
	}

	async upload({
		file,
	}: MethodParams<IImageStorageService, "upload">): MethodReturn<
		IImageStorageService,
		"upload"
	> {
		const fileValidationResult = this._validateImageFile(file);
		if (!fileValidationResult.success) {
			return fileValidationResult;
		}

		const promise = await new Promise<StorageResult<SelectImage>>((resolve) => {
			const stream = this._provider.uploader.upload_stream(
				DEFAULT_CLOUDINARY_UPLOAD_CONFIG,
				(error, result) => {
					if (error) {
						return resolve({
							error: new InternalError(
								"Image Upload to storage provider failed",
								{
									cause: error,
								},
							),
							success: false,
						});
					}

					if (!result) {
						return resolve({
							error: new InternalError(
								"Storage provider did not return a result",
							),
							success: false,
						});
					}

					return resolve({
						data: result.secure_url,
						success: true,
					});
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
