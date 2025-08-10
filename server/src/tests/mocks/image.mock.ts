import { Readable } from "node:stream";

export function mockMulterImageFile(): Express.Multer.File {
  return {
    buffer: Buffer.from("fake-image-content"),
    destination: "uploads/",
    encoding: "7bit",
    fieldname: "image",
    filename: "avatar.png",
    mimetype: "image/png",
    originalname: "avatar.png",
    path: "uploads/avatar.png",
    size: 1234,
    stream: Readable.from("fake-image-content"),
  };
}
