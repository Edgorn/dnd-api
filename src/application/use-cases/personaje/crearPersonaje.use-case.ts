import PersonajeService from "../../../domain/services/personaje.service";
import { PersonajeBasico, TypeCrearPersonaje } from "../../../domain/types/personajes.types";
import ISystemRepository from "../../../domain/repositories/ISystemRepository";

export default class CrearPersonaje {
  constructor(
    private readonly personajeService: PersonajeService,
    private readonly systemRepository: ISystemRepository
  ) { }

  async execute(data: TypeCrearPersonaje): Promise<PersonajeBasico | null> {
    await this.systemRepository.verifySystemsNotBase(data.systems || []);
    return this.personajeService.crear(data);
  }
}
