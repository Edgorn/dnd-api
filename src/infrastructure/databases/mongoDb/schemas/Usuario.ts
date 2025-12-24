import mongoose, { Schema } from "mongoose";
import { UsuarioMongo } from "../../../../domain/types/usuarios.types";

const usuarioSchema: Schema = new Schema<UsuarioMongo>({
  name: {
    type: String,
    required: [true, "El nombre es obligatorio"],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, "La contraseña es obligatoria"]
  }
}, {
  collection: 'Usuarios',
  timestamps: true
});

const UsuarioModel = mongoose.model<UsuarioMongo>("Usuarios", usuarioSchema);
export default UsuarioModel;