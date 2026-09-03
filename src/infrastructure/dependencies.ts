import CrearCampaña from "../application/use-cases/campaña/crearCampaña.use-case";
import GetCampaignsByUser from "../application/use-cases/campaña/getCampaignsByUser.use-case";
import SolicitarEntradaACampaña from "../application/use-cases/campaña/solicitarEntradaACampaña.use-case";
import ObtenerCampañaPorId from "../application/use-cases/campaña/obtenerCampañaPorId.use-case";
import AceptarEntradaACampaña from "../application/use-cases/campaña/aceptarEntradaACampaña.use-case";
import CreateCoin from "../application/use-cases/coins/createCoin.use-case";
import UpdateCoin from "../application/use-cases/coins/updateCoin.use-case";
import GetCoins from "../application/use-cases/coins/getCoins.use-case";
import GetCoinById from "../application/use-cases/coins/getCoinById.use-case";
import DeleteCoin from "../application/use-cases/coins/deleteCoin.use-case";
import RestoreCoin from "../application/use-cases/coins/restoreCoin.use-case";
import CoinRepository from "./databases/mongoDb/repositories/coin.repository";
import { CoinController } from "./http/controllers/coin.controller";
import DenegarEntradaACampaña from "../application/use-cases/campaña/denegarEntradaACampaña.use-case";
import AñadirPersonajeACampaña from "../application/use-cases/campaña/añadirPersonajeACampaña.use-case";
import LoginUseCase from "../application/use-cases/user/login.use-case";
import ValidateTokenUseCase from "../application/use-cases/user/validateToken.use-case";
import { createAuthMiddleware } from "./http/middlewares/auth.middleware";
import GetBackgroundsBySystems from "../application/use-cases/background/getBackgroundsBySystems.use-case";
import GetBackgroundById from "../application/use-cases/background/getBackgroundById.use-case";
import CreateBackground from "../application/use-cases/background/createBackground.use-case";
import UpdateBackground from "../application/use-cases/background/updateBackground.use-case";
import SoftDeleteBackground from "../application/use-cases/background/softDeleteBackground.use-case";
import RestoreBackground from "../application/use-cases/background/restoreBackground.use-case";
import GetAllRacesUseCase from "../application/use-cases/race/getAllRaces.use-case";
import GetCharacterClassesBySystems from "../application/use-cases/characterClass/getCharacterClassesBySystems.use-case";
import CreateCharacterClass from "../application/use-cases/characterClass/createCharacterClass.use-case";
import UpdateCharacterClass from "../application/use-cases/characterClass/updateCharacterClass.use-case";
import SoftDeleteCharacterClass from "../application/use-cases/characterClass/softDeleteCharacterClass.use-case";
import RestoreCharacterClass from "../application/use-cases/characterClass/restoreCharacterClass.use-case";
import CreateEquipment from "../application/use-cases/equipment/createEquipment.use-case";
import UpdateEquipment from "../application/use-cases/equipment/updateEquipment.use-case";
import GetEquipmentById from "../application/use-cases/equipment/getEquipmentById.use-case";
import GetEquipmentsBySystems from "../application/use-cases/equipment/getEquipmentsBySystems.use-case";
import SoftDeleteEquipment from "../application/use-cases/equipment/softDeleteEquipment.use-case";
import RestoreEquipment from "../application/use-cases/equipment/restoreEquipment.use-case";
import GetEquipmentsByTypes from "../application/use-cases/equipment/getEquipmentsByTypes.use-case";
import GetEquipmentsWeapons from "../application/use-cases/equipment/getEquipmentsWeapons.use-case";
import EquipmentService from "../domain/services/equipment.service";
import EquipmentRepository from "./databases/mongoDb/repositories/equipment.repository";
import { EquipmentController } from "./http/controllers/equipment.controller";
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
import ToggleFavoriteEquipment from "../application/use-cases/personaje/toggleFavoriteEquipment.use-case";
import AprenderConjuros from "../application/use-cases/personaje/aprenderConjuros.use-case";
import ModificarLocalizacionesCampaña from "../application/use-cases/campaña/modificarLocalizacionesCampaña.use-case";
import AñadirForma from "../application/use-cases/personaje/añadirForma.use-case";
import CreateSystem from "../application/use-cases/system/createSystem.use-case";
import GetSystemsByUser from "../application/use-cases/system/getSystemsByUser.use-case";
import UpdateSystem from "../application/use-cases/system/updateSystem.use-case";
import GetSystemApi from "../application/use-cases/system/getSystemApi.use-case";
import CascadeSoftDeleteSystem from "../application/use-cases/system/cascadeSoftDeleteSystem.use-case";
import CascadeRestoreSystem from "../application/use-cases/system/cascadeRestoreSystem.use-case";

