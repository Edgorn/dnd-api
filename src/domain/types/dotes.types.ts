import { ObjectId } from "mongoose";

export interface DoteMongo {
  _id: ObjectId,
  name: string,
  desc: string[]
}

export interface DoteApi {
  index: string,
  name: string,
  desc: string
}