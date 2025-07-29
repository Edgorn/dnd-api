import { ObjectId } from "mongoose";


export interface UsuarioMongo {
  _id: ObjectId,
  index: number,
  name: string,
  password: string
}

export interface UsuarioApi {
  name: string
}

export interface LogearUsuarioParams {
  user: string;
  password: string;
}

export interface LogearUsuarioResult {
  token: string;
  user: {
    name: string;
  };
}