import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export const validateSchema = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: (error as any).errors.map((e: any) => e.message).join(", "),
          details: (error as any).errors
        });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  };
};
