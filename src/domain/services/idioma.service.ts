import IdiomaRepository from "../../infrastructure/databases/mongoDb/repositories/idioma.repository";
import { IdiomaApi, IdiomaMongo } from "../types/idiomas.types";

export default class IdiomaService {
  constructor(private readonly idiomaRepository: IdiomaRepository) { }

  obtenerPorSistemas(ruleset: string[]): Promise<IdiomaApi[]> {
    return this.idiomaRepository.obtenerIdiomasPorSistemas(ruleset);
  }
  
  crear(idioma: IdiomaMongo): Promise<IdiomaApi> {
    return this.idiomaRepository.crearIdioma(idioma);
  }
  
  modificar(idioma: IdiomaMongo): Promise<IdiomaApi> {
    return this.idiomaRepository.modificarIdioma(idioma);
  }
}
