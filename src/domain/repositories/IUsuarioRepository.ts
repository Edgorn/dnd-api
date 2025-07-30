import { UsuarioMongo } from "../types/usuarios.types";

export default interface IUsuarioRepository {
  buscarUsuarioPorId(id: string): Promise<UsuarioMongo | null>

  buscarUsuarioPorNombre(user: string): Promise<UsuarioMongo | null>
  /*async logearUsuario(params: LogearUsuarioParams): Promise<LogearUsuarioResult | null> {
    throw new Error('Método no implementado');
  }

  async validarToken(token: string): Promise<string | null> {
    throw new Error('Método no implementado');
  }

  async nombreUsuario(id: string): Promise<string> {
    throw new Error('Método no implementado');
  }

  async consultarUsuarios(indexList: string[]): Promise<any> {
    throw new Error('Método no implementado');
  }*/
}