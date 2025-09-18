import express from "express";

import { Auth2Controller } from "../../controllers/auth2.controller.js";
import {
	authLimiter,
	defaultLimiter,
	strictLimiter,
} from "../../services/index.js";

const router = express.Router();
const controller = new Auth2Controller();

//============= 🔓 PUBLIC ROUTES =============
router.route("/signup").post(authLimiter, controller.signUp);

router.route("/signin").post(authLimiter, controller.signIn);

//============= 🔒 PROTECTED ROUTES =============
const protectedRouter = express.Router();

// Sign out routes
protectedRouter
	.route("/signout/current")
	.delete(defaultLimiter, controller.signOut);

protectedRouter.route("/signout").delete(strictLimiter, controller.signOutAll);

// Token routes
protectedRouter
	.route("/token/refresh")
	.post(strictLimiter, controller.refreshAccessToken);

// Session routes
protectedRouter
	.route("/sessions")
	.get(defaultLimiter, controller.getUserSessions);

protectedRouter
	.route("/sessions/current")
	.delete(strictLimiter, controller.revokeSession);

protectedRouter
	.route("/sessions")
	.delete(strictLimiter, controller.revokeAllSessions);

// Mount protected routes
router.use("/", protectedRouter);

export default router;
