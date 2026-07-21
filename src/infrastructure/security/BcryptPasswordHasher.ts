import * as bcrypt from 'bcrypt';
import { IPasswordHasher } from '../../domain/ports/IPasswordHasher';

const SALT_ROUNDS = 10;
const DUMMY_HASH = '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012';

export class BcryptPasswordHasher implements IPasswordHasher {
  readonly dummyHash = DUMMY_HASH;

  async compare(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }

  async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, SALT_ROUNDS);
  }

  static get dummyHash(): string {
    return DUMMY_HASH;
  }
}
