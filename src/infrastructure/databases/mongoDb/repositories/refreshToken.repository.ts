import { IRefreshTokenRepository, RefreshTokenData } from '../../../../domain/ports/IRefreshTokenRepository';
import RefreshTokenModel, { RefreshTokenDocument } from '../schemas/RefreshToken';

export default class RefreshTokenRepository implements IRefreshTokenRepository {
  async create(userId: string, token: string, expiresAt: Date): Promise<void> {
    await RefreshTokenModel.create({
      userId,
      token,
      expiresAt,
      revoked: false
    });
  }

  async findByToken(token: string): Promise<RefreshTokenData | null> {
    const doc = await RefreshTokenModel.findOne({ token, revoked: false }).lean<RefreshTokenDocument>();
    if (!doc) return null;
    return {
      token: doc.token,
      userId: doc.userId.toString(),
      expiresAt: doc.expiresAt,
      revoked: doc.revoked
    };
  }

  async revokeByToken(token: string): Promise<void> {
    await RefreshTokenModel.updateOne({ token }, { revoked: true });
  }

  async revokeAllByUser(userId: string): Promise<void> {
    await RefreshTokenModel.updateMany({ userId }, { revoked: true });
  }
}
