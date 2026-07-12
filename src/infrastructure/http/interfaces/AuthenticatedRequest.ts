import { Request } from "express";
import 'multer';

export interface AuthenticatedRequest extends Request<{ [key: string]: string }> {
  user?: string;
  file?: Express.Multer.File;
}