import ProficiencyService from "../domain/services/proficiency.service";
import CreateProficiency from "../application/use-cases/proficiency/createProficiency.use-case";
import UpdateProficiency from "../application/use-cases/proficiency/updateProficiency.use-case";
import SoftDeleteProficiency from "../application/use-cases/proficiency/softDeleteProficiency.use-case";
import RestoreProficiency from "../application/use-cases/proficiency/restoreProficiency.use-case";
import GetProficienciesBySystems from "../application/use-cases/proficiency/getProficienciesBySystems.use-case";
import { ProficiencyController } from "./http/controllers/proficiency.controller";

import CampañaService from "../domain/services/campaña.service";
import UserService from "../domain/services/user.service";
import RaceService from "../domain/services/race.service";
import BackgroundService from "../domain/services/background.service";
import CharacterClassService from "../domain/services/characterClass.service";
import PersonajeService from "../domain/services/personaje.service";
import SpellService from "../domain/services/spell.service";
import SystemService from "../domain/services/system.service";

import CampañaRepository from "./databases/mongoDb/repositories/campaña.repository";
import CharacterClassRepository from "./databases/mongoDb/repositories/characterClass.repository";
import ProficiencyRepository from "./databases/mongoDb/repositories/proficiency.repository";
import SpellRepository from "./databases/mongoDb/repositories/spell.repository";
import DoteRepository from "./databases/mongoDb/repositories/dote.repository";
import SkillRepository from "./databases/mongoDb/repositories/skill.repository";
import LanguageRepository from "./databases/mongoDb/repositories/language.repository";
import PersonajeRepository from "./databases/mongoDb/repositories/personaje.repository";
import TraitRepository from "./databases/mongoDb/repositories/trait.repository";
import UserRepository from "./databases/mongoDb/repositories/user.repository";
import RaceRepository from "./databases/mongoDb/repositories/race.repository";
import BackgroundRepository from "./databases/mongoDb/repositories/background.repository";
import DamageRepository from "./databases/mongoDb/repositories/damage.repository";
import DamageService from "../domain/services/damage.service";
import CreateDamage from "../application/use-cases/damage/createDamage.use-case";
import UpdateDamage from "../application/use-cases/damage/updateDamage.use-case";
import SoftDeleteDamage from "../application/use-cases/damage/softDeleteDamage.use-case";
import RestoreDamage from "../application/use-cases/damage/restoreDamage.use-case";
import GetDamagesBySystems from "../application/use-cases/damage/getDamagesBySystems.use-case";
import { DamageController } from "./http/controllers/damage.controller";
import PropertyRepository from "./databases/mongoDb/repositories/property.repository";
import PropertyService from "../domain/services/property.service";
import CreateProperty from "../application/use-cases/property/createProperty.use-case";
import UpdateProperty from "../application/use-cases/property/updateProperty.use-case";
import SoftDeleteProperty from "../application/use-cases/property/softDeleteProperty.use-case";
import RestoreProperty from "../application/use-cases/property/restoreProperty.use-case";
import GetPropertiesBySystems from "../application/use-cases/property/getPropertiesBySystems.use-case";
import GetPropertyById from "../application/use-cases/property/getPropertyById.use-case";
import { PropertyController } from "./http/controllers/property.controller";
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
import { RaceController } from "./http/controllers/race.controller";
import { BackgroundController } from "./http/controllers/background.controller";
import { CharacterClassController } from "./http/controllers/characterClass.controller";
import { PersonajeController } from "./http/controllers/personaje.controller";
import { SpellController } from "./http/controllers/spell.controller";
import { SystemController } from "./http/controllers/system.controller";
import CriaturaRepository from "./databases/mongoDb/repositories/criaturas.repository";
import { TraitController } from "./http/controllers/trait.controller";
import GetTraitsBySystemsUseCase from "../application/use-cases/trait/getTraitsBySystems.use-case";
import TraitService from "../domain/services/trait.service";
import CreateTraitUseCase from "../application/use-cases/trait/createTrait.use-case";
import UpdateTraitUseCase from "../application/use-cases/trait/updateTrait.use-case";
import SoftDeleteTraitUseCase from "../application/use-cases/trait/softDeleteTrait.use-case";
import RestoreTraitUseCase from "../application/use-cases/trait/restoreTrait.use-case";
import { SkillController } from "./http/controllers/skill.controller";
import SkillService from "../domain/services/skill.service";
import GetSkillsBySystems from "../application/use-cases/skill/getSkillsBySystems.use-case";
import CreateSkill from "../application/use-cases/skill/createSkill.use-case";
import UpdateSkill from "../application/use-cases/skill/updateSkill.use-case";
import CreateRaceUseCase from "../application/use-cases/race/createRace.use-case";
import UpdateRaceUseCase from "../application/use-cases/race/updateRace.use-case";
import SoftDeleteRace from "../application/use-cases/race/softDeleteRace.use-case";
import RestoreRace from "../application/use-cases/race/restoreRace.use-case";
import { LanguageController } from "./http/controllers/language.controller";
import GetLanguagesBySystem from "../application/use-cases/language/getLanguagesBySystem.use-case";
import CreateLanguage from "../application/use-cases/language/createLanguage.use-case";
import UpdateLanguage from "../application/use-cases/language/updateLanguage.use-case";
import LanguageService from "../domain/services/language.service";

