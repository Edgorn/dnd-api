import { ObjectId } from "mongoose";


export interface UsuarioMongo {
  _id: ObjectId,
  name: string,
  password: string,
  accessibleSystems: string[]
}

export interface UsuarioApi {
  id: string,
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