import { FileFilterCallback } from "multer";
import path from "path";

export function validateFileType(
  file: Express.Multer.File,
  cb: FileFilterCallback,
) {
  const fileTypes = /jpg|jpeg|png/;
  const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = fileTypes.test(file.mimetype);
  if (!extName && !mimeType) return cb(new Error("Only Images are allowed!"));

  return cb(null, true);
}
