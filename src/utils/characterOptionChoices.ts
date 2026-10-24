import { evaluatePrerequisites } from "../domain/services/prerequisites";
import { Prerequisite, PrerequisiteContext } from "../domain/types/prerequisite.types";
import {
  CharacterOptionSelection,
  GroupOptionApi,
  LevelUpOptionPick,
  OptionChoiceMongo,
  OptionReplacementConfig,
  PendingOptionChoice,
  PendingOptionChoiceOption
} from "../domain/types/optionGroup.types";

export interface GroupOptionForChoice {
  id: string;
  groupId: string;
  traitId: string;
  prerequisites?: Prerequisite | null;
  repeatable?: boolean;
}

export function mergeOptionChoices(
  ...lists: (OptionChoiceMongo[] | undefined)[]
): OptionChoiceMongo[] {
  const byGroup = new Map<string, OptionChoiceMongo>();

  for (const list of lists) {
    for (const choice of list ?? []) {
      const current = byGroup.get(choice.groupId);
      if (!current) {
        byGroup.set(choice.groupId, {
          groupId: choice.groupId,
          choose: choice.choose,
          ...(choice.replace ? { replace: choice.replace } : {})
        });
        continue;
      }

      const replace = (current.replace ?? 0) + (choice.replace ?? 0);
      byGroup.set(choice.groupId, {
        groupId: choice.groupId,
        choose: current.choose + choice.choose,
        ...(replace > 0 ? { replace } : {})
      });
    }
  }

  return [...byGroup.values()].filter(choice => choice.choose > 0 || (choice.replace ?? 0) > 0);
}

export function optionReplacementsToChoices(
  configs: OptionReplacementConfig[] | undefined,
  selections: CharacterOptionSelection[],
  classId: string
): OptionChoiceMongo[] {
  return (configs ?? [])
    .filter(config =>
      config.count > 0
      && selections.some(selection =>
        selection.groupId === config.groupId && selection.classId === classId
      )
    )
    .map(config => ({
      groupId: config.groupId,
      choose: 0,
      replace: config.count
    }));
}

function ownedCount(selections: CharacterOptionSelection[], optionId: string): number {
  return selections.filter(selection => selection.optionId === optionId).length;
}

function toPendingOption(
  option: GroupOptionApi,
  available: boolean,
  unmet: boolean
): PendingOptionChoiceOption {
  return { ...option, available, unmet };
}

export function buildPendingOptionChoices(params: {
  configs: OptionChoiceMongo[];
  options: GroupOptionApi[];
  selections: CharacterOptionSelection[];
  context: PrerequisiteContext;
  groupNames: Record<string, string>;
}): PendingOptionChoice[] {
  const { configs, options, selections, context, groupNames } = params;

  return configs.map(config => {
    const groupSelections = selections.filter(selection => selection.groupId === config.groupId);
    const groupOptions = options.filter(option => option.groupId === config.groupId);
    const pendingOptions: PendingOptionChoiceOption[] = [];

    for (const option of groupOptions) {
      const alreadyOwned = ownedCount(groupSelections, option.id) > 0;
      if (alreadyOwned && !option.repeatable) continue;

      const unmet = !evaluatePrerequisites(option.prerequisites, context);
      pendingOptions.push(toPendingOption(option, !unmet, unmet));
    }

    pendingOptions.sort((a, b) =>
      (a.trait?.name ?? "").localeCompare(b.trait?.name ?? "", "es", { sensitivity: "base" })
    );

    return {
      groupId: config.groupId,
      groupName: groupNames[config.groupId] ?? "",
      choose: config.choose,
      ...(config.replace ? { replace: config.replace } : {}),
      options: pendingOptions,
      selected: groupSelections
    };
  });
}

export function subclassMenuOptionChoiceGroupIds(
  options: Array<{ levels: Array<{ optionChoices?: OptionChoiceMongo[] }> }>
): string[] {
  const ids = new Set<string>();
  for (const option of options) {
    for (const level of option.levels) {
      for (const choice of level.optionChoices ?? []) {
        ids.add(choice.groupId);
      }
    }
  }
  return [...ids];
}

export function mapSubclassMenuOptionChoices<
  TLevel extends { optionChoices?: OptionChoiceMongo[] },
  TOption extends { levels: TLevel[] }
>(
  options: TOption[],
  hydrate: (configs: OptionChoiceMongo[]) => PendingOptionChoice[]
): TOption[] {
  return options.map(option => ({
    ...option,
    levels: option.levels.map(level => {
      if (!level.optionChoices?.length) return level;
      return { ...level, optionChoices: hydrate(level.optionChoices) };
    })
  }));
}

function applyOptionPicks(
  selections: CharacterOptionSelection[],
  picks: LevelUpOptionPick[],
  optionsById: Map<string, GroupOptionForChoice>,
  classId: string,
  level: number
): CharacterOptionSelection[] {
  let next = [...selections];

  for (const pick of picks) {
    for (const replacement of pick.replace ?? []) {
      const index = next.findIndex(
        selection => selection.groupId === pick.groupId && selection.optionId === replacement.from
      );
      if (index >= 0) {
        next.splice(index, 1);
      }
      const toOption = optionsById.get(replacement.to);
      if (toOption) {
        next.push({
          optionId: replacement.to,
          groupId: pick.groupId,
          traitId: toOption.traitId,
          classId,
          level
        });
      }
    }

    for (const optionId of pick.add) {
      const option = optionsById.get(optionId);
      if (!option) continue;
      next.push({
        optionId,
        groupId: pick.groupId,
        traitId: option.traitId,
        classId,
        level
      });
    }
  }

  return next;
}

