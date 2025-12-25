import CrearCampaña from "../application/use-cases/campaña/crearCampaña.use-case";
import ObtenerCampañasPorUsuario from "../application/use-cases/campaña/obtenerCampañasPorUsuario.use-case";
import SolicitarEntradaACampaña from "../application/use-cases/campaña/solicitarEntradaACampaña.use-case";
import ObtenerCampañaPorId from "../application/use-cases/campaña/obtenerCampañaPorId.use-case";
import AceptarEntradaACampaña from "../application/use-cases/campaña/aceptarEntradaACampaña.use-case";
import DenegarEntradaACampaña from "../application/use-cases/campaña/denegarEntradaACampaña.use-case";
import AñadirPersonajeACampaña from "../application/use-cases/campaña/añadirPersonajeACampaña.use-case";
import Logear from "../application/use-cases/usuario/login.use-case";

import CampañaService from "../domain/services/campaña.service";
import UsuarioService from "../domain/services/usuario.service";

import CampañaRepository from "./databases/mongoDb/repositories/campaña.repository";
import ClaseRepository from "./databases/mongoDb/repositories/clase.repository";
import CompetenciaRepository from "./databases/mongoDb/repositories/competencia.repository";
import ConjuroRepository from "./databases/mongoDb/repositories/conjuros.repository";
import DoteRepository from "./databases/mongoDb/repositories/dote.repository";
import EquipamientoRepository from "./databases/mongoDb/repositories/equipamiento.repository";
import HabilidadRepository from "./databases/mongoDb/repositories/habilidad.repository";
import IdiomaRepository from "./databases/mongoDb/repositories/idioma.repository";
import PersonajeRepository from "./databases/mongoDb/repositories/personaje.repository";
import RasgoRepository from "./databases/mongoDb/repositories/rasgo.repository";
import UsuarioRepository from "./databases/mongoDb/repositories/usuario.repository";

import { CampañaController } from "./http/controllers/campaña.controller";
import { UsuarioController } from "./http/controllers/usuario.controller";

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
const usuarioService = new UsuarioService(usuarioRepository)

const crearCampaña = new CrearCampaña(campañaService)
const obtenerCampañasPorUsuario = new ObtenerCampañasPorUsuario(campañaService)
const obtenerCampañaPorId = new ObtenerCampañaPorId(campañaService)
const solicitarEntradaACampaña = new SolicitarEntradaACampaña(campañaService)
const aceptarEntradaACampaña = new AceptarEntradaACampaña(campañaService)
const denegarEntradaACampaña = new DenegarEntradaACampaña(campañaService)
const añadirPersonajeACampaña = new AñadirPersonajeACampaña(campañaService)

const logearUseCase = new Logear(usuarioService)

export const campañaController = new CampañaController(
  crearCampaña,
  obtenerCampañasPorUsuario,
  obtenerCampañaPorId,
  solicitarEntradaACampaña,
  aceptarEntradaACampaña,
  denegarEntradaACampaña,
  añadirPersonajeACampaña
)

export const usuarioController = new UsuarioController(logearUseCase)