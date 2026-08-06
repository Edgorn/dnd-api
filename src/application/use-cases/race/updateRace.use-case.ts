import RaceService from "../../../domain/services/race.service";
import { RaceApi, UpdateRace } from "../../../domain/types/race.types";

export default class UpdateRaceUseCase {
  constructor(private readonly raceService: RaceService) { }

  execute(race: UpdateRace): Promise<RaceApi | undefined> {
    return this.raceService.actualizar(race);
  }
}
