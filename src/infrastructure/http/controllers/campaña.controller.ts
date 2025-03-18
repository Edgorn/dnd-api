import ValidarToken from "../../../application/use-cases/validarToken";
import UsuarioService from "../../../domain/services/usuario.service";
import UsuarioRepository from "../../databases/mongoDb/repositories/usuario.repository";

const usuarioService = new UsuarioService(new UsuarioRepository())
const validarToken = new ValidarToken(usuarioService)

import CampañaRepository from "../../databases/mongoDb/repositories/campaña.repository";
import CrearCampaña from "../../../application/use-cases/crearCampaña";
import CampañaService from "../../../domain/services/campaña.service";
import ConsultarCampañas from "../../../application/use-cases/consultarCampañas";
import ConsultarCampaña from "../../../application/use-cases/consultarCampaña";
import EntrarCampaña from "../../../application/use-cases/entrarCampaña";
import AceptarUsuarioCampaña from "../../../application/use-cases/aceptarUsuarioCampaña";
import DenegarUsuarioCampaña from "../../../application/use-cases/denegarUsuarioCampaña";
import EntrarPersonajeCampaña from "../../../application/use-cases/entrarPersonajeCampaña";

const campañaService = new CampañaService(new CampañaRepository())

const crearCampaña = new CrearCampaña(campañaService)
const consultarCampañas = new ConsultarCampañas(campañaService)
const consultarCampaña = new ConsultarCampaña(campañaService)
const entrarCampaña = new EntrarCampaña(campañaService)
const aceptarUsuarioCampaña = new AceptarUsuarioCampaña(campañaService)
const denegarUsuarioCampaña = new DenegarUsuarioCampaña(campañaService)
const entregarPersonajeCampaña = new EntrarPersonajeCampaña(campañaService)

const createCampaign = async (req: any, res: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  try {
    const idMaster = await validarToken.execute(token)

    if (idMaster) {
      const { success, data, message } = await crearCampaña.execute({ ...req.body, master: idMaster })

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

const getCampaign = async (req: any, res: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  try {
    const idUser = await validarToken.execute(token)

    if (idUser) {
      const { id } = req.params;

      let response: any = {
        success: false,
        data: {},
        message: 'Error'
      }
      
      if (id) {
        response = await consultarCampaña.execute(idUser, id)
      } else {
        response = await consultarCampañas.execute(idUser)
      }
      
      const { success, data, message } = response
      
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
    res.status(500).json({ error: 'Error al consultar campañas' });
  }
};

const entryCampaign = async (req: any, res: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  try {
    const idUser = await validarToken.execute(token)

    if (idUser) {
      const { id } = req.body;

      const { success, data, message } = await entrarCampaña.execute(idUser, id)
      
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
    res.status(500).json({ error: 'Error al consultar campañas' });
  }
};

const acceptUserRequest = async (req: any, res: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  try {
    const idMaster = await validarToken.execute(token)

    if (idMaster) {
      const { idUser, idCampaign } = req.body;
      const { success, data, message } = await aceptarUsuarioCampaña.execute(idMaster, idUser, idCampaign)
      
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
    res.status(500).json({ error: 'Error al aceptar solicitud' });
  }
};

const denyUserRequest = async (req: any, res: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  try {
    const idMaster = await validarToken.execute(token)

    if (idMaster) {
      const { idUser, idCampaign } = req.body;
      const { success, data, message } = await denegarUsuarioCampaña.execute(idMaster, idUser, idCampaign)
      
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
    res.status(500).json({ error: 'Error al denegar solicitud' });
  }
};

const entryCharacter = async (req: any, res: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  try {
    const idUser = await validarToken.execute(token)

    if (idUser) {
      const { idCharacter, idCampaign } = req.body;
      const { success, data, message } = await entregarPersonajeCampaña.execute(idUser, idCharacter, idCampaign)

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
    res.status(500).json({ error: 'Error al denegar solicitud' });
  }
};

export default { createCampaign, getCampaign, entryCampaign, acceptUserRequest, denyUserRequest, entryCharacter };