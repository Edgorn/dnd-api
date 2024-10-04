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

const campañaService = new CampañaService(new CampañaRepository())
const crearCampaña = new CrearCampaña(campañaService)
const consultarCampañas = new ConsultarCampañas(campañaService)
const consultarCampaña = new ConsultarCampaña(campañaService)
const entrarCampaña = new EntrarCampaña(campañaService)

const createCampaign = async (req: any, res: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  try {
    const validToken = await validarToken.execute(token)

    if (validToken) {
      const { success, data, message } = await crearCampaña.execute({ ...req.body, master: validToken })

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
    const validToken = await validarToken.execute(token)

    if (validToken) {
      const { id } = req.params;

      let response = {
        success: false,
        data: {},
        message: 'Error'
      }
      
      if (id) {
        response = await consultarCampaña.execute(validToken, id)
      } else {
        response = await consultarCampañas.execute(validToken)
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
    const validToken = await validarToken.execute(token)

    if (validToken) {
      const { id } = req.body;

      const { success, data, message } = await entrarCampaña.execute(validToken, id)
      
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

export default { createCampaign, getCampaign, entryCampaign };