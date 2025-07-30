import ObtenerTodasLasRazas from '../../../application/use-cases/obtenerTodasLasRazas';
import RazaService from '../../../domain/services/raza.service';
import RazaRepository from '../../databases/mongoDb/repositories/raza.repository';

const razaService = new RazaService(new RazaRepository())
const obtenerTodasLasRazas = new ObtenerTodasLasRazas(razaService);

import ValidarToken from "../../../application/use-cases/usuario/validarToken.use-case";
import UsuarioService from "../../../domain/services/usuario.service";
import UsuarioRepository from "../../databases/mongoDb/repositories/usuario.repository";

const usuarioService = new UsuarioService(new UsuarioRepository())
const validarToken = new ValidarToken(usuarioService)


const getRazas = async (req: any, res: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  try {
    const validToken = await validarToken.execute(token)

    if (validToken) {
      const { success, data, message } = await obtenerTodasLasRazas.execute()

      if (success) {
        res.status(200).json(data);
      } else {
        res.status(404).json({ error: message });
      }
    } else {
      res.status(401).json({ error: 'Token invalido' });
    }
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al recuperar las razas' });
  }
};

export default { getRazas };