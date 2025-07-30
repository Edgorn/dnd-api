import mongoose, { Schema } from "mongoose";
import { UsuarioMongo } from "../../../../domain/types/usuarios.types";

const usuarioSchema: Schema = new Schema<UsuarioMongo>({
  index: Number,
  name: String,
  password: String
}, { collection: 'Usuarios' });

const UsuarioModel = mongoose.model<UsuarioMongo>("Usuarios", usuarioSchema);
export default UsuarioModel
