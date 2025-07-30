import ValidarToken from "../../../application/use-cases/usuario/validarToken.use-case";
import UsuarioService from "../../../domain/services/usuario.service";
import UsuarioRepository from "../../databases/mongoDb/repositories/usuario.repository";

const usuarioService = new UsuarioService(new UsuarioRepository())
const validarToken = new ValidarToken(usuarioService)

import ConsultarNpcs from "../../../application/use-cases/consultarNpcs";
import NpcService from "../../../domain/services/npc.service";
import NpcRepository from "../../databases/mongoDb/repositories/npc.repository";

const npcService = new NpcService(new NpcRepository())
const consultarNpcs = new ConsultarNpcs(npcService)

const getNpcs = async (req: any, res: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  try {
    const idUser = await validarToken.execute(token)

    if (idUser) {
      const { success, data, message } = await consultarNpcs.execute()

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
    res.status(500).json({ error: 'Error al consultar pnjs unicos' });
  }
};

export default { getNpcs };