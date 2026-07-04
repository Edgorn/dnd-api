export interface TokenPayload {
  id: string;
}

export interface ITokenService {
  sign(payload: TokenPayload): string;
  verify(token: string): TokenPayload | null;
}