export function traitIdsFromSelections(selections: CharacterOptionSelection[]): string[] {
  return [...new Set(selections.map(selection => selection.traitId).filter(Boolean))];
}

export function unusedTraitIds(
  previous: CharacterOptionSelection[],
  next: CharacterOptionSelection[]
): string[] {
  const remaining = new Set(traitIdsFromSelections(next));
  return [...new Set(
    previous
      .map(selection => selection.traitId)
      .filter(traitId => traitId && !remaining.has(traitId))
  )];
}

export function addedTraitIds(
  previous: CharacterOptionSelection[],
  next: CharacterOptionSelection[]
): string[] {
  const before = new Set(traitIdsFromSelections(previous));
  return traitIdsFromSelections(next).filter(traitId => !before.has(traitId));
}

export function contextWithSelections(
  context: PrerequisiteContext,
  extraTraitIds: Iterable<string>,
  selections: CharacterOptionSelection[]
): PrerequisiteContext {
  return {
    ...context,
    traitIds: [...new Set([
      ...context.traitIds,
      ...extraTraitIds,
      ...traitIdsFromSelections(selections)
    ])]
  };
}

export function invalidatedSelections(
  selections: CharacterOptionSelection[],
  optionsById: Map<string, GroupOptionForChoice>,
  context: PrerequisiteContext
): CharacterOptionSelection[] {
  return selections.filter(selection => {
    const option = optionsById.get(selection.optionId);
    if (!option) return true;
    return !evaluatePrerequisites(option.prerequisites, context);
  });
}

export function validateLevelUpOptionPicks(params: {
  configs: OptionChoiceMongo[] | undefined;
  options: GroupOptionForChoice[];
  selections: CharacterOptionSelection[];
  picks: LevelUpOptionPick[] | undefined;
  context: PrerequisiteContext;
  extraTraitIds?: Iterable<string>;
  classId: string;
  level: number;
}): { error: string } | {
  selections: CharacterOptionSelection[];
  addedTraitIds: string[];
  removedTraitIds: string[];
} {
  const configs = params.configs ?? [];
  const picks = params.picks ?? [];

  if (!configs.length) {
    if (picks.length) {
      return { error: "Este nivel no ofrece elecciones de opciones" };
    }
    return {
      selections: params.selections,
      addedTraitIds: [],
      removedTraitIds: []
    };
  }

  const configByGroup = new Map(configs.map(config => [config.groupId, config]));
  for (const pick of picks) {
    if (!configByGroup.has(pick.groupId)) {
      return { error: "Hay una elección de opciones que no corresponde a este nivel" };
    }
  }

  const optionsById = new Map(params.options.map(option => [option.id, option]));
  const addSeen = new Set<string>();

  for (const config of configs) {
    const pick = picks.find(item => item.groupId === config.groupId);
    const add = pick?.add ?? [];
    const replace = pick?.replace ?? [];

    if (add.length !== config.choose) {
      return { error: `Debe elegir ${config.choose} opción(es) del grupo` };
    }

    if (replace.length > (config.replace ?? 0)) {
      return { error: "Hay más recambios de opciones de los permitidos" };
    }

    const groupSelections = params.selections.filter(selection => selection.groupId === config.groupId);

    for (const optionId of add) {
      if (addSeen.has(`${config.groupId}:${optionId}`)) {
        const option = optionsById.get(optionId);
        if (!option?.repeatable) {
          return { error: "No se puede elegir la misma opción más de una vez" };
        }
      }
      addSeen.add(`${config.groupId}:${optionId}`);

      const option = optionsById.get(optionId);
      if (!option || option.groupId !== config.groupId) {
        return { error: "Hay una opción que no pertenece al grupo ofrecido" };
      }
      if (!option.repeatable && ownedCount(groupSelections, optionId) > 0) {
        return { error: "Esa opción ya está elegida" };
      }
    }

    for (const replacement of replace) {
      const fromOwned = groupSelections.some(selection => selection.optionId === replacement.from);
      if (!fromOwned) {
        return { error: "Solo se pueden recambiar opciones ya elegidas" };
      }
      const toOption = optionsById.get(replacement.to);
      if (!toOption || toOption.groupId !== config.groupId) {
        return { error: "El recambio de opciones apunta a una opción inválida" };
      }
    }
  }

  const nextSelections = applyOptionPicks(
    params.selections,
    picks,
    optionsById,
    params.classId,
    params.level
  );
  const nextContext = contextWithSelections(
    params.context,
    params.extraTraitIds ?? [],
    nextSelections
  );

  for (const pick of picks) {
    const ids = [...(pick.add ?? []), ...(pick.replace ?? []).map(item => item.to)];
    for (const optionId of ids) {
      const option = optionsById.get(optionId);
      if (!option) continue;
      if (!evaluatePrerequisites(option.prerequisites, nextContext)) {
        return { error: "El personaje no cumple los requisitos de una opción elegida" };
      }
    }
  }

  const remainingOld = nextSelections.filter(selection =>
    params.selections.some(
      previous => previous.optionId === selection.optionId
        && previous.groupId === selection.groupId
        && previous.classId === selection.classId
        && previous.level === selection.level
    )
  );
  const invalid = invalidatedSelections(remainingOld, optionsById, nextContext);
  if (invalid.length) {
    return { error: "Hay opciones ya elegidas que dejan de cumplir sus requisitos" };
  }

  return {
    selections: nextSelections,
    addedTraitIds: addedTraitIds(params.selections, nextSelections),
    removedTraitIds: unusedTraitIds(params.selections, nextSelections)
  };
}
