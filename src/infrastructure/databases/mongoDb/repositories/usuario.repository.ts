import IUsuarioRepository from '../../../../domain/repositories/IUsuarioRepository';
import { LogearUsuarioParams, LogearUsuarioResult } from '../../../../domain/types';
const UsuarioSchema = require('../schemas/Usuario');

export default class UsuarioRepository extends IUsuarioRepository {
  constructor() {
    super()
  }

  async logearUsuario({ user, password }: LogearUsuarioParams): Promise<LogearUsuarioResult | null> {
    const usuario = await UsuarioSchema.find({ name: user, password: password })

    if (usuario[0]) {
      return { 
        token: usuario[0]?.index,
        user: {
          name: usuario[0]?.name
        }
      }
    } else {
      return null
    }
  }
}
