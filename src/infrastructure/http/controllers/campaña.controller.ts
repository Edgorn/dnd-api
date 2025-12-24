import ValidarToken from "../../../application/use-cases/usuario/validarToken.use-case";
import UsuarioService from "../../../domain/services/usuario.service";
import UsuarioRepository from "../../databases/mongoDb/repositories/usuario.repository";

const usuarioService = new UsuarioService(new UsuarioRepository())
const validarToken = new ValidarToken(usuarioService)

import CampañaRepository from "../../databases/mongoDb/repositories/campaña.repository";
import CrearCampaña from "../../../application/use-cases/campaña/crearCampaña.use-case";
import CampañaService from "../../../domain/services/campaña.service";
import ObtenerCampañasPorUsuario from "../../../application/use-cases/campaña/obtenerCampañasPorUsuario.use-case";
import ObtenerCampañaPorId from "../../../application/use-cases/campaña/obtenerCampañaPorId.use-case";
import SolicitarEntradaACampaña from "../../../application/use-cases/campaña/solicitarEntradaACampaña.use-case";
import AceptarEntradaACampaña from "../../../application/use-cases/campaña/aceptarEntradaACampaña.use-case";
import DenegarEntradaACampaña from "../../../application/use-cases/campaña/denegarEntradaACampaña.use-case";
import { Request, Response } from "express";
import PersonajeRepository from "../../databases/mongoDb/repositories/personaje.repository";
import EquipamientoRepository from "../../databases/mongoDb/repositories/equipamiento.repository";
import RasgoRepository from "../../databases/mongoDb/repositories/rasgo.repository";
import CompetenciaRepository from "../../databases/mongoDb/repositories/competencia.repository";
import ConjuroRepository from "../../databases/mongoDb/repositories/conjuros.repository";
import HabilidadRepository from "../../databases/mongoDb/repositories/habilidad.repository";
import ClaseRepository from "../../databases/mongoDb/repositories/clase.repository";
import IdiomaRepository from "../../databases/mongoDb/repositories/idioma.repository";
import DoteRepository from "../../databases/mongoDb/repositories/dote.repository";
import AñadirPersonajeACampaña from "../../../application/use-cases/campaña/añadirPersonajeACampaña.use-case";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";

const usuarioRepository = new UsuarioRepository()
const competenciaRepository = new CompetenciaRepository()
const conjuroRepository = new ConjuroRepository()
const habilidadRepository = new HabilidadRepository()
const equipamientoRepository = new EquipamientoRepository()

const rasgoRepository = new RasgoRepository(undefined, competenciaRepository, conjuroRepository)
const claseRepository = new ClaseRepository(habilidadRepository, competenciaRepository, equipamientoRepository, rasgoRepository, conjuroRepository, new DoteRepository())

const campañaRepository = new CampañaRepository(
  usuarioRepository,
  new PersonajeRepository(
    usuarioRepository,
    equipamientoRepository,
    rasgoRepository,
    competenciaRepository,
    new IdiomaRepository(),
    habilidadRepository,
    conjuroRepository,
    new DoteRepository(),
    claseRepository
  )
)

const campañaService = new CampañaService(campañaRepository)

const crearCampaña = new CrearCampaña(campañaService)
const obtenerCampañasPorUsuario = new ObtenerCampañasPorUsuario(campañaService)
const obtenerCampañaPorId = new ObtenerCampañaPorId(campañaService)
const solicitarEntradaACampaña = new SolicitarEntradaACampaña(campañaService)
const aceptarEntradaACampaña = new AceptarEntradaACampaña(campañaService)
const denegarEntradaACampaña = new DenegarEntradaACampaña(campañaService)
const añadirPersonajeACampaña = new AñadirPersonajeACampaña(campañaService)

const getCampaigns = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const data = await obtenerCampañasPorUsuario.execute(userId)
    res.status(200).json(data);
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al consultar campañas' });
  }
};

const createCampaign = async (req: Request, res: Response) => {
  try {
    const masterId = (req as AuthenticatedRequest).user;

    if (!masterId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const data = await crearCampaña.execute({ ...req.body, master: masterId })
    res.status(200).json(data);
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al crear campaña' });
  }
};

const getCampaign = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Se requiere el ID de la campaña' });
    }

    const data = await obtenerCampañaPorId.execute(userId, id)
    res.status(200).json(data);
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al consultar campañas' });
  }
};

const requestJoinCampaign = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Se requiere el ID de la campaña' });
    }

    const data = await solicitarEntradaACampaña.execute(userId, id)
    res.status(200).json(data);
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al solicitar entrada a la campaña' });
  }
};

const denyJoinRequest = async (req: Request, res: Response) => {
  try {
    const masterId = (req as AuthenticatedRequest).user;
    const { id, userId } = req.params;

    if (!masterId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Se requiere el ID de la campaña' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'Se requiere el ID del usuario' });
    }

    const data = await denegarEntradaACampaña.execute({ masterId, campaignId: id, userId })
    res.status(200).json(data);
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al denegar solicitud' });
  }
};

const acceptJoinRequest = async (req: Request, res: Response) => {
  try {
    const masterId = (req as AuthenticatedRequest).user;
    const { id, userId } = req.params;

    if (!masterId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Se requiere el ID de la campaña' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'Se requiere el ID del usuario' });
    }

    const data = await aceptarEntradaACampaña.execute({ masterId, campaignId: id, userId })
    res.status(200).json(data);
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al aceptar solicitud' });
  }
};

const addCharacterToCampaign = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user;
    const { id } = req.params;
    const { characterId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Se requiere el ID de la campaña' });
    }

    if (!characterId) {
      return res.status(400).json({ error: 'Se requiere el ID del personaje' });
    }

    const data = await añadirPersonajeACampaña.execute({ userId, campaignId: id, characterId })
    res.status(200).json(data);
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al denegar solicitud' });
  }
};

export default { getCampaigns, createCampaign, getCampaign, requestJoinCampaign, acceptJoinRequest, denyJoinRequest, addCharacterToCampaign };