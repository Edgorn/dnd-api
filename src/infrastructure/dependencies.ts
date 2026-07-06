import CrearCampaña from "../application/use-cases/campaña/crearCampaña.use-case";
import GetCampaignsByUser from "../application/use-cases/campaña/getCampaignsByUser.use-case";
import SolicitarEntradaACampaña from "../application/use-cases/campaña/solicitarEntradaACampaña.use-case";
import ObtenerCampañaPorId from "../application/use-cases/campaña/obtenerCampañaPorId.use-case";
import AceptarEntradaACampaña from "../application/use-cases/campaña/aceptarEntradaACampaña.use-case";
import DenegarEntradaACampaña from "../application/use-cases/campaña/denegarEntradaACampaña.use-case";
import AñadirPersonajeACampaña from "../application/use-cases/campaña/añadirPersonajeACampaña.use-case";
import LoginUseCase from "../application/use-cases/user/login.use-case";
import ValidateTokenUseCase from "../application/use-cases/user/validateToken.use-case";
import { createAuthMiddleware } from "./http/middlewares/auth.middleware";
import ObtenerTodosLosTransfondos from "../application/use-cases/transfondo/obtenerTodosLosTransfondos.use-case";
import ObtenerTodasLasRazas from "../application/use-cases/raza/obtenerTodasLasRazas.use-case";
import ObtenerTodasLasClases from "../application/use-cases/clase/obtenerTodasLasClases.use-case";
import ObtenerEquipamientosPorTipo from "../application/use-cases/equipamiento/obtenerEquipamientosPorTipos.use-case";
import GetCharactersByUser from "../application/use-cases/personaje/getCharactersByUser.use-case";
import CrearPersonaje from "../application/use-cases/personaje/crearPersonaje.use-case";
import ObtenerPersonajePorId from "../application/use-cases/personaje/obtenerPersonajePorId.use-case";
import ModificarXp from "../application/use-cases/personaje/modificarXp.use-case";
import SubirNivelDatos from "../application/use-cases/personaje/subirNivelDatos.use-case";
import SubirNivel from "../application/use-cases/personaje/subirNivel.use-case";
import AñadirEquipo from "../application/use-cases/personaje/añadirEquipo.use-case";
import EliminarEquipo from "../application/use-cases/personaje/eliminarEquipo.use-case";
import EquiparArmadura from "../application/use-cases/personaje/equiparArmadura.use-case.";
import ModificarDinero from "../application/use-cases/personaje/modificarDinero.use-case";
import ObtenerPdf from "../application/use-cases/personaje/obtenerPdf.use-case";
import VincularPacto from "../application/use-cases/personaje/vincularPacto.use-case";
import ObtenerConjurosPorNivelClase from "../application/use-cases/conjuro/obtenerConjurosPorNivel.use-case";
import AprenderConjuros from "../application/use-cases/personaje/aprenderConjuros.use-case";
import ObtenerConjurosRituales from "../application/use-cases/conjuro/obtenerConjurosRituales.use-case";
import ModificarLocalizacionesCampaña from "../application/use-cases/campaña/modificarLocalizacionesCampaña.use-case";
import AñadirForma from "../application/use-cases/personaje/añadirForma.use-case";
import CrearSistema from "../application/use-cases/system/crearSistema.use-case";
import GetSystemsByUser from "../application/use-cases/system/getSystemsByUser.use-case";
import ModificarSistema from "../application/use-cases/system/modificarSistema.use-case";

import CampañaService from "../domain/services/campaña.service";
import UserService from "../domain/services/user.service";
import RazaService from "../domain/services/raza.service";
import TransfondoService from "../domain/services/transfondo.service";
import ClaseService from "../domain/services/clase.service";
import EquipamientoService from "../domain/services/equipamiento.service";
import PersonajeService from "../domain/services/personaje.service";
import ConjuroService from "../domain/services/conjuro.service";
import SystemService from "../domain/services/system.service";

