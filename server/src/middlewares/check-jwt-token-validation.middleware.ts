import { selectUserSchema } from "../schemas";
import { asyncHandler, verifyJwtToken } from "../utils";
import { bearerTokenValidator, objectIdValidator } from "../validators";

// TODO: rename 'id' to 'userId' or '_id' across the app
const schema = selectUserSchema.pick({ _id: true }).transform((data) => {
  return {
    id: data._id,
  };
});

/**
 * Middleware to validate JWT token
 */
export const checkJwtTokenValidation = asyncHandler(async (req, res, next) => {
  const authHeader = bearerTokenValidator.parse(req.headers.authorization);
  const decoded = verifyJwtToken(authHeader, schema);
  const userId = objectIdValidator.parse(decoded.id);

  res.locals.token = {
    ...decoded,
    id: userId,
  };

  next();
});
