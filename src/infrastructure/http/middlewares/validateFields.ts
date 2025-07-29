import { Request, Response, NextFunction } from "express";

export const validateFields = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missing = fields.filter(field => !req.body[field]);

    if (missing.length > 0) {
      return res.status(400).json({
        error: `Faltan los siguientes campos: ${missing.join(", ")}`
      });
    }

    next();
  };
};