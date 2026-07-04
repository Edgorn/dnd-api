import jwt, { SignOptions } from 'jsonwebtoken';
import { ITokenService, TokenPayload } from '../../domain/ports/ITokenService';

export class JwtTokenService implements ITokenService {
  private readonly secret: string;
  private readonly expiresIn: SignOptions['expiresIn'];

  constructor(secret: string, expiresIn: SignOptions['expiresIn'] = '15m') {
    if (!secret) {
      throw new Error('JWT_SECRET no está configurado en el entorno');
    }
    this.secret = secret;
    this.expiresIn = expiresIn;
  }

  sign(payload: TokenPayload): string {
    return jwt.sign({ id: payload.id }, this.secret, { expiresIn: this.expiresIn });
  }

  verify(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret) as jwt.JwtPayload;
      if (!decoded || typeof decoded.id !== 'string') return null;
      return { id: decoded.id };
    } catch {
      return null;
    }
  }
}
