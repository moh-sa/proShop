import { Request, Response } from "express";
import { userService } from "../services";
import { TInsertUser } from "../types";

class UserController {
  private readonly service = userService;

  signin = async (req: Request, res: Response) => {
    const { email, password } = res.locals.user;
    const response = await this.service.signin({ email, password });
    res.status(200).json(response);
  };

  signup = (req: Request, res: Response) => {
    type TBody = { name: string; email: string; password: string };
    const { name, email, password } = req.body as TBody;
    const response = this.service.signup({
      name,
      email,
      password,
      isAdmin: false,
    });
    res.status(201).json(response);
  };

  getById = async (req: Request, res: Response) => {
    const userId = req.params.id || res.locals.user._id.toString(); // TODO: fix type
    const response = await this.service.getById({ userId });
    res.status(200).json(response);
  };

  getAll = async (req: Request, res: Response) => {
    const response = await this.service.getAll();
    res.status(200).json(response);
  };

  update = async (req: Request, res: Response) => {
    const userId = req.params.id || res.locals.user._id.toString(); // TODO: fix type
    const updateData = req.body as Partial<TInsertUser>;
    const response = await this.service.updateById({ userId, updateData });

    res.status(200).json(response);
  };

  delete = async (req: Request, res: Response) => {
    const userId = req.params.id;
    await this.service.delete({ userId });
    res.status(204).json({ message: "User removed" });
  };
}

export const userController = new UserController();
