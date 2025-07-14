import TransfondoRepository from "../../databases/mongoDb/repositories/transfondo.repository";
import TransfondoService from "../../../domain/services/transfondo.service";
import ObtenerTodosLosTransfondos from "../../../application/use-cases/obtenerTodosLosTransfondos";

const transfondoService = new TransfondoService(new TransfondoRepository())
const obtenerTodosLosTransfondos = new ObtenerTodosLosTransfondos(transfondoService);

import ValidarToken from "../../../application/use-cases/validarToken";
import UsuarioService from "../../../domain/services/usuario.service";
import UsuarioRepository from "../../databases/mongoDb/repositories/usuario.repository";

const usuarioService = new UsuarioService(new UsuarioRepository())
const validarToken = new ValidarToken(usuarioService)

const getTransfondos = async (req: any, res: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  try {
    const validToken = await validarToken.execute(token)

    if (validToken) {
      const { success, data, message } = await obtenerTodosLosTransfondos.execute()

      if (success) {
        res.status(200).json(data);
      } else {
        res.status(404).json({ error: message });
      }
    } else {
      res.status(401).json({ error: 'Token invalido' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Error al recuperar los transfondos' });
  }
};

export default { getTransfondos };
