import LogearUsuario from "../../../application/use-cases/logearUsuario";
import UsuarioService from "../../../domain/services/usuario.service";
import UsuarioRepository from "../../databases/mongoDb/repositories/usuario.repository";

const usuarioService = new UsuarioService(new UsuarioRepository())
const logearUsuario = new LogearUsuario(usuarioService)

const login = async (req: any, res: any) => {

  try {
    const { user, password } = req.body
    
    console.log(user)
    console.log(password)

    const { success, data, message } = await logearUsuario.execute({ user, password })

    if (success) {
      res.status(200).json(data);
    } else {
      res.status(404).json({ error: message });
    }
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al iniciar sesion' });
  }
};

export default { login };