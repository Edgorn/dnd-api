import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

const respondZodError = (res: Response, error: ZodError) => {
  const messages = error.issues.map((issue) => issue.message).join(", ");

  return res.status(400).json({
    error: messages,
    details: error.issues
  });
};

export const validateSchema = (schema: z.ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return respondZodError(res, error);
      }

      return res.status(500).json({ error: "Internal server error" });
    }
  };
};

export const validateParams = (schema: z.ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return respondZodError(res, error);
      }

      return res.status(500).json({ error: "Internal server error" });
    }
  };
};

export const validateQuery = (schema: z.ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return respondZodError(res, error);
      }

      return res.status(500).json({ error: "Internal server error" });
    }
  };
};