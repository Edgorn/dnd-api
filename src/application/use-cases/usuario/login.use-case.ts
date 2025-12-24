import UsuarioService from '../../../domain/services/usuario.service';
import { LoginParams, LoginResult } from '../../../domain/types/usuarios.types';

export default class LoginUseCase {
  constructor(private readonly usuarioService: UsuarioService) { }

  execute({ user, password }: LoginParams): Promise<LoginResult | null> {
    return this.usuarioService.login({ user, password });
  }
}
