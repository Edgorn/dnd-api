export interface LogearUsuarioParams {
  user: string;
  password: string;
}

export interface LogearUsuarioResult {
  token: any;
  user: {
    name: any;
  };
}
