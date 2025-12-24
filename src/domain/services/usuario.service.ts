import IUsuarioRepository from "../repositories/IUsuarioRepository";
import { LoginParams, LoginResult, UsuarioMongo } from "../types/usuarios.types";
import * as bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';

interface UserTokenPayload extends JwtPayload {
  id: string;
  name: string;
}

export default class UsuarioService {
  constructor(private readonly usuarioRepository: IUsuarioRepository) { }

  async login({ user, password }: LoginParams): Promise<LoginResult | null> {
    const usuario = await this.usuarioRepository.buscarUsuarioPorNombre(user);

    if (!usuario) return null;

    const isPasswordValid = await bcrypt.compare(password, usuario.password);
    if (!isPasswordValid) return null;

    const token = this.generarToken(usuario);

    return {
      token,
      user: {
        id: usuario?._id.toString(),
        name: usuario?.name
      }
    }
  }

  private generarToken(usuario: UsuarioMongo): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET no está configurado en el entorno");

    const payload: UserTokenPayload = {
      id: usuario._id.toString(),
      name: usuario.name
    };

    return jwt.sign(payload, secret, { expiresIn: '24h' });
  }

  async validarToken(token: string): Promise<string | null> {
    if (!token) return null;

    try {
      const secret = process.env.JWT_SECRET!;
      const decoded = jwt.verify(token, secret) as UserTokenPayload;

      const usuario = await this.usuarioRepository.buscarUsuarioPorId(decoded.id);
      return usuario ? usuario._id.toString() : null;
    } catch (error) {
      console.warn("[AUTH] Token inválido o expirado");
      return null;
    }
  }
}
