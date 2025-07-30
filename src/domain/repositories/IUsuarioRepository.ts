import { UsuarioMongo } from "../types/usuarios.types";

export default interface IUsuarioRepository {
  buscarUsuarioPorId(id: string): Promise<UsuarioMongo | null>
  buscarUsuarioPorNombre(user: string): Promise<UsuarioMongo | null>

  
  nombreUsuario(id: string): Promise<string> 
  
  consultarUsuarios(indexList: string[]): Promise<any>
}