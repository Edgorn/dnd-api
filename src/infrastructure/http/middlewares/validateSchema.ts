import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

export const validateSchema = (schema: z.ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues.map((issue) => issue.message).join(", ");

        return res.status(400).json({
          error: messages,
          details: error.issues
        });
      }

      return res.status(500).json({ error: "Internal server error" });
    }
  };
};