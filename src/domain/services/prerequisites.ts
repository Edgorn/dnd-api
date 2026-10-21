import { Prerequisite, PrerequisiteContext } from "../types/prerequisite.types";
import { meetsAttributeRequirements } from "../../utils/characterLevelUpAbilityScore";

function asSet(values: Iterable<string>): Set<string> {
  return values instanceof Set ? values : new Set(values);
}

function isAll(prereq: Prerequisite): prereq is { all: Prerequisite[] } {
  return "all" in prereq;
}

function isAny(prereq: Prerequisite): prereq is { any: Prerequisite[] } {
  return "any" in prereq;
}

export function evaluatePrerequisites(
  prereq: Prerequisite | null | undefined,
  context: PrerequisiteContext
): boolean {
  if (!prereq) return true;

  if (isAll(prereq)) {
    return prereq.all.every(item => evaluatePrerequisites(item, context));
  }

  if (isAny(prereq)) {
    return prereq.any.some(item => evaluatePrerequisites(item, context));
  }

  const traitIds = asSet(context.traitIds);
  const spellIds = asSet(context.spellIds);

  switch (prereq.type) {
    case "classLevel": {
      const classId = prereq.classId ?? context.grantingClassId;
      return (context.classLevels[classId] ?? 0) >= prereq.min;
    }
    case "characterLevel":
      return context.characterLevel >= prereq.min;
    case "trait":
      return traitIds.has(prereq.traitId);
    case "spell":
      return spellIds.has(prereq.spellId);
    case "attribute":
      return meetsAttributeRequirements(
        { attributeMode: "all", attributes: [{ key: prereq.key, min: prereq.min }] },
        context.attributes
      );
    default:
      return false;
  }
}
