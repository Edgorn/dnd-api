import { ObjectId } from "mongoose";

export interface CompetenciaMongo {
  _id: ObjectId,
  index: string,
  name: string,
  type: string,
  desc: [string]
}

export interface CompetenciaApi {
  index: string,
  name: string,
  type: string,
  desc: [string]
}