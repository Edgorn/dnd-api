import IUsuarioRepository from "../repositories/IUsuarioRepository";
import { LogearUsuarioParams, LogearUsuarioResult, UsuarioMongo } from "../types/usuarios";
const jwt = require('jsonwebtoken')

export default class UsuarioService {
  private usuarioRepository: IUsuarioRepository;

  constructor(usuarioRepository: IUsuarioRepository) {
    this.usuarioRepository = usuarioRepository;
  }

  async logearUsuario({ user, password }: LogearUsuarioParams): Promise<LogearUsuarioResult | null> {
    const usuario = await this.usuarioRepository.buscarUsuarioPorNombre(user);
    
    if (!usuario) return null;

    // Aquí iría bcrypt.compare(password, usuario.passwordHash)
    if (usuario.password !== password) return null;

    const token = this.generarToken(usuario);

    return { 
      token,
      user: {
        name: usuario?.name
      }
    }
  }

  private generarToken(usuario: UsuarioMongo): string {
    return jwt.sign(
      { id: usuario._id, name: usuario.name },
      process.env.JWT_SECRET!
    );
  }

  async validarToken(token: string): Promise<string | null> {
    const result = await this.usuarioRepository.validarToken(token);
    return result
  }
}
