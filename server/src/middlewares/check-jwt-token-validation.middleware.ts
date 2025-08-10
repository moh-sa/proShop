import { selectUserSchema } from "../schemas/index.js";
import { asyncHandler, verifyJwtToken } from "../utils/index.js";
import { bearerTokenValidator } from "../validators/index.js";

// TODO: rename 'id' to 'userId' or '_id' across the app
const schema = selectUserSchema.pick({ _id: true }).transform((data) => {
  return {
    _id: data._id,
  };
});

/**
 * Middleware to validate JWT token
 */
export const checkJwtTokenValidation = asyncHandler(async (req, res, next) => {
  const authHeader = bearerTokenValidator.parse(req.headers.authorization);
  const decoded = verifyJwtToken(authHeader, schema);

  res.locals.token = {
    ...decoded,
  };

  next();
});
