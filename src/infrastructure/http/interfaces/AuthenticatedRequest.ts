import { Request } from "express";
import 'multer';

export interface AuthenticatedRequest extends Request {
  user?: string;
  file?: Express.Multer.File;
}
