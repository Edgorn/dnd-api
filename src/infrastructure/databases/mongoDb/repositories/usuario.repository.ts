import IUsuarioRepository from '../../../../domain/repositories/IUsuarioRepository';
import { UsuarioApi, UsuarioMongo } from '../../../../domain/types/usuarios.types';
import UsuarioSchema from '../schemas/Usuario';

export default class UsuarioRepository implements IUsuarioRepository {
  constructor() {
  }

  buscarUsuarioPorId(id: string): Promise<UsuarioMongo | null> {
    return UsuarioSchema.findById(id).lean();
  }

  buscarUsuarioPorNombre(user: string): Promise<UsuarioMongo | null> {
    return UsuarioSchema.findOne({ name: user }).lean();
  }

  async consultarNombreUsuario(id: string): Promise<string> {
    const usuario = await UsuarioSchema.findById(id).select('name').lean();
    return usuario?.name ?? '';
  }

  async consultarUsuarios(indices: string[]): Promise<UsuarioApi[]> {
    const usuarios = await UsuarioSchema.find({ _id: { $in: indices } })
      .lean();

    return this.formatearUsuariosBasicos(usuarios)
  }

  private formatearUsuariosBasicos(usuarios: UsuarioMongo[]): UsuarioApi[] {
    return usuarios.map(usuario => this.formatearUsuarioBasico(usuario))
  }

  private formatearUsuarioBasico(usuario: UsuarioMongo): UsuarioApi {
    return {
      id: usuario?._id?.toString(),
      name: usuario.name
    }
  }
}
