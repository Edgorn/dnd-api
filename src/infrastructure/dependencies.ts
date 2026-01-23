import CrearCampaña from "../application/use-cases/campaña/crearCampaña.use-case";
import ObtenerCampañasPorUsuario from "../application/use-cases/campaña/obtenerCampañasPorUsuario.use-case";
import SolicitarEntradaACampaña from "../application/use-cases/campaña/solicitarEntradaACampaña.use-case";
import ObtenerCampañaPorId from "../application/use-cases/campaña/obtenerCampañaPorId.use-case";
import AceptarEntradaACampaña from "../application/use-cases/campaña/aceptarEntradaACampaña.use-case";
import DenegarEntradaACampaña from "../application/use-cases/campaña/denegarEntradaACampaña.use-case";
import AñadirPersonajeACampaña from "../application/use-cases/campaña/añadirPersonajeACampaña.use-case";
import Logear from "../application/use-cases/usuario/login.use-case";
import ObtenerTodosLosTransfondos from "../application/use-cases/transfondo/obtenerTodosLosTransfondos.use-case";
import ObtenerTodasLasRazas from "../application/use-cases/raza/obtenerTodasLasRazas.use-case";
import ObtenerTodasLasClases from "../application/use-cases/clase/obtenerTodasLasClases.use-case";
import ObtenerEquipamientosPorTipo from "../application/use-cases/equipamiento/obtenerEquipamientosPorTipos.use-case";
import ObtenerPersonajesPorUsuario from "../application/use-cases/personaje/obtenerPersonajesPorUsuario.use-case";
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

import CampañaService from "../domain/services/campaña.service";
import UsuarioService from "../domain/services/usuario.service";
import RazaService from "../domain/services/raza.service";
import TransfondoService from "../domain/services/transfondo.service";
import ClaseService from "../domain/services/clase.service";
import EquipamientoService from "../domain/services/equipamiento.service";
import PersonajeService from "../domain/services/personaje.service";
import ConjuroService from "../domain/services/conjuro.service";

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
import RazaRepository from "./databases/mongoDb/repositories/raza.repository";
import TransfondoRepository from "./databases/mongoDb/repositories/transfondo.repository";
import DañoRepository from "./databases/mongoDb/repositories/daño.repository";
import PropiedadArmaRepository from "./databases/mongoDb/repositories/propiedadesArmas.repository";
import EstadoRepository from "./databases/mongoDb/repositories/estado.repository";
import InvocacionRepository from "./databases/mongoDb/repositories/invocacion.repository";

import { CampañaController } from "./http/controllers/campaña.controller";
import { UsuarioController } from "./http/controllers/usuario.controller";
import { RazaController } from "./http/controllers/raza.controller";
import { TransfondoController } from "./http/controllers/transfondo.controller";
import { ClaseController } from "./http/controllers/clase.controller";
import { EquipamientoController } from "./http/controllers/equipamiento.controller";
import { PersonajeController } from "./http/controllers/personaje.controller";
import { ConjuroController } from "./http/controllers/conjuro.controller";
import ObtenerConjurosRituales from "../application/use-cases/conjuro/obtenerConjurosRituales.use-case";

const estadoRepository = new EstadoRepository()
const usuarioRepository = new UsuarioRepository()
const competenciaRepository = new CompetenciaRepository()
const conjuroRepository = new ConjuroRepository()
const habilidadRepository = new HabilidadRepository()
const dañoRepository = new DañoRepository()
const propiedadArmaRepository = new PropiedadArmaRepository()
const equipamientoRepository = new EquipamientoRepository(dañoRepository, propiedadArmaRepository)
const doteRepository = new DoteRepository()
const idiomaRepository = new IdiomaRepository()
const rasgoRepository = new RasgoRepository(dañoRepository, competenciaRepository, conjuroRepository, estadoRepository)
const invocacionRepository = new InvocacionRepository(conjuroRepository, rasgoRepository)
const claseRepository = new ClaseRepository(habilidadRepository, competenciaRepository, equipamientoRepository, rasgoRepository, conjuroRepository, doteRepository, invocacionRepository)

const razaRepository = new RazaRepository(
  idiomaRepository,
  conjuroRepository,
  habilidadRepository,
  competenciaRepository,
  doteRepository,
  rasgoRepository
)

const transfondoRepository = new TransfondoRepository(
  habilidadRepository,
  competenciaRepository,
  idiomaRepository,
  equipamientoRepository,
  rasgoRepository
);

const personajeRepository = new PersonajeRepository(
  usuarioRepository,
  equipamientoRepository,
  rasgoRepository,
  competenciaRepository,
  idiomaRepository,
  habilidadRepository,
  conjuroRepository,
  doteRepository,
  claseRepository,
  invocacionRepository,
  razaRepository
)

const campañaRepository = new CampañaRepository(
  usuarioRepository,
  personajeRepository
)

const campañaService = new CampañaService(campañaRepository)
const usuarioService = new UsuarioService(usuarioRepository)
const razaService = new RazaService(razaRepository)
const transfondoService = new TransfondoService(transfondoRepository)
const claseService = new ClaseService(claseRepository)
const equipamientoService = new EquipamientoService(equipamientoRepository)
const personajeService = new PersonajeService(personajeRepository)
const conjuroService = new ConjuroService(conjuroRepository)

const crearCampaña = new CrearCampaña(campañaService)
const obtenerCampañasPorUsuario = new ObtenerCampañasPorUsuario(campañaService)
const obtenerCampañaPorId = new ObtenerCampañaPorId(campañaService)
const solicitarEntradaACampaña = new SolicitarEntradaACampaña(campañaService)
const aceptarEntradaACampaña = new AceptarEntradaACampaña(campañaService)
const denegarEntradaACampaña = new DenegarEntradaACampaña(campañaService)
const añadirPersonajeACampaña = new AñadirPersonajeACampaña(campañaService)

const logearUseCase = new Logear(usuarioService)

const obtenerTodasLasRazas = new ObtenerTodasLasRazas(razaService);

const obtenerTodosLosTransfondos = new ObtenerTodosLosTransfondos(transfondoService);

const obtenerTodasLasClases = new ObtenerTodasLasClases(claseService);

const obtenerEquipamientosPorTipo = new ObtenerEquipamientosPorTipo(equipamientoService);

const obtenerPersonajesPorUsuario = new ObtenerPersonajesPorUsuario(personajeService);
const crearPersonaje = new CrearPersonaje(personajeService);
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

const obtenerConjurosPorNivelClase = new ObtenerConjurosPorNivelClase(conjuroService)
const obtenerConjurosRituales = new ObtenerConjurosRituales(conjuroService)

export const razaController = new RazaController(obtenerTodasLasRazas)

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

export const transfondoController = new TransfondoController(obtenerTodosLosTransfondos)

export const claseController = new ClaseController(obtenerTodasLasClases)

export const equipamientoController = new EquipamientoController(obtenerEquipamientosPorTipo)

export const personajeController = new PersonajeController(
  obtenerPersonajesPorUsuario,
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
  aprenderConjuros
)

export const conjuroController = new ConjuroController(
  obtenerConjurosPorNivelClase,
  obtenerConjurosRituales
)
