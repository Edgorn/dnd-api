import IUsuarioRepository from "../repositories/IUsuarioRepository";
import { LogearUsuarioParams, LogearUsuarioResult } from "../types";

export default class UsuarioService {
  private usuarioRepository: IUsuarioRepository;

  constructor(usuarioRepository: IUsuarioRepository) {
    this.usuarioRepository = usuarioRepository;
  }

  async logearUsuario({ user, password }: LogearUsuarioParams): Promise<{ success: boolean; data?: LogearUsuarioResult; message?: string }> {
    try {
      const data = await this.usuarioRepository.logearUsuario({ user, password });

      if (data) {
        return { success: true, data };
      } else {
        return { success: false, message: 'Usuario incorrecto' };
      }
    } catch (error) {
      return { success: false, message: 'Error al logearse' };
    }
  }

  async validarToken(token: string): Promise<boolean> {
    const result = await this.usuarioRepository.validarToken(token);
    return result
  }
}
