import mongoose from 'mongoose';
import IUsuarioRepository from '../../../../domain/repositories/IUsuarioRepository';
import { LogearUsuarioParams, LogearUsuarioResult } from '../../../../domain/types';
const UsuarioSchema = require('../schemas/Usuario');

export default class UsuarioRepository extends IUsuarioRepository {
  constructor() {
    super()
  }

  async logearUsuario({ user, password }: LogearUsuarioParams): Promise<LogearUsuarioResult | null> {
    const usuario = await UsuarioSchema.findOne({ name: user, password: password })

    if (usuario) {
      return { 
        token: usuario?._id,
        user: {
          name: usuario?.name
        }
      }
    } else { 
      return null
    }
  }

  async validarToken(token: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(token)) {
      return null; // Si el token no es un ObjectId válido, retorna null
    }
  
    const usuario = await UsuarioSchema.findById(token);
  
    return usuario ? usuario.index : null;
  }

  async nombreUsuario(id: number): Promise<string> {
    const usuario = await UsuarioSchema.find({ index: id })

    return usuario[0]?.name
  }
}
