import ICampañaRepository from "../repositories/ICampañaRepository";
import { CampañaApi, CampañaBasica, TypeCrearCampaña, TypeEntradaCampaña, TypeEntradaPersonajeCampaña } from "../types/campañas.types";
import { PersonajeBasico } from "../types/personajes.types";

export default class CampañaService {
  constructor(private readonly campañaRepository: ICampañaRepository) { }
  
  consultarPorUsuario(id: string): Promise<CampañaBasica[]> {
    return this.campañaRepository.consultarPorUsuario(id);
  }

  crear(data: TypeCrearCampaña): Promise<CampañaBasica | null> {
    return this.campañaRepository.crear(data);
  }

  consultarPorId(idUser: string, idCampaign: string): Promise<CampañaApi | null> {
    return this.campañaRepository.consultarPorId(idUser, idCampaign);
  }

  registrarSolicitud(idUser: string, idCampaign: string): Promise<CampañaBasica | null> {
    return this.campañaRepository.registrarSolicitud(idUser, idCampaign);
  }

  denegarSolicitud(data: TypeEntradaCampaña): Promise<{completo: CampañaApi, basico: CampañaBasica} | null> {
    return this.campañaRepository.denegarSolicitud(data); 
  }

  aceptarSolicitud(data: TypeEntradaCampaña): Promise<{completo: CampañaApi, basico: CampañaBasica} | null> {
    return this.campañaRepository.aceptarSolicitud(data);
  }

  añadirPersonaje(data: TypeEntradaPersonajeCampaña): Promise<{completo: CampañaApi, basico: CampañaBasica, personaje: PersonajeBasico} | null> {
    return this.campañaRepository.añadirPersonaje(data);
  }
}
