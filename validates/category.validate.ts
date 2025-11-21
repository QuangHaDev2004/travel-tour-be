import { NextFunction, Request, Response } from "express";
import Joi from "joi";

export const createPost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const schema = Joi.object({
    name: Joi.string().required().messages({
      "string.empty": "Vui lòng nhập tên danh mục!",
    }),
    parent: Joi.string().allow(""),
    position: Joi.string().allow(""),
    status: Joi.string().allow(""),
    avatar: Joi.string().allow(""),
    description: Joi.string().allow(""),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    const errorMessage = error.details[0].message;
    return res.status(400).json({ message: errorMessage });
  }

  next();
};