import CreateAttribute from "../application/use-cases/attribute/createAttribute.use-case";
import UpdateAttribute from "../application/use-cases/attribute/updateAttribute.use-case";
import GetAttributesBySystems from "../application/use-cases/attribute/getAttributesBySystems.use-case";
import AttributeService from "../domain/services/attribute.service";
import AttributeRepository from "./databases/mongoDb/repositories/attribute.repository";
import { AttributeController } from "./http/controllers/attribute.controller";

import SoftDeleteAttribute from "../application/use-cases/attribute/softDeleteAttribute.use-case";
import RestoreAttribute from "../application/use-cases/attribute/restoreAttribute.use-case";
import SoftDeleteSkill from "../application/use-cases/skill/softDeleteSkill.use-case";
import RestoreSkill from "../application/use-cases/skill/restoreSkill.use-case";
import SoftDeleteLanguage from "../application/use-cases/language/softDeleteLanguage.use-case";
import RestoreLanguage from "../application/use-cases/language/restoreLanguage.use-case";

import CreateSpell from "../application/use-cases/spell/createSpell.use-case";
import UpdateSpell from "../application/use-cases/spell/updateSpell.use-case";
import SoftDeleteSpell from "../application/use-cases/spell/softDeleteSpell.use-case";
import RestoreSpell from "../application/use-cases/spell/restoreSpell.use-case";
import GetSpellsBySystems from "../application/use-cases/spell/getSpellsBySystems.use-case";
import GetSpellById from "../application/use-cases/spell/getSpellById.use-case";
import GetSpellsByLevel from "../application/use-cases/spell/getSpellsByLevel.use-case";
import GetRitualSpells from "../application/use-cases/spell/getRitualSpells.use-case";

import MagicSchoolRepository from "./databases/mongoDb/repositories/magicSchool.repository";
import MagicSchoolService from "../domain/services/magicSchool.service";
import CreateMagicSchool from "../application/use-cases/magicSchool/createMagicSchool.use-case";
import UpdateMagicSchool from "../application/use-cases/magicSchool/updateMagicSchool.use-case";
import SoftDeleteMagicSchool from "../application/use-cases/magicSchool/softDeleteMagicSchool.use-case";
import RestoreMagicSchool from "../application/use-cases/magicSchool/restoreMagicSchool.use-case";
import GetMagicSchoolsBySystems from "../application/use-cases/magicSchool/getMagicSchoolsBySystems.use-case";
import { MagicSchoolController } from "./http/controllers/magicSchool.controller";

