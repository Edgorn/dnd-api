import type { Request, Response } from 'express';
import app from '../src/infrastructure/http/server';
import connectDB from '../src/infrastructure/databases/mongoDb/mongodb';

export default async function handler(req: Request, res: Response) {
  await connectDB();
  return app(req, res);
}
