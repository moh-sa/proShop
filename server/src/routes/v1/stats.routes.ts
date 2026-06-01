import express from "express";

import { statsController } from "../../controllers/index.js";
import { adminGuard } from "../../middlewares/index.js";
import { adminLimiter } from "../../services/index.js";

const router = express.Router();

router.route("/").get(...adminGuard(adminLimiter), statsController.getSummary);

export default router;
