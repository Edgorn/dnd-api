import { Request, Response } from "express";
import LogearUsuario from "../../../application/use-cases/logearUsuario";
import UsuarioService from "../../../domain/services/usuario.service";
import UsuarioRepository from "../../databases/mongoDb/repositories/usuario.repository";

const usuarioService = new UsuarioService(new UsuarioRepository())
const logearUsuario = new LogearUsuario(usuarioService)

const login = async (req: Request, res: Response) => {
  try {
    const { user, password } = req.body

    const data = await logearUsuario.execute({ user, password })

    if (!data) {
      console.warn(`Intento de login fallido para el usuario: ${user}`);
      res.status(401).json({ error: "Usuario o contraseña incorrectos" });
      return;
    }

    res.status(200).json(data);

  } catch (e) {
    console.error("Error en login:", e)
    res.status(500).json({ error: 'Error al iniciar sesion' });
  }
};

export default { login };