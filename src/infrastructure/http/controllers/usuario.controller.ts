import { Request, Response } from "express";
import Logear from "../../../application/use-cases/usuario/logear.use-case";
import UsuarioService from "../../../domain/services/usuario.service";
import UsuarioRepository from "../../databases/mongoDb/repositories/usuario.repository";

const usuarioService = new UsuarioService(new UsuarioRepository())
const logear = new Logear(usuarioService)

export class UsuarioController {
  constructor(private readonly logearUseCase: Logear) {}

  login = async (req: Request, res: Response) => {
    try {
      const { user, password } = req.body

      const data = await this.logearUseCase.execute({ user, password })

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
}

const usuarioController = new UsuarioController(logear);
export default usuarioController;