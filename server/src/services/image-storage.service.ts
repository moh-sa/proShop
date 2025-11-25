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
import { getLoggerFromContext } from "../utils/index.js";

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
		const logger = this._getLogger({ method: "delete" });

		logger.debug({ url }, "Deleting image");

		try {
			const urlValidationResult = this._validateImageUrl(url);
			if (!urlValidationResult.success) {
				logger.warn(
					{ error: urlValidationResult.error, url },
					"Invalid image URL provided",
				);
				return urlValidationResult;
			}

			const publicIdResult = this._extractPublicId({
				url: urlValidationResult.data,
			});
			if (!publicIdResult.success) {
				logger.warn(
					{ error: publicIdResult.error, url },
					"Invalid public ID found in image URL",
				);
				return publicIdResult;
			}

			logger.info(
				{ publicId: publicIdResult.data },
				"Deleting image from storage",
			);

			const res = await this._provider.uploader.destroy(
				`proShop/${publicIdResult.data}`,
			);

			if (res.result === "not found") {
				logger.error(
					{ publicId: publicIdResult.data },
					"Image not found in storage",
				);

				return {
					error: new NotFoundError("Image"),
					success: false,
				};
			} else if (res.result !== "ok") {
				logger.error(
					{
						publicId: publicIdResult.data,
						result: res.result,
					},
					"Failed to delete image from storage",
				);

				return {
					error: new InternalError("Failed to delete image from storage"),
					success: false,
				};
			}

			logger.info(
				{ publicId: publicIdResult.data },
				"Image deleted successfully",
			);
			return {
				data: undefined,
				success: true,
			};
		} catch (error) {
			logger.error(
				{ error, url },
				"Unexpected error occurred while deleting image from storage",
			);

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
		const logger = this._getLogger({ method: "replace" });
		logger.debug({ oldUrl: url }, "Replacing image");

		const uploadResult = await this.upload({ file });
		if (!uploadResult.success) {
			return uploadResult;
		}

		const deleteResult = await this.delete({ url });
		if (!deleteResult.success) {
			return deleteResult;
		}

		logger.info(
			{ newUrl: uploadResult.data, oldUrl: url },
			"Image replaced successfully",
		);

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
		const logger = this._getLogger({ method: "upload" });
		logger.debug({ file }, "Uploading image");

		const fileValidationResult = this._validateImageFile(file);
		if (!fileValidationResult.success) {
			logger.warn(
				{ error: fileValidationResult.error },
				"Invalid image file data",
			);

			return fileValidationResult;
		}

		logger.info("Uploading image to storage");

		const promise = await new Promise<StorageResult<SelectImage>>((resolve) => {
			const stream = this._provider.uploader.upload_stream(
				DEFAULT_CLOUDINARY_UPLOAD_CONFIG,
				(error, result) => {
					if (error) {
						logger.error({ error }, "Failed to upload image to storage");

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
						logger.error("No result from storage provider");

						return resolve({
							error: new InternalError(
								"Storage provider did not return a result",
							),
							success: false,
						});
					}

					logger.info(
						{ url: result.secure_url },
						"Image uploaded successfully",
					);

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

	private _getLogger(args: { [key: string]: unknown; method: string }) {
		return getLoggerFromContext().child({
			layer: "image storage service",
			...args,
		});
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
