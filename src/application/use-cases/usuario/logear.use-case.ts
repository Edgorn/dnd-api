import UsuarioService from '../../../domain/services/usuario.service';
import { LoginParams, LoginResult } from '../../../domain/types/usuarios.types';

export default class Logear {
  private usuarioService: UsuarioService;

  constructor(usuarioService: UsuarioService) {
    this.usuarioService = usuarioService;
  }

  async execute({ user, password }: LoginParams): Promise<LoginResult | null> {
    return this.usuarioService.logearUsuario({ user, password });
  }
}
