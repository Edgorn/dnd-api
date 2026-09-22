export interface User {
  id: string;
  name: string;
  password: string;
  accessibleSystems: string[];
  isAdmin: boolean;
  deletedAt: Date | null;
}


export interface UserApi {
  id: string,
  name: string
}

export interface UserProfile {
  id: string;
  name: string;
  accessibleSystems: string[];
  isAdmin: boolean;
}

export interface UpdateUserProfileData {
  name?: string;
  accessibleSystems?: string[];
}

export interface UpdateUserProfileParams extends UpdateUserProfileData {
  actorId: string;
  id: string;
}

export interface CreateUserParams {
  name: string;
  password: string;
  accessibleSystems?: string[];
}

export interface CreateUserRecord {
  name: string;
  password: string;
  accessibleSystems: string[];
}

export interface UpdateUserNameParams {
  id: string;
  name: string;
}

export interface ChangePasswordParams {
  id: string;
  currentPassword: string;
  newPassword: string;
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