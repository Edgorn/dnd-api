import UsuarioService from '../../domain/services/usuario.service';

export default class ValidarToken {
  private usuarioService: UsuarioService;

  constructor(usuarioService: UsuarioService) {
    this.usuarioService = usuarioService;
  }

  async execute(token: string): Promise<string | null> {
    return await this.usuarioService.validarToken(token);
  }
}