import CampañaRepository from "./databases/mongoDb/repositories/campaña.repository";
import ClaseRepository from "./databases/mongoDb/repositories/clase.repository";
import CompetenciaRepository from "./databases/mongoDb/repositories/competencia.repository";
import ConjuroRepository from "./databases/mongoDb/repositories/conjuros.repository";
import DoteRepository from "./databases/mongoDb/repositories/dote.repository";
import EquipamientoRepository from "./databases/mongoDb/repositories/equipamiento.repository";
import SkillRepository from "./databases/mongoDb/repositories/skill.repository";
import IdiomaRepository from "./databases/mongoDb/repositories/idioma.repository";
import PersonajeRepository from "./databases/mongoDb/repositories/personaje.repository";
import RasgoRepository from "./databases/mongoDb/repositories/rasgo.repository";
import UserRepository from "./databases/mongoDb/repositories/user.repository";
import RazaRepository from "./databases/mongoDb/repositories/raza.repository";
import TransfondoRepository from "./databases/mongoDb/repositories/transfondo.repository";
import DañoRepository from "./databases/mongoDb/repositories/daño.repository";
import PropiedadArmaRepository from "./databases/mongoDb/repositories/propiedadesArmas.repository";
import EstadoRepository from "./databases/mongoDb/repositories/estado.repository";
import InvocacionRepository from "./databases/mongoDb/repositories/invocacion.repository";
import SystemRepository from "./databases/mongoDb/repositories/system.repository";
import { BcryptPasswordHasher } from "./security/BcryptPasswordHasher";
import { JwtTokenService } from "./security/JwtTokenService";
import { InMemoryUserCache } from "./cache/InMemoryUserCache";
import RefreshTokenRepository from "./databases/mongoDb/repositories/refreshToken.repository";
import RefreshTokenUseCase from "../application/use-cases/user/refreshToken.use-case";
import LogoutUseCase from "../application/use-cases/user/logout.use-case";
import { createAuthorizeSystemMiddleware } from "./http/middlewares/authorizeSystem.middleware";





import { CampañaController } from "./http/controllers/campaña.controller";
import { UserController } from "./http/controllers/user.controller";
import { RazaController } from "./http/controllers/raza.controller";
import { TransfondoController } from "./http/controllers/transfondo.controller";
import { ClaseController } from "./http/controllers/clase.controller";
import { EquipamientoController } from "./http/controllers/equipamiento.controller";
import { PersonajeController } from "./http/controllers/personaje.controller";
import { ConjuroController } from "./http/controllers/conjuro.controller";
import { SystemController } from "./http/controllers/system.controller";
import CriaturaRepository from "./databases/mongoDb/repositories/criaturas.repository";
import { RasgoController } from "./http/controllers/rasgo.controller";
import CrearRaza from "../application/use-cases/raza/crearRaza.use-case";
import ObtenerRasgosPorSistemas from "../application/use-cases/rasgo/obtenerRasgosPorSistemas.use-case";
import RasgoService from "../domain/services/rasgo.service";
import CrearRasgo from "../application/use-cases/rasgo/crearRasgo.use-case";
import ModificarRasgo from "../application/use-cases/rasgo/modificarRasgo.use-case";
import { SkillController } from "./http/controllers/skill.controller";
import SkillService from "../domain/services/skill.service";
import GetSkillsBySystems from "../application/use-cases/skill/getSkillsBySystems.use-case";
import CreateSkill from "../application/use-cases/skill/createSkill.use-case";
import UpdateSkill from "../application/use-cases/skill/updateSkill.use-case";
import AddSystemToSkill from "../application/use-cases/skill/addSystemToSkill.use-case";
import RemoveSystemFromSkill from "../application/use-cases/skill/removeSystemFromSkill.use-case";
import ActualizarRaza from "../application/use-cases/raza/actualizarRaza.use-case";
import { IdiomaController } from "./http/controllers/idioma.controller";
import ObtenerIdiomasPorSistemas from "../application/use-cases/idioma/obtenerIdiomaPorSistema.use-case";
import CrearIdioma from "../application/use-cases/idioma/crearIdioma.use-case";
import ModificarIdioma from "../application/use-cases/idioma/modificarIdioma.use-case";
import IdiomaService from "../domain/services/idioma.service";

import CreateAttribute from "../application/use-cases/attribute/createAttribute.use-case";
import UpdateAttribute from "../application/use-cases/attribute/updateAttribute.use-case";
import AddAttributeToSystem from "../application/use-cases/attribute/addAttributeToSystem.use-case";
import RemoveAttributeFromSystem from "../application/use-cases/attribute/removeAttributeFromSystem.use-case";
import AttributeService from "../domain/services/attribute.service";
import AttributeRepository from "./databases/mongoDb/repositories/attribute.repository";
import { AttributeController } from "./http/controllers/attribute.controller";

