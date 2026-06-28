import { Request, Response, NextFunction } from "express";
import { AppError } from "../../../domain/errors/AppError";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Manejar errores de Mongoose como CastError (ID inválido)
  if (err.name === "CastError") {
    return res.status(400).json({ error: `Formato de ID inválido: ${err.value}` });
  }

  console.error("Unexpected error:", err);
  return res.status(500).json({ error: "Ocurrió un error inesperado en el servidor" });
};
