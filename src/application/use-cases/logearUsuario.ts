import UsuarioService from '../../domain/services/usuario.service';
import { LogearUsuarioParams, LogearUsuarioResult } from '../../domain/types';

export default class LogearUsuario {
  private usuarioService: UsuarioService;

  constructor(usuarioService: UsuarioService) {
    this.usuarioService = usuarioService;
  }

  async execute({ user, password }: LogearUsuarioParams): Promise<{ success: boolean; data?: LogearUsuarioResult; message?: string }> {
    return await this.usuarioService.logearUsuario({ user, password });
  }
}
