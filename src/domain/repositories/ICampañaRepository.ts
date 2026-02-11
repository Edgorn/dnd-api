import { CampañaApi, CampañaBasica, TypeCrearCampaña, TypeEntradaCampaña, TypeEntradaPersonajeCampaña, TypeModificarLocalizaciones } from "../types/campañas.types";

export default interface ICampañaRepository {
  consultarPorUsuario(id: string): Promise<CampañaBasica[]>
  crear(data: TypeCrearCampaña): Promise<CampañaBasica | null>
  consultarPorId(idUser: string, idCampaign: string): Promise<CampañaApi | null>
  registrarSolicitud(idUser: string, idCampaign: string): Promise<CampañaBasica | null>
  denegarSolicitud(data: TypeEntradaCampaña): Promise<{ userId: string, campaignId: string } | null>
  aceptarSolicitud(data: TypeEntradaCampaña): Promise<{ userId: string, campaignId: string } | null>
  añadirPersonaje(data: TypeEntradaPersonajeCampaña): Promise<{ characterId: string } | null>
  modificarLocalizaciones(data: TypeModificarLocalizaciones): Promise<boolean>
}
