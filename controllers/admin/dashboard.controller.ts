import { Response } from "express";
import { AccountRequest } from "../../interfaces/resquest.interface";

export const test = async (req: AccountRequest, res: Response) => {
  res.sendStatus(204);
};