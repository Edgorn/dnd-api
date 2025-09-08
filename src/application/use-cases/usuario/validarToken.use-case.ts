import UsuarioService from '../../../domain/services/usuario.service';

export default class ValidarToken {
  constructor(private readonly usuarioService: UsuarioService) { }

  execute(token: string): Promise<string | null> {
    return this.usuarioService.validarToken(token);
  }
}
