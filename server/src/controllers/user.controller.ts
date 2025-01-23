import { insertUserSchema } from "../schemas";
import { userService } from "../services";
import { asyncHandler } from "../utils";
import { objectIdValidator } from "../validators";

class UserController {
  private readonly service = userService;

  signin = asyncHandler(async (req, res) => {
    const response = await this.service.signin(res.locals.user);

    res.status(200).json(response);
  });

  signup = asyncHandler(async (req, res) => {
    const response = this.service.signup(req.body);

    res.status(201).json(response);
  });

  getById = asyncHandler(async (req, res) => {
    const idReq = req.params.userId || res.locals.user._id;
    const userId = objectIdValidator.parse(idReq);

    const response = await this.service.getById({ userId });

    res.status(200).json(response);
  });

  getAll = asyncHandler(async (req, res) => {
    const response = await this.service.getAll();

    res.status(200).json(response);
  });

  update = asyncHandler(async (req, res) => {
    const idReq = req.params.userId || res.locals.user._id;
    const userId = objectIdValidator.parse(idReq);

    const transformedBody = Object.fromEntries(
      Object.entries(req.body).map(([key, value]) => [
        key,
        value === "" ? undefined : value,
      ]),
    );
    const updateData = insertUserSchema.partial().parse(transformedBody);

    const response = await this.service.updateById({
      userId,
      updateData,
    });

    res.status(200).json(response);
  });

  delete = asyncHandler(async (req, res) => {
    const idReq = req.params.userId;
    const userId = objectIdValidator.parse(idReq);

    await this.service.delete({ userId });

    res.status(204).json({ message: "User removed" });
  });
}

export const userController = new UserController();
