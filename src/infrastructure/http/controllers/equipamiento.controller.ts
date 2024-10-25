import EquipamientoRepository from "../../databases/mongoDb/repositories/equipamiento.repository";
import EquipamientoService from "../../../domain/services/equipamiento.service";
import ConsultarEquipamientos from "../../../application/use-cases/consultarEquipamientos";
import AñadirEquipo from "../../../application/use-cases/añadirEquipo";

const equipamientoService = new EquipamientoService(new EquipamientoRepository)
const consultarEquipamientos = new ConsultarEquipamientos(equipamientoService);

import ValidarToken from "../../../application/use-cases/validarToken";
import UsuarioService from "../../../domain/services/usuario.service";
import UsuarioRepository from "../../databases/mongoDb/repositories/usuario.repository";

const usuarioService = new UsuarioService(new UsuarioRepository())
const validarToken = new ValidarToken(usuarioService)


const getEquipamientos = async (req: any, res: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  try {
    const validToken = await validarToken.execute(token)

    if (validToken) {
      const { success, data, message } = await consultarEquipamientos.execute(req.params)

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
    res.status(500).json({ error: 'Error al consultar equipamiento' });
  }
};

export default { getEquipamientos };