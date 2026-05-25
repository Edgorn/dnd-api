import { ObjectId } from "mongoose";

export interface System {
  _id: ObjectId,
  name: string,
  description: string,
  publisher: string,
  isOpen: boolean
}