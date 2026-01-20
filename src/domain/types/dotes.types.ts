import { ObjectId } from "mongoose";

export interface DoteMongo {
  _id: ObjectId,
  name: string,
  desc?: string[],
  description?: string[],
  summary?: string[]
}

export interface DoteApi {
  index: string,
  name: string,
  description: string[],
  summary: string[]
}