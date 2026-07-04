export interface RefreshTokenData {
  token: string;
  userId: string;
  expiresAt: Date;
  revoked: boolean;
}

export interface IRefreshTokenRepository {
  create(userId: string, token: string, expiresAt: Date): Promise<void>;
  findByToken(token: string): Promise<RefreshTokenData | null>;
  revokeByToken(token: string): Promise<void>;
  revokeAllByUser(userId: string): Promise<void>;
}
