import pino from "pino";

import { loggerConfig } from "../config/index.js";

export const logger = pino(loggerConfig);
