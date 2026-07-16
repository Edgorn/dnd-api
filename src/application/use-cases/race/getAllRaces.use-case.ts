import RaceService from "../../../domain/services/race.service";
import { RaceApi } from "../../../domain/types/race.types";

export default class GetAllRacesUseCase {
  constructor(private readonly raceService: RaceService) { }

  execute(ruleset?: string): Promise<RaceApi[]> {
    if (ruleset) {
      return this.raceService.obtenerPorSistema(ruleset);
    }
    return this.raceService.obtenerTodas();
  }
}
