
import ObtenerTodasLasClases from '../../../application/use-cases/obtenerTodasLasClases';
import ClaseService from '../../../domain/services/clase.service';
import ClaseRepository from '../../databases/mongoDb/repositories/clase.repository';

const claseService = new ClaseService(new ClaseRepository())
const obtenerTodasLasClases = new ObtenerTodasLasClases(claseService);

import ValidarToken from "../../../application/use-cases/validarToken";
import UsuarioService from "../../../domain/services/usuario.service";
import UsuarioRepository from "../../databases/mongoDb/repositories/usuario.repository";

const usuarioService = new UsuarioService(new UsuarioRepository())
const validarToken = new ValidarToken(usuarioService)

const getClases = async (req: any, res: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  try {
    const validToken = await validarToken.execute(token)
    
    if (validToken) {
      const { success, data, message } = await obtenerTodasLasClases.execute()

      if (success) {
        res.status(200).json(data);
      } else {
        res.status(404).json({ error: message });
      }
    } else {
      res.status(401).json({ error: 'Token invalido' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Error al recuperar las clases' });
  }
};

export default { getClases };