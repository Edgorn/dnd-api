import { RaceApi, RaceMongo, SubraceApi, SubraceMongo, TypeApi, TypeMongo, VarianteApi, VarianteMongo } from "../types/razas";

export default class IRazaRepository {
  async obtenerTodas(): Promise<RaceApi[]> {
    throw new Error('Método no implementado');
  }

  async formatearRazas(razas: RaceMongo[]): Promise<RaceApi[]> {
    throw new Error('Método no implementado');
  } 
  
  async formatearRaza(raza: RaceMongo): Promise<RaceApi> {
    throw new Error('Método no implementado');
  }
  
  async formatearSubrazas(subrazas: SubraceMongo[]): Promise<SubraceApi[]> {
    throw new Error('Método no implementado');
  }
   
  async formatearSubraza(subraza: SubraceMongo): Promise<SubraceApi> {
    throw new Error('Método no implementado');
  }
  
  formatearTipos(tipos: TypeMongo[]): TypeApi[] {
    throw new Error('Método no implementado');
  }
  
  formatearTipo(tipo: TypeMongo): TypeApi {
    throw new Error('Método no implementado');
  }
  
  async formatearVariantes(variantes: VarianteMongo[]): Promise<VarianteApi[]> {
    throw new Error('Método no implementado');
  }
  
  async formatearVariante(variante: VarianteMongo): Promise<VarianteApi> {
    throw new Error('Método no implementado');
  }

  async getRaza(index: string): Promise<any> {
    throw new Error('Método no implementado');
  }
}
