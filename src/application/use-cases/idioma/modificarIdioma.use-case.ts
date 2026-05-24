import IdiomaService from "../../../domain/services/idioma.service";
import { IdiomaApi, IdiomaMongo } from "../../../domain/types/idiomas.types";

export default class ModificarIdioma {
  constructor(private readonly idiomaService: IdiomaService) { }

  execute(idioma: IdiomaMongo): Promise<IdiomaApi> {
    return this.idiomaService.modificar(idioma);
  }
}