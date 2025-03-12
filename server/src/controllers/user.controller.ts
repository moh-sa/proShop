import { NotFoundError } from "../errors";
import { insertUserSchema } from "../schemas";
import { userService } from "../services";
import { asyncHandler, removeEmptyFieldsSchema } from "../utils";
import { objectIdValidator } from "../validators";

class UserController {
  private readonly service = userService;

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

    const data = removeEmptyFieldsSchema(insertUserSchema).parse(req.body);

    const response = await this.service.updateById({
      userId,
      data,
    });

    res.status(200).json(response);
  });

  delete = asyncHandler(async (req, res) => {
    const idReq = req.params.userId;
    const userId = objectIdValidator.parse(idReq);

    const response = await this.service.delete({ userId });
    if (!response) throw new NotFoundError("User");

    res.status(204).json({ message: "User removed" });
  });
}

export const userController = new UserController();
