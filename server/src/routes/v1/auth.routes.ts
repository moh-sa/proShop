import express from "express";

import { authController } from "../../controllers/auth.controller.js";
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
	.delete(defaultLimiter, authController.signOut);

protectedRouter
	.route("/signout")
	.delete(strictLimiter, authController.signOutAll);

// Token routes
protectedRouter
	.route("/token/refresh")
	.post(strictLimiter, authController.refreshAccessToken);

// Session routes
protectedRouter
	.route("/sessions")
	.get(defaultLimiter, authController.getUserSessions);

protectedRouter
	.route("/sessions/current")
	.delete(strictLimiter, authController.revokeSession);

protectedRouter
	.route("/sessions")
	.delete(strictLimiter, authController.revokeAllSessions);

// Mount protected routes
router.use("/", protectedRouter);

export default router;
