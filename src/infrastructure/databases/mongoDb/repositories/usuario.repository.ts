import IUsuarioRepository from '../../../../domain/repositories/IUsuarioRepository';
import { UsuarioApi, UsuarioMongo } from '../../../../domain/types/usuarios.types';
import UsuarioSchema from '../schemas/Usuario';

export default class UsuarioRepository implements IUsuarioRepository {
  constructor() {
  }

  buscarUsuarioPorId(id: string): Promise<UsuarioMongo | null> {
    try {
      return UsuarioSchema.findById(id);
    } catch (error) {
      console.error(`Error al buscar usuario: ${id}`, error);
      throw new Error("Error en la base de datos");
    }
  }

  buscarUsuarioPorNombre(user: string): Promise<UsuarioMongo | null> {
    try {
      return UsuarioSchema.findOne({ name: user });
    } catch (error) {
      console.error(`Error al buscar usuario: ${user}`, error);
      throw new Error("Error en la base de datos");
    }
  }

  async consultarNombreUsuario(id: string): Promise<string> {
    const usuario = await UsuarioSchema.findById(id)

    return usuario?.name ?? ''
  }

  async consultarUsuarios(indices: string[]): Promise<UsuarioApi[]> {
    const usuarios = await UsuarioSchema.find({ _id: { $in: indices } })
    
    return this.formatearUsuariosBasicos(usuarios)
  }

  private formatearUsuariosBasicos(usuarios: UsuarioMongo[]): UsuarioApi[] {
    return usuarios.map(usuario => this.formatearUsuarioBasico(usuario))
  }

  private formatearUsuarioBasico(usuario: UsuarioMongo): UsuarioApi {
    return {
      index: usuario?._id?.toString(),
      name: usuario.name
    }
  }
}
