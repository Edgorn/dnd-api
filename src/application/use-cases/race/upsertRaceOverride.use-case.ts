import RaceService from "../../../domain/services/race.service";
import SystemService from "../../../domain/services/system.service";
import EntityOverrideService from "../../../domain/services/entityOverride.service";
import { EntityOverrideApi, RaceFlavorPatchInput } from "../../../domain/types/entityOverride.types";
import { mergeFlavorPatch } from "../../../utils/applyRaceOverrides";
import { resolveRaceOverrideContext } from "./resolveRaceOverrideContext";

export interface UpsertRaceOverrideInput extends RaceFlavorPatchInput {
  ruleset: string;
}

export default class UpsertRaceOverride {
  constructor(
    private readonly raceService: RaceService,
    private readonly systemService: SystemService,
    private readonly entityOverrideService: EntityOverrideService
  ) {}

  async execute(
    sourceId: string,
    data: UpsertRaceOverrideInput,
    userId: string
  ): Promise<EntityOverrideApi> {
    const { childSystem } = await resolveRaceOverrideContext(
      this.systemService,
      this.raceService,
      data.ruleset,
      sourceId,
      userId
    );

    const ruleset = childSystem._id.toString();
    const existing = await this.entityOverrideService.getBySource(
      ruleset,
      "race",
      sourceId,
      true
    );

    const patch = mergeFlavorPatch(existing?.patch ?? {}, {
      name: data.name,
      description: data.description,
      img: data.img,
      alignment: data.alignment
    });

    if (Object.keys(patch).length === 0) {
      await this.entityOverrideService.softDelete(ruleset, "race", sourceId);
      return {
        id: existing?.id ?? "",
        ruleset,
        entityType: "race",
        sourceId,
        patch: {}
      };
    }

    return this.entityOverrideService.upsert({
      ruleset,
      entityType: "race",
      sourceId,
      patch
    });
  }
}
