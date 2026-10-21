export type Prerequisite =
  | { type: "classLevel"; classId?: string; min: number }
  | { type: "characterLevel"; min: number }
  | { type: "trait"; traitId: string }
  | { type: "spell"; spellId: string }
  | { type: "attribute"; key: string; min: number }
  | { all: Prerequisite[] }
  | { any: Prerequisite[] };

export interface PrerequisiteContext {
  grantingClassId: string;
  classLevels: Record<string, number>;
  characterLevel: number;
  traitIds: Iterable<string>;
  spellIds: Iterable<string>;
  attributes: { key: string; value: number }[];
}
