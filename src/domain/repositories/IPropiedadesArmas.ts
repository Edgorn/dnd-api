import { PropiedadesArma } from "../types";

export default interface IPropiedadArmaRepository {
  obtenerPropiedadesPorIndices(params: string[]): Promise<PropiedadesArma[]>
}
