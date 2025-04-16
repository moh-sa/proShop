import { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";
import cloudinary from "../config/cloudinary.config";
import { InsertImage, SelectImage } from "../types";

export interface IImageStorageManager {
  upload(data: { file: InsertImage }): Promise<string>;
  delete(data: { url: string }): Promise<void>;
  replace(data: { url: string; file: InsertImage }): Promise<SelectImage>;
}

export class ImageStorageManager implements IImageStorageManager {
  private readonly provider = cloudinary;

  async upload({ file }: { file: InsertImage }): Promise<string> {
    return new Promise((resolve, reject) => {
      this.provider.uploader
        .upload_stream(
          {
            folder: "proShop",
            resource_type: "image",
            format: "avif",
            transformation: {
              width: 482,
              height: 272,
              aspect_ratio: "16:9",
              crop: "auto",
              gravity: "auto",
            },
          },
          (
            error: UploadApiErrorResponse | undefined,
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

  async delete({ url }: { url: string }): Promise<void> {
    try {
      const publicId = this.extractPublicId({ url });
      const res = await this.provider.uploader.destroy("proShop/" + publicId);

      if (res.result === "not found") {
        throw new Error("File not found");
      } else if (res.result !== "ok") {
        throw new Error("Error while deleting file");
      }
    } catch (error) {
      console.log(error);
      throw new Error(
        `Delete failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async replace({
    url,
    file,
  }: {
    url: string;
    file: InsertImage;
  }): Promise<SelectImage> {
    const deleteImage = this.delete({ url });
    const uploadImage = this.upload({ file });

    const [_, newImageURL] = await Promise.all([deleteImage, uploadImage]);
    return newImageURL;
  }

  private extractPublicId({ url }: { url: string }): string {
    const publicId = url.split("/").pop()?.split(".").shift();
    if (!publicId) throw new Error("Invalid URL");

    return publicId;
  }
}
