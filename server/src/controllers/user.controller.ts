import { Request, Response } from "express";
import { Types } from "mongoose";
import { userService } from "../services";
import { insertUserSchema } from "../types";
import { formatZodErrors } from "../utils";

class UserController {
  private readonly service = userService;

  signin = async (req: Request, res: Response) => {
    const { email, password } = res.locals.user;
    const response = await this.service.signin({ email, password });
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
    const userId = (req.params.id ||
      res.locals.user._id) as unknown as Types.ObjectId;
    const response = await this.service.getById({ userId });
    res.status(200).json(response);
  };

  getAll = async (req: Request, res: Response) => {
    const response = await this.service.getAll();
    res.status(200).json(response);
  };

  update = async (req: Request, res: Response) => {
    const userId = (req.params.id ||
      res.locals.user._id) as unknown as Types.ObjectId;

    const updateDataParsed = insertUserSchema
      .partial()
      .strip()
      .safeParse(req.body);
    if (!updateDataParsed.success) {
      return res.status(400).json({
        message: formatZodErrors(updateDataParsed.error),
      });
    }

    const response = await this.service.updateById({
      userId,
      updateData: updateDataParsed.data,
    });

    res.status(200).json(response);
  };

  delete = async (req: Request, res: Response) => {
    const userId = req.params.id as unknown as Types.ObjectId;
    await this.service.delete({ userId });
    res.status(204).json({ message: "User removed" });
  };
}

export const userController = new UserController();
