import { UserApi } from "./user.types";

export interface LoginGuardUpdate {
  failedLoginAttempts: number;
  lockedUntil: Date | null;
}

export interface LoginParams {
  user: string;
  password: string;
}

export interface LoginResult {
  token: string;
  refreshToken: string;
  user: UserApi;
}
