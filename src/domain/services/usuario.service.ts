import IUsuarioRepository from "../repositories/IUsuarioRepository";
import { LoginParams, LoginResult, UsuarioMongo } from "../types/usuarios.types";
import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export default class UsuarioService {
  private usuarioRepository: IUsuarioRepository;

  constructor(usuarioRepository: IUsuarioRepository) {
    this.usuarioRepository = usuarioRepository;
  }

  async logearUsuario({ user, password }: LoginParams): Promise<LoginResult | null> {
    const usuario = await this.usuarioRepository.buscarUsuarioPorNombre(user);

    if (!usuario) return null;

    const isPasswordValid = await bcrypt.compare(password, usuario.password);
    if (!isPasswordValid) return null;

    const token = this.generarToken(usuario);

    return {
      token,
      user: {
        index: usuario?._id.toString(),
        name: usuario?.name
      }
    }
  }

  private generarToken(usuario: UsuarioMongo): string {
    return jwt.sign(
      { id: usuario._id, name: usuario.name },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );
  }

  async validarToken(token: string): Promise<string | null> {
    if (!token) return null;

    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

      const usuario = await this.usuarioRepository.buscarUsuarioPorId(decoded.id);
      return usuario ? usuario._id.toString() : null;
    } catch (error) {
      console.warn("Token inválido:", error);
      return null;
    }
  }
}
