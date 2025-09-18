import express from "express";

import { Auth2Controller } from "../../controllers/auth2.controller.js";

const router = express.Router();
const controller = new Auth2Controller(); // eslint-disable-line @typescript-eslint/no-unused-vars

//============= 🔓 PUBLIC ROUTES =============

//============= 🔒 PROTECTED ROUTES =============
const protectedRouter = express.Router();

// Mount protected routes
router.use("/", protectedRouter);

export default router;
