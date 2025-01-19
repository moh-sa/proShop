import { Request, Response } from "express";
import { insertUserSchema } from "../schemas";
import { userService } from "../services";
import { formatZodErrors } from "../utils";
import { objectIdValidator } from "../validators";

class UserController {
  private readonly service = userService;

  signin = async (req: Request, res: Response) => {
    const response = await this.service.signin(res.locals.user);
    res.status(200).json(response);
  };

  signup = (req: Request, res: Response) => {
    const bodyParsed = insertUserSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      return res
        .status(400)
        .json({ message: formatZodErrors(bodyParsed.error) });
    }

    const response = this.service.signup(bodyParsed.data);
    res.status(201).json(response);
  };

  getById = async (req: Request, res: Response) => {
    const idRaw = req.params.id || res.locals.user._id;

    const idParsed = objectIdValidator.safeParse(idRaw);
    if (!idParsed.success) {
      return res.status(400).json({ message: formatZodErrors(idParsed.error) });
    }

    const response = await this.service.getById({ userId: idParsed.data });

    res.status(200).json(response);
  };

  getAll = async (req: Request, res: Response) => {
    const response = await this.service.getAll();
    res.status(200).json(response);
  };

  update = async (req: Request, res: Response) => {
    const idRaw = req.params.id || res.locals.user._id;
    const idParsed = objectIdValidator.safeParse(idRaw);
    if (!idParsed.success) {
      return res.status(400).json({ message: formatZodErrors(idParsed.error) });
    }

    const transformedBody = Object.fromEntries(
      Object.entries(req.body).map(([key, value]) => [
        key,
        value === "" ? undefined : value,
      ]),
    );

    const updateDataParsed = insertUserSchema
      .partial()
      .safeParse(transformedBody);
    if (!updateDataParsed.success) {
      return res.status(400).json({
        message: formatZodErrors(updateDataParsed.error),
      });
    }

    const response = await this.service.updateById({
      userId: idParsed.data,
      updateData: updateDataParsed.data,
    });

    res.status(200).json(response);
  };

  delete = async (req: Request, res: Response) => {
    const idRaw = req.params.id;
    const idParsed = objectIdValidator.safeParse(idRaw);
    if (!idParsed.success) {
      return res.status(400).json({ message: formatZodErrors(idParsed.error) });
    }

    await this.service.delete({ userId: idParsed.data });

    res.status(204).json({ message: "User removed" });
  };
}

export const userController = new UserController();
