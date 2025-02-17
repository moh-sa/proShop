import { Router } from "express";
import routesV1 from "./v1";

const router = Router();

router.use("/api/v1", routesV1);

export default router;
