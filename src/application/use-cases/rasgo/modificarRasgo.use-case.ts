import RasgoService from "../../../domain/services/rasgo.service";
import { RasgoApi, UpdateRasgo } from "../../../domain/types/rasgos.types";

export default class ModificarRasgo {
  constructor(private readonly rasgoService: RasgoService) { }

  execute(rasgo: UpdateRasgo): Promise<RasgoApi> {
    return this.rasgoService.update(rasgo);
  }
}