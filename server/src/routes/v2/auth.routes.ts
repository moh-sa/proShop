import express from "express";

import { Auth2Controller } from "../../controllers/auth2.controller.js";
import { authLimiter } from "../../services/index.js";

const router = express.Router();
const controller = new Auth2Controller();

//============= 🔓 PUBLIC ROUTES =============
router.route("/signup").post(authLimiter, controller.signUp);

//============= 🔒 PROTECTED ROUTES =============
const protectedRouter = express.Router();

// Mount protected routes
router.use("/", protectedRouter);

export default router;
