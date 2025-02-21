import { AnyARecord } from "dns";
import { LogearUsuarioParams, LogearUsuarioResult } from "../types";

export default class IUsuarioRepository {
  async logearUsuario(params: LogearUsuarioParams): Promise<LogearUsuarioResult | null> {
    throw new Error('Método no implementado');
  }

  async validarToken(token: string): Promise<any> {
    throw new Error('Método no implementado');
  }

  async nombreUsuario(id: number): Promise<string> {
    throw new Error('Método no implementado');
  }
}