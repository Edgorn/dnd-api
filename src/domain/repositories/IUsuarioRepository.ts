import { UsuarioApi, UsuarioMongo } from "../types/usuarios.types";

export default interface IUsuarioRepository {
  buscarUsuarioPorId(id: string): Promise<UsuarioMongo | null>
  buscarUsuarioPorNombre(user: string): Promise<UsuarioMongo | null>
  consultarNombreUsuario(id: string): Promise<string> 

  consultarUsuarios(indexList: string[]): Promise<UsuarioApi[]>
}