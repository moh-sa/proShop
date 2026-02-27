import express from "express";

import { auth2Controller } from "../../controllers/auth2.controller.js";
import {
	authLimiter,
	defaultLimiter,
	strictLimiter,
} from "../../services/index.js";

const router = express.Router();

//============= 🔓 PUBLIC ROUTES =============
router.route("/signup").post(authLimiter, auth2Controller.signUp);

router.route("/signin").post(authLimiter, auth2Controller.signIn);

//============= 🔒 PROTECTED ROUTES =============
const protectedRouter = express.Router();

// Sign out routes
protectedRouter
	.route("/signout/current")
	.delete(defaultLimiter, auth2Controller.signOut);

protectedRouter
	.route("/signout")
	.delete(strictLimiter, auth2Controller.signOutAll);

// Token routes
protectedRouter
	.route("/token/refresh")
	.post(strictLimiter, auth2Controller.refreshAccessToken);

// Session routes
protectedRouter
	.route("/sessions")
	.get(defaultLimiter, auth2Controller.getUserSessions);

protectedRouter
	.route("/sessions/current")
	.delete(strictLimiter, auth2Controller.revokeSession);

protectedRouter
	.route("/sessions")
	.delete(strictLimiter, auth2Controller.revokeAllSessions);

// Mount protected routes
router.use("/", protectedRouter);

export default router;
