import RaceService from "../../../domain/services/race.service";
import { CreateRace, RaceApi } from "../../../domain/types/race.types";

export default class UpdateRaceUseCase {
  constructor(private readonly raceService: RaceService) { }

  execute(race: CreateRace): Promise<RaceApi | undefined> {
    return this.raceService.actualizar(race);
  }
}
