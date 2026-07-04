export interface User {
  id: string;
  name: string;
  password: string;
  accessibleSystems: string[];
}


export interface UserApi {
  id: string,
  name: string
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