const estadoRepository = new EstadoRepository()
const userRepository = new UserRepository()
const skillRepository = new SkillRepository()
const systemRepository = new SystemRepository(
  userRepository,
  skillRepository
)
const competenciaRepository = new CompetenciaRepository()
const conjuroRepository = new ConjuroRepository()
const dañoRepository = new DañoRepository()
const propiedadArmaRepository = new PropiedadArmaRepository()
const equipamientoRepository = new EquipamientoRepository(dañoRepository, propiedadArmaRepository)
const doteRepository = new DoteRepository()
const idiomaRepository = new IdiomaRepository(systemRepository)
const rasgoRepository = new RasgoRepository(dañoRepository, competenciaRepository, conjuroRepository, estadoRepository, systemRepository)
const attributeRepository = new AttributeRepository(systemRepository)
const attributeService = new AttributeService(attributeRepository, systemRepository)
const invocacionRepository = new InvocacionRepository(conjuroRepository, rasgoRepository)
const claseRepository = new ClaseRepository(
  skillRepository,
  competenciaRepository,
  equipamientoRepository,
  rasgoRepository,
  conjuroRepository,
  doteRepository,
  invocacionRepository,
  idiomaRepository
)

const razaRepository = new RazaRepository(
  idiomaRepository,
  conjuroRepository,
  skillRepository,
  competenciaRepository,
  doteRepository,
  rasgoRepository,
  attributeRepository,
  systemRepository
)

const transfondoRepository = new TransfondoRepository(
  skillRepository,
  competenciaRepository,
  idiomaRepository,
  equipamientoRepository,
  rasgoRepository
);

const criaturaRepository = new CriaturaRepository(
  dañoRepository,
  estadoRepository,
  idiomaRepository,
  conjuroRepository
)

const personajeRepository = new PersonajeRepository(
  userRepository,
  equipamientoRepository,
  rasgoRepository,
  competenciaRepository,
  idiomaRepository,
  skillRepository,
  conjuroRepository,
  doteRepository,
  claseRepository,
  invocacionRepository,
  razaRepository,
  criaturaRepository,
  attributeService,
  systemRepository
)

const campañaRepository = new CampañaRepository(
  userRepository,
  personajeRepository
)

const campañaService = new CampañaService(campañaRepository)
const passwordHasher = new BcryptPasswordHasher()
const tokenService = new JwtTokenService(process.env.JWT_SECRET ?? '')
const userCache = new InMemoryUserCache()
const refreshTokenRepository = new RefreshTokenRepository()
const userService = new UserService(userRepository, passwordHasher, tokenService, refreshTokenRepository, userCache)

const loginUseCase = new LoginUseCase(userService)
const refreshTokenUseCase = new RefreshTokenUseCase(userService)
const logoutUseCase = new LogoutUseCase(userService)
const validateTokenUseCase = new ValidateTokenUseCase(userService)

export const authMiddleware = createAuthMiddleware(validateTokenUseCase)



const razaService = new RazaService(razaRepository)
const transfondoService = new TransfondoService(transfondoRepository)
const claseService = new ClaseService(claseRepository)
const equipamientoService = new EquipamientoService(equipamientoRepository)
const personajeService = new PersonajeService(personajeRepository)
const conjuroService = new ConjuroService(conjuroRepository)
const rasgoService = new RasgoService(rasgoRepository)
const skillService = new SkillService(skillRepository)
const systemService = new SystemService(systemRepository)

const crearCampaña = new CrearCampaña(campañaService)
const getCampaignsByUser = new GetCampaignsByUser(campañaService)
const obtenerCampañaPorId = new ObtenerCampañaPorId(campañaService)
const solicitarEntradaACampaña = new SolicitarEntradaACampaña(campañaService)
const aceptarEntradaACampaña = new AceptarEntradaACampaña(campañaService)
const denegarEntradaACampaña = new DenegarEntradaACampaña(campañaService)
const añadirPersonajeACampaña = new AñadirPersonajeACampaña(campañaService)
const modificarLocalizacionesCampaña = new ModificarLocalizacionesCampaña(campañaService)

const obtenerTodasLasRazas = new ObtenerTodasLasRazas(razaService);
const crearRaza = new CrearRaza(razaService);
const actualizarRaza = new ActualizarRaza(razaService);

const obtenerTodosLosTransfondos = new ObtenerTodosLosTransfondos(transfondoService);

const obtenerTodasLasClases = new ObtenerTodasLasClases(claseService);

const obtenerEquipamientosPorTipo = new ObtenerEquipamientosPorTipo(equipamientoService);

