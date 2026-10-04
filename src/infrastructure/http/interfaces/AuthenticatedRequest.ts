import { Request } from "express";

export interface AuthenticatedRequest extends Request<{ [key: string]: string }> {
  user?: string;
}
