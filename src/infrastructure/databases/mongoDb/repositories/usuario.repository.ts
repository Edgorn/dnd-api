import IUsuarioRepository from '../../../../domain/repositories/IUsuarioRepository';
import { LogearUsuarioParams, LogearUsuarioResult } from '../../../../domain/types';
const UsuarioSchema = require('../schemas/Usuario');
const jwt = require('jsonwebtoken')

export default class UsuarioRepository extends IUsuarioRepository {
  constructor() {
    super()
  }

  async logearUsuario({ user, password }: LogearUsuarioParams): Promise<LogearUsuarioResult | null> {
    const usuario = await UsuarioSchema.findOne({ name: user, password: password })

    if (usuario) {
      const token = jwt.sign(
        { id: usuario._id, name: usuario.name },
        process.env.JWT_SECRET,
      )

      return { 
        token,
        user: {
          name: usuario?.name
        }
      }
    } else { 
      return null
    }
  }

  async validarToken(token: string): Promise<string | null> {
    if (!token) {
      return null
    }

    try {
      // Verificar que el token sea válido y firmado correctamente
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // Opcional: Verificar si el token está registrado en la base de datos
      const usuario = await UsuarioSchema.findById(decoded.id)

      if (!usuario) {
        return null
      }

      return usuario._id.toString()

    } catch (error) {
      return null
    }
  }

  async nombreUsuario(id: string): Promise<string> {
    const usuario = await UsuarioSchema.findById(id)

    return usuario?.name
  }

  async consultarUsuarios(indexList: string[]) {
    const usuarios = await Promise.all(
      indexList.map(index => this.consultarUsuario(index))
    )
    
    return usuarios
  }

  async consultarUsuario(index: string) {
    if (index) {
      const usuario = await UsuarioSchema.findById(index)

      if (usuario) {
        return {
          index: usuario?._id?.toString(),
          name: usuario.name
        }
      } else {
        return null
      }
    } else {
      return null
    }
  }
}
