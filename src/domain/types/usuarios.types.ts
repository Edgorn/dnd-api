import { ObjectId } from "mongoose";


export interface UsuarioMongo {
  _id: ObjectId,
  index: number,
  name: string,
  password: string
}

export interface UsuarioApi {
  index: string,
  name: string
}

export interface LoginParams {
  user: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: UsuarioApi;
}