const estadoRepository = new EstadoRepository()
const userRepository = new UserRepository()
const systemRepository = new SystemRepository()
const skillRepository = new SkillRepository(systemRepository)
const proficiencyRepository = new ProficiencyRepository(systemRepository)
const spellRepository = new SpellRepository(systemRepository)
const damageRepository = new DamageRepository(systemRepository)
const propertyRepository = new PropertyRepository(systemRepository)
const equipmentRepository = new EquipmentRepository(systemRepository, damageRepository, propertyRepository, proficiencyRepository)
const doteRepository = new DoteRepository()
const languageRepository = new LanguageRepository(systemRepository)
const traitRepository = new TraitRepository(damageRepository, proficiencyRepository, spellRepository, estadoRepository, skillRepository)
const attributeRepository = new AttributeRepository(systemRepository)
const attributeService = new AttributeService(attributeRepository, systemRepository)
const skillService = new SkillService(skillRepository)
const coinRepository = new CoinRepository(systemRepository)
const invocacionRepository = new InvocacionRepository(spellRepository, traitRepository)
const characterClassRepository = new CharacterClassRepository(
  systemRepository,
  skillService,
  proficiencyRepository,
  equipmentRepository,
  traitRepository,
  spellRepository,
  doteRepository,
  invocacionRepository,
  languageRepository,
  attributeService
);

const raceRepository = new RaceRepository(
  languageRepository,
  spellRepository,
  skillService,
  proficiencyRepository,
  doteRepository,
  traitRepository,
  attributeService,
  systemRepository
)

const backgroundRepository = new BackgroundRepository(
  systemRepository,
  skillRepository,
  proficiencyRepository,
  languageRepository,
  equipmentRepository,
  traitRepository,
  coinRepository
);

const criaturaRepository = new CriaturaRepository(
  damageRepository,
  estadoRepository,
  languageRepository,
  spellRepository
)

const personajeRepository = new PersonajeRepository(
  userRepository,
  equipmentRepository,
  traitRepository,
  proficiencyRepository,
  languageRepository,
  skillService,
  spellRepository,
  doteRepository,
  characterClassRepository,
  invocacionRepository,
  raceRepository,
  criaturaRepository,
  attributeService,
  systemRepository,
  coinRepository
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

const raceService = new RaceService(raceRepository)
const backgroundService = new BackgroundService(backgroundRepository)
const characterClassService = new CharacterClassService(characterClassRepository)
const equipmentService = new EquipmentService(equipmentRepository)
const personajeService = new PersonajeService(personajeRepository)
const spellService = new SpellService(spellRepository)
const traitService = new TraitService(traitRepository)
const systemService = new SystemService(systemRepository)
const getSystemApi = new GetSystemApi(
  systemService,
  userService,
  raceRepository,
  attributeService,
  skillService,
  coinRepository
)

const crearCampaña = new CrearCampaña(campañaService)
const getCampaignsByUser = new GetCampaignsByUser(campañaService)
const obtenerCampañaPorId = new ObtenerCampañaPorId(campañaService)
const solicitarEntradaACampaña = new SolicitarEntradaACampaña(campañaService)
const aceptarEntradaACampaña = new AceptarEntradaACampaña(campañaService)
const denegarEntradaACampaña = new DenegarEntradaACampaña(campañaService)
const añadirPersonajeACampaña = new AñadirPersonajeACampaña(campañaService)
const modificarLocalizacionesCampaña = new ModificarLocalizacionesCampaña(campañaService)

const getAllRaces = new GetAllRacesUseCase(raceService);
const createRace = new CreateRaceUseCase(raceService);
const updateRace = new UpdateRaceUseCase(raceService);

const getBackgroundsBySystems = new GetBackgroundsBySystems(backgroundRepository);
const getBackgroundById = new GetBackgroundById(backgroundRepository);
const createBackground = new CreateBackground(backgroundRepository);
const updateBackground = new UpdateBackground(backgroundRepository);
const softDeleteBackground = new SoftDeleteBackground(backgroundRepository);
const restoreBackground = new RestoreBackground(backgroundRepository);

const getCharacterClassesBySystems = new GetCharacterClassesBySystems(characterClassService);
const createCharacterClass = new CreateCharacterClass(characterClassService, systemService);
const updateCharacterClass = new UpdateCharacterClass(characterClassService, systemService);
const softDeleteCharacterClass = new SoftDeleteCharacterClass(characterClassService, systemService);
const restoreCharacterClass = new RestoreCharacterClass(characterClassService, systemService);

const createEquipment = new CreateEquipment(equipmentService, systemService);
const updateEquipment = new UpdateEquipment(equipmentService, systemService);
const getEquipmentById = new GetEquipmentById(equipmentService);
const getEquipmentsBySystems = new GetEquipmentsBySystems(equipmentService);
const softDeleteEquipment = new SoftDeleteEquipment(equipmentService, systemService);
const restoreEquipment = new RestoreEquipment(equipmentService, systemService);
const getEquipmentsByTypes = new GetEquipmentsByTypes(equipmentService);
const getEquipmentsWeapons = new GetEquipmentsWeapons(equipmentService);

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
const toggleFavoriteEquipment = new ToggleFavoriteEquipment(personajeService);
const aprenderConjuros = new AprenderConjuros(personajeService);
const añadirForma = new AñadirForma(personajeService);
const createSystem = new CreateSystem(systemService, getSystemApi);
const getSystemsByUser = new GetSystemsByUser(systemService, userRepository, getSystemApi);
const updateSystem = new UpdateSystem(systemService, getSystemApi);

const createAttribute = new CreateAttribute(attributeService, systemService);
const updateAttribute = new UpdateAttribute(attributeService, systemService);
const getAttributesBySystems = new GetAttributesBySystems(attributeService);

const createSpell = new CreateSpell(spellService, systemService);
const updateSpell = new UpdateSpell(spellService, systemService);
const softDeleteSpell = new SoftDeleteSpell(spellService, systemService);
const restoreSpell = new RestoreSpell(spellService, systemService);
const getSpellsBySystems = new GetSpellsBySystems(spellService);
const getSpellById = new GetSpellById(spellService);
const getSpellsByLevel = new GetSpellsByLevel(spellService);
const getRitualSpells = new GetRitualSpells(spellService);

const getTraitsBySystemsUseCase = new GetTraitsBySystemsUseCase(traitService, systemService)
const createTraitUseCase = new CreateTraitUseCase(traitService, systemService)
const updateTraitUseCase = new UpdateTraitUseCase(traitService, systemService)
const softDeleteTrait = new SoftDeleteTraitUseCase(traitService, systemService)
const restoreTrait = new RestoreTraitUseCase(traitService, systemService)

const getSkillsBySystems = new GetSkillsBySystems(skillService)
const createSkill = new CreateSkill(skillService, systemService)
const updateSkill = new UpdateSkill(skillService, systemService)

const magicSchoolRepository = new MagicSchoolRepository(systemRepository);
const magicSchoolService = new MagicSchoolService(magicSchoolRepository);

const createMagicSchool = new CreateMagicSchool(magicSchoolService, systemService);
const updateMagicSchool = new UpdateMagicSchool(magicSchoolService, systemService);
const softDeleteMagicSchool = new SoftDeleteMagicSchool(magicSchoolService, systemService);
const restoreMagicSchool = new RestoreMagicSchool(magicSchoolService, systemService);
const getMagicSchoolsBySystems = new GetMagicSchoolsBySystems(magicSchoolService);

export const magicSchoolController = new MagicSchoolController(
  createMagicSchool,
  updateMagicSchool,
  softDeleteMagicSchool,
  restoreMagicSchool,
  getMagicSchoolsBySystems
);

const cascadeSoftDeleteSystem = new CascadeSoftDeleteSystem(systemService, attributeRepository, skillRepository, languageRepository, magicSchoolRepository);
const cascadeRestoreSystem = new CascadeRestoreSystem(systemService, attributeRepository, skillRepository, languageRepository, magicSchoolRepository);
const softDeleteAttribute = new SoftDeleteAttribute(attributeService, systemService);
const restoreAttribute = new RestoreAttribute(attributeService, systemService);
const softDeleteSkill = new SoftDeleteSkill(skillService, systemService);
const restoreSkill = new RestoreSkill(skillService, systemService);

const softDeleteRace = new SoftDeleteRace(raceService, systemService);
const restoreRace = new RestoreRace(raceService, systemService);

export const raceController = new RaceController(getAllRaces, createRace, updateRace, softDeleteRace, restoreRace);

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

export const backgroundController = new BackgroundController(
  getBackgroundsBySystems,
  getBackgroundById,
  createBackground,
  updateBackground,
  softDeleteBackground,
  restoreBackground
);

export const characterClassController = new CharacterClassController(
  getCharacterClassesBySystems,
  createCharacterClass,
  updateCharacterClass,
  softDeleteCharacterClass,
  restoreCharacterClass
);

export const equipmentController = new EquipmentController(
  createEquipment,
  updateEquipment,
  getEquipmentById,
  getEquipmentsBySystems,
  softDeleteEquipment,
  restoreEquipment,
  getEquipmentsByTypes,
  getEquipmentsWeapons
);

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
  añadirForma,
  toggleFavoriteEquipment
)

export const spellController = new SpellController(
  createSpell,
  updateSpell,
  softDeleteSpell,
  restoreSpell,
  getSpellsBySystems,
  getSpellById,
  getSpellsByLevel,
  getRitualSpells
);

export const systemController = new SystemController(
  getSystemsByUser,
  createSystem,
  updateSystem,
  cascadeSoftDeleteSystem,
  cascadeRestoreSystem
)

export const traitController = new TraitController(getTraitsBySystemsUseCase, createTraitUseCase, updateTraitUseCase, softDeleteTrait, restoreTrait)

export const skillController = new SkillController(
  getSkillsBySystems,
  createSkill,
  updateSkill,
  softDeleteSkill,
  restoreSkill
)

const languageService = new LanguageService(languageRepository)

const getLanguagesBySystems = new GetLanguagesBySystem(languageService)
const createLanguage = new CreateLanguage(languageService)
const updateLanguage = new UpdateLanguage(languageService)
const softDeleteLanguage = new SoftDeleteLanguage(languageService, systemService);
const restoreLanguage = new RestoreLanguage(languageService, systemService);

export const languageController = new LanguageController(
  getLanguagesBySystems,
  createLanguage,
  updateLanguage,
  softDeleteLanguage,
  restoreLanguage
)

export const attributeController = new AttributeController(
  createAttribute,
  updateAttribute,
  softDeleteAttribute,
  restoreAttribute,
  getAttributesBySystems
);

export const authorizeSystemMiddleware = createAuthorizeSystemMiddleware(userRepository);

const proficiencyService = new ProficiencyService(proficiencyRepository);
const createProficiency = new CreateProficiency(proficiencyService, systemService);
const updateProficiency = new UpdateProficiency(proficiencyService, systemService);
const softDeleteProficiency = new SoftDeleteProficiency(proficiencyService, systemService);
const restoreProficiency = new RestoreProficiency(proficiencyService, systemService);
const getProficienciesBySystems = new GetProficienciesBySystems(proficiencyService);

export const proficiencyController = new ProficiencyController(
  getProficienciesBySystems,
  createProficiency,
  updateProficiency,
  softDeleteProficiency,
  restoreProficiency
);

const damageService = new DamageService(damageRepository);
const createDamage = new CreateDamage(damageService, systemService);
const updateDamage = new UpdateDamage(damageService, systemService);
const softDeleteDamage = new SoftDeleteDamage(damageService, systemService);
const restoreDamage = new RestoreDamage(damageService, systemService);
const getDamagesBySystems = new GetDamagesBySystems(damageService);

export const damageController = new DamageController(
  createDamage,
  updateDamage,
  softDeleteDamage,
  restoreDamage,
  getDamagesBySystems
);

const createCoin = new CreateCoin(coinRepository);
const updateCoin = new UpdateCoin(coinRepository);
const getCoins = new GetCoins(coinRepository);
const getCoinById = new GetCoinById(coinRepository);
const deleteCoin = new DeleteCoin(coinRepository);
const restoreCoin = new RestoreCoin(coinRepository);

export const coinController = new CoinController(
  getCoins,
  getCoinById,
  createCoin,
  updateCoin,
  deleteCoin,
  restoreCoin
);

const propertyService = new PropertyService(propertyRepository);
const createProperty = new CreateProperty(propertyService, systemService);
const updateProperty = new UpdateProperty(propertyService, systemService);
const softDeleteProperty = new SoftDeleteProperty(propertyService, systemService);
const restoreProperty = new RestoreProperty(propertyService, systemService);
const getPropertiesBySystems = new GetPropertiesBySystems(propertyService);
const getPropertyById = new GetPropertyById(propertyService);

export const propertyController = new PropertyController(
  createProperty,
  updateProperty,
  softDeleteProperty,
  restoreProperty,
  getPropertiesBySystems,
  getPropertyById
);


