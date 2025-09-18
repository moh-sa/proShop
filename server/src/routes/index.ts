import { Router } from "express";

import routesV1 from "./v1/index.js";
import routesV2 from "./v2/index.js";

const router = Router();

router.use("/api/v1", routesV1);
router.use("/api/v2", routesV2);

export default router;
