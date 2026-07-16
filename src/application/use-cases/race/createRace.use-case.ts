import RaceService from "../../../domain/services/race.service";
import { CreateRace, RaceApi } from "../../../domain/types/race.types";

export default class CreateRaceUseCase {
  constructor(private readonly raceService: RaceService) { }

  execute(race: CreateRace): Promise<RaceApi> {
    return this.raceService.crear(race);
  }
}
