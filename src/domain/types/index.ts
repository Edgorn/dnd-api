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

export interface RazaMongo {
  index: string,
  name: string,
  desc: string,
  speed: string,
  size: string
}

export interface RazaApi {
  index: string,
  name: string,
  desc: string,
  speed: string,
  size: string
}