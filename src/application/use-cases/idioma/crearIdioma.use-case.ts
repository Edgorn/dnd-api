import IdiomaService from "../../../domain/services/idioma.service";
import { IdiomaApi, IdiomaMongo } from "../../../domain/types/idiomas.types";

export default class CrearIdioma {
  constructor(private readonly idiomaService: IdiomaService) { }

  execute(idioma: IdiomaMongo): Promise<IdiomaApi> {
    return this.idiomaService.crear(idioma);
  }
}