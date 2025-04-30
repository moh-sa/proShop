import { insertUserSchema, selectUserSchema } from "../schemas";
import { authService } from "../services";
import { asyncHandler, sendSuccessResponse } from "../utils";

class AuthController {
  private readonly service = authService;

  signin = asyncHandler(async (req, res) => {
    const data = res.locals.user || req.body;

    const parsedData = selectUserSchema
      .pick({ email: true, password: true })
      .parse(data);

    const response = await this.service.signin(parsedData);

    return sendSuccessResponse({
      res,
      statusCode: 200,
      data: response,
    });
  });

  signup = asyncHandler(async (req, res) => {
    const data = insertUserSchema.parse(req.body);

    const response = await this.service.signup(data);

    return sendSuccessResponse({
      res,
      statusCode: 201,
      data: response,
    });
  });
}

export const authController = new AuthController();
