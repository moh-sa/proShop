import multer from "multer";
import { IMAGE_FIELD_NAME } from "../constants";

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const uploadSingle = upload.single(IMAGE_FIELD_NAME);
