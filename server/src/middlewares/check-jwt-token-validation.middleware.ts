import { asyncHandler, verifyJwtToken } from "../utils";
import {
  authHeaderValidator,
  jwtTokenValidator,
  objectIdValidator,
} from "../validators";

/**
 * Middleware to validate JWT token
 */
export const checkJwtTokenValidation = asyncHandler(async (req, res, next) => {
  const authHeader = authHeaderValidator.parse(req.headers.authorization);
  const token = jwtTokenValidator.parse(authHeader);
  const decoded = verifyJwtToken(token);
  const userId = objectIdValidator.parse(decoded.id);

  res.locals.token = {
    ...decoded,
    id: userId,
  };

  next();
});
