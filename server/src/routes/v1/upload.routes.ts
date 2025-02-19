import express from "express";
import multer from "multer";
import path from "path";
import { RateLimiterMiddleware } from "../../middlewares";
import { validateFileType } from "../../utils";

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads");
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`,
    );
  },
});

const upload = multer({
  storage,
  fileFilter: function (_, file, cb) {
    validateFileType(file, cb);
  },
});

router
  .route("/")
  .post(
    RateLimiterMiddleware.adminLimiter(),
    upload.single("image"),
    (req, res) => {
      if (req.file) {
        const protocol = req.protocol;
        const host = req.get("host");
        const domain = `${protocol}://${host}`;
        res.send(`${domain}/${req.file.path}`);
      }
      res
        .status(400)
        .json({ message: "No file uploaded. Please provide a file." });
    },
  );

export default router;
