import RasgoService from "../../../domain/services/rasgo.service";
import { CreateRasgo, RasgoApi } from "../../../domain/types/rasgos.types";

export default class CrearRasgo {
  constructor(private readonly rasgoService: RasgoService) { }

  execute(rasgo: CreateRasgo): Promise<RasgoApi> {
    return this.rasgoService.create(rasgo);
  }
}