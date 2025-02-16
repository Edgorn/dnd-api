import { ConjuroApi, ConjuroMongo } from "../types";

export default class IConjuroRepository {
  init(): any {
    throw new Error('Método no implementado');
  }

  cargar(): any {
    throw new Error('Método no implementado');
  }

  obtenerConjurosPorIndices(params: string[]): ConjuroMongo[] {
    throw new Error('Método no implementado');
  }

  obtenerConjuroPorIndice(params: string): ConjuroMongo {
    throw new Error('Método no implementado');
  }

  obtenerConjurosPorNivelClase(nivel: string, clase: string): ConjuroApi[] {
    throw new Error('Método no implementado');
  }
}
