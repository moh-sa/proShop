import { InsertImage } from "../../types";

export function generateMockMulterImage(): InsertImage {
  return {
    fieldname: "image",
    originalname: "avatar.png",
    encoding: "7bit",
    mimetype: "image/png",
    buffer: Buffer.from("fake-image-content"),
    size: 1234,
  };
}
