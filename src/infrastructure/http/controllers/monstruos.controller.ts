
import ValidarToken from "../../../application/use-cases/validarToken";
import UsuarioService from "../../../domain/services/usuario.service";
import UsuarioRepository from "../../databases/mongoDb/repositories/usuario.repository";

const usuarioService = new UsuarioService(new UsuarioRepository())
const validarToken = new ValidarToken(usuarioService)

import ConsultarCriaturas from "../../../application/use-cases/consultarCriaturas";
import CriaturaService from "../../../domain/services/criatura.service";
import CriaturaRepository from "../../databases/mongoDb/repositories/criaturas.repository";

const criaturaService = new CriaturaService(new CriaturaRepository())
const consultarCriaturas = new ConsultarCriaturas(criaturaService)

const getMonsters = async (req: any, res: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  try {
    const idUser = await validarToken.execute(token)

    if (idUser) {
      const { success, data, message } = await consultarCriaturas.execute()

      if (success) {
        res.status(201).json(data);
      } else {
        res.status(404).json({ error: message });
      }
    } else {
      res.status(401).json({ error: 'Token invalido' });
    }
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al crear campaña' });
  }
};

export default { getMonsters };