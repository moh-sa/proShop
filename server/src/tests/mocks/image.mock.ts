import { Readable } from "node:stream";

export function mockMulterImageFile(): Express.Multer.File {
  return {
    fieldname: "image",
    originalname: "avatar.png",
    encoding: "7bit",
    mimetype: "image/png",
    buffer: Buffer.from("fake-image-content"),
    size: 1234,
    destination: "uploads/",
    filename: "avatar.png",
    path: "uploads/avatar.png",
    stream: Readable.from("fake-image-content"),
  };
}
