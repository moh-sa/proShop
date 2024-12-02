import path from "path";
import express from "express";
import multer, { FileFilterCallback } from "multer";

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads");
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

function checkFileType(file: Express.Multer.File, cb: FileFilterCallback) {
  const fileTypes = /jpg|jpeg|png/;
  const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = fileTypes.test(file.mimetype);

  if (extName && mimeType) {
    return cb(null, true);
  } else {
    return cb(new Error("Only Images are allowed!"));
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

router.route("/").post(upload.single("image"), (req, res) => {
  if (req.file) {
    res.send(`${process.env.SERVER_URL}/${req.file.path}`);
  }
  res.status(400).json({ message: "No file uploaded. Please provide a file." });
});

export default router;
