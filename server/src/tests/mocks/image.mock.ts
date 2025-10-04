import type { InsertImage } from "../../types/image.type.js";

export function mockMulterImageFile(): InsertImage {
	return {
		buffer: Buffer.from("fake-image-content"),
		encoding: "7bit",
		fieldname: "image",
		mimetype: "image/png",
		originalname: "avatar.png",
		size: 1234,
	};
}
