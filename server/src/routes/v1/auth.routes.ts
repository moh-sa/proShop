import express from "express";

import { authController } from "../../controllers/auth.controller.js";
import { userGuard } from "../../middlewares/index.js";
import {
	authLimiter,
	defaultLimiter,
	strictLimiter,
} from "../../services/index.js";

const router = express.Router();

//============= 🔓 PUBLIC ROUTES =============
router.route("/signup").post(authLimiter, authController.signUp);

router.route("/signin").post(authLimiter, authController.signIn);

router.route("/demo-signin").post(authLimiter, authController.demoSignIn);

//============= 🔒 PROTECTED ROUTES =============
const protectedRouter = express.Router();

// Session routes
protectedRouter
	.route("/sessions")
	.get(...userGuard(defaultLimiter), authController.getUserSessions);

protectedRouter
	.route("/sessions/current")
	.delete(...userGuard(defaultLimiter), authController.signOut);

protectedRouter
	.route("/sessions")
	.delete(...userGuard(strictLimiter), authController.signOutAll);

// Mount protected routes
router.use("/", protectedRouter);

export default router;
