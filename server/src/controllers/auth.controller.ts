import { insertUserSchema, selectUserSchema } from "../schemas";
import { authService } from "../services";
import { asyncHandler } from "../utils";

class AuthController {
  private readonly service = authService;

  signin = asyncHandler(async (req, res) => {
    const data = res.locals.user || req.body;

    const parsedData = selectUserSchema
      .pick({ email: true, password: true })
      .parse(data);

    const response = await this.service.signin(parsedData);

    res.status(200).json(response);
  });

  signup = asyncHandler(async (req, res) => {
    const data = insertUserSchema.parse(req.body);

    const response = await this.service.signup(data);

    res.status(201).json(response);
  });
}

export const authController = new AuthController();
