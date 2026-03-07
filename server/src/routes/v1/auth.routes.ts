import express from "express";

import { authController } from "../../controllers/auth.controller.js";
import { refreshGuard, userGuard } from "../../middlewares/index.js";
import {
	authLimiter,
	defaultLimiter,
	strictLimiter,
} from "../../services/index.js";

const router = express.Router();

//============= 🔓 PUBLIC ROUTES =============
router.route("/signup").post(authLimiter, authController.signUp);

router.route("/signin").post(authLimiter, authController.signIn);

//============= 🔒 PROTECTED ROUTES =============
const protectedRouter = express.Router();

// Sign out routes
protectedRouter
	.route("/signout/current")
	.delete(...userGuard(defaultLimiter), authController.signOut);

protectedRouter
	.route("/signout")
	.delete(...userGuard(strictLimiter), authController.signOutAll);

// Token routes
protectedRouter
	.route("/token/refresh")
	.post(...refreshGuard(strictLimiter), authController.refreshAccessToken);

// Session routes
protectedRouter
	.route("/sessions")
	.get(...userGuard(defaultLimiter), authController.getUserSessions);

protectedRouter
	.route("/sessions/current")
	.delete(...userGuard(strictLimiter), authController.revokeSession);

protectedRouter
	.route("/sessions")
	.delete(...userGuard(strictLimiter), authController.revokeAllSessions);

// Mount protected routes
router.use("/", protectedRouter);

export default router;
