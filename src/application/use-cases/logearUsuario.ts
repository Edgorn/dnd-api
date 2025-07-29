import UsuarioService from '../../domain/services/usuario.service';
import { LogearUsuarioParams, LogearUsuarioResult } from '../../domain/types/usuarios';

export default class LogearUsuario {
  private usuarioService: UsuarioService;

  constructor(usuarioService: UsuarioService) {
    this.usuarioService = usuarioService;
  }

  async execute({ user, password }: LogearUsuarioParams): Promise<LogearUsuarioResult | null> {
    return this.usuarioService.logearUsuario({ user, password });
  }
}
