import { authService } from "../services";
import { asyncHandler } from "../utils";

class AuthController {
  private readonly service = authService;

  signin = asyncHandler(async (req, res) => {
    const response = await this.service.signin(res.locals.user);

    res.status(200).json(response);
  });

  signup = asyncHandler(async (req, res) => {
    const response = await this.service.signup(req.body);

    res.status(201).json(response);
  });
}

export const authController = new AuthController();
