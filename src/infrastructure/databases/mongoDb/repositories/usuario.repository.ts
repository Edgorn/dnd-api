import IUsuarioRepository from '../../../../domain/repositories/IUsuarioRepository';
import { UsuarioMongo } from '../../../../domain/types/usuarios.types';
import UsuarioSchema from '../schemas/Usuario';

export default class UsuarioRepository implements IUsuarioRepository {
  constructor() {
  }

  async buscarUsuarioPorId(id: string): Promise<UsuarioMongo | null> {
    try {
      return await UsuarioSchema.findById(id);
    } catch (error) {
      console.error(`Error al buscar usuario: ${id}`, error);
      throw new Error("Error en la base de datos");
    }
  }

  async buscarUsuarioPorNombre(user: string): Promise<UsuarioMongo | null> {
    try {
      return await UsuarioSchema.findOne({ name: user });
    } catch (error) {
      console.error(`Error al buscar usuario: ${user}`, error);
      throw new Error("Error en la base de datos");
    }
  }

  async nombreUsuario(id: string): Promise<string> {
    const usuario = await UsuarioSchema.findById(id)

    return usuario?.name ?? ''
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
