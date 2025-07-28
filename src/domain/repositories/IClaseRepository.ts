import { ClaseApi, ClaseLevelUp, ClaseMongo, SubclaseApi, SubclaseMongo, SubclaseOptionApi, SubclasesMongo, SubclasesOptionsApi, SubclasesOptionsMongo, SubclasesOptionsMongoOption } from "../types/clases";

export default class IClaseRepository {
  async obtenerTodas(): Promise<ClaseApi[]> {
    throw new Error('Método no implementado');
  }

  async formatearClases(clases: ClaseMongo[]): Promise<ClaseApi[]> {
    throw new Error('Método no implementado');
  }

  async formatearClase(clase: ClaseMongo): Promise<ClaseApi> {
    throw new Error('Método no implementado');
  }
  
  async dataLevelUp(idClase: string, level: number, subclasses: string[]): Promise<ClaseLevelUp | null> {
    throw new Error('Método no implementado');
  }

  async formatearSubclaseType(subclase_type: SubclasesOptionsMongo, subclases: SubclasesMongo): Promise<SubclasesOptionsApi | null> {
    throw new Error('Método no implementado');
  }
  
  async formatearSubclases(subclases_options: SubclasesOptionsMongoOption[], subclases: SubclasesMongo): Promise<SubclaseOptionApi[]> {
    throw new Error('Método no implementado');
  }
  
  async formatearSubclaseOption(subclase_option: SubclasesOptionsMongoOption, subclases: SubclasesMongo): Promise<SubclaseOptionApi> {
    throw new Error('Método no implementado');
  }

  async formatearSubclase(subclase: SubclaseMongo): Promise<SubclaseApi> {
    throw new Error('Método no implementado');
  }
}