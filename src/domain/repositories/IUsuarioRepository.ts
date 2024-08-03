import { LogearUsuarioParams, LogearUsuarioResult } from "../types";

export default class IUsuarioRepository {
  async logearUsuario(params: LogearUsuarioParams): Promise<LogearUsuarioResult | null> {
    throw new Error('Método no implementado');
  }
}