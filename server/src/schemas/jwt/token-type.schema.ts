import { z } from "zod";

import { TokenType } from "../../types/index.js";

export const tokenTypeSchema = z.nativeEnum(TokenType);