const getCharactersByUser = new GetCharactersByUser(personajeService);
const crearPersonaje = new CrearPersonaje(personajeService, systemRepository);
const obtenerPersonajePorId = new ObtenerPersonajePorId(personajeService);
const modificarXp = new ModificarXp(personajeService)
const subirNivelDatos = new SubirNivelDatos(personajeService)
const subirNivel = new SubirNivel(personajeService)
const añadirEquipo = new AñadirEquipo(personajeService);
const eliminarEquipo = new EliminarEquipo(personajeService);
const equiparArmadura = new EquiparArmadura(personajeService);
const modificarDinero = new ModificarDinero(personajeService);
const obtenerPdf = new ObtenerPdf(personajeService);
const vincularPacto = new VincularPacto(personajeService);
const aprenderConjuros = new AprenderConjuros(personajeService);
const añadirForma = new AñadirForma(personajeService);
const crearSistema = new CrearSistema(systemService);
const getSystemsByUser = new GetSystemsByUser(systemService);
const modificarSistema = new ModificarSistema(systemService);

const createAttribute = new CreateAttribute(attributeService);
const updateAttribute = new UpdateAttribute(attributeService);
const addAttributeToSystem = new AddAttributeToSystem(attributeService);
const removeAttributeFromSystem = new RemoveAttributeFromSystem(attributeService);

const obtenerConjurosPorNivelClase = new ObtenerConjurosPorNivelClase(conjuroService)
const obtenerConjurosRituales = new ObtenerConjurosRituales(conjuroService)

const obtenerRasgosPorSistemasUseCase = new ObtenerRasgosPorSistemas(rasgoService)
const crearRasgoUseCase = new CrearRasgo(rasgoService)
const modificarRasgoUseCase = new ModificarRasgo(rasgoService)

const getSkillsBySystems = new GetSkillsBySystems(skillService, systemService)
const createSkill = new CreateSkill(skillService)
const updateSkill = new UpdateSkill(skillService)
const addSystemToSkill = new AddSystemToSkill(skillService)
const removeSystemFromSkill = new RemoveSystemFromSkill(skillService)

export const razaController = new RazaController(obtenerTodasLasRazas, crearRaza, actualizarRaza)

export const campañaController = new CampañaController(
  crearCampaña,
  getCampaignsByUser,
  obtenerCampañaPorId,
  solicitarEntradaACampaña,
  aceptarEntradaACampaña,
  denegarEntradaACampaña,
  añadirPersonajeACampaña,
  modificarLocalizacionesCampaña
)

export const userController = new UserController(loginUseCase, refreshTokenUseCase, logoutUseCase)

export const transfondoController = new TransfondoController(obtenerTodosLosTransfondos)

export const claseController = new ClaseController(obtenerTodasLasClases)

export const equipamientoController = new EquipamientoController(obtenerEquipamientosPorTipo)

export const personajeController = new PersonajeController(
  getCharactersByUser,
  crearPersonaje,
  obtenerPersonajePorId,
  modificarXp,
  subirNivelDatos,
  subirNivel,
  añadirEquipo,
  eliminarEquipo,
  equiparArmadura,
  modificarDinero,
  obtenerPdf,
  vincularPacto,
  aprenderConjuros,
  añadirForma
)

export const conjuroController = new ConjuroController(
  obtenerConjurosPorNivelClase,
  obtenerConjurosRituales
)

export const systemController = new SystemController(
  getSystemsByUser,
  crearSistema,
  modificarSistema
)

export const rasgoController = new RasgoController(obtenerRasgosPorSistemasUseCase, crearRasgoUseCase, modificarRasgoUseCase)

export const skillController = new SkillController(
  getSkillsBySystems,
  createSkill,
  updateSkill,
  addSystemToSkill,
  removeSystemFromSkill
)

const idiomaService = new IdiomaService(idiomaRepository)

const obtenerIdiomasPorSistemas = new ObtenerIdiomasPorSistemas(idiomaService)
const crearIdioma = new CrearIdioma(idiomaService)
const modificarIdioma = new ModificarIdioma(idiomaService)

export const idiomaController = new IdiomaController(obtenerIdiomasPorSistemas, crearIdioma, modificarIdioma)

export const attributeController = new AttributeController(
  createAttribute,
  updateAttribute,
  addAttributeToSystem,
  removeAttributeFromSystem
);

export const authorizeSystemMiddleware = createAuthorizeSystemMiddleware(userRepository);