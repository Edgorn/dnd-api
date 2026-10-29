import { describe, it, expect, vi, beforeEach } from "vitest";
import CharacterRepository from "./character.repository";
import CharacterModel from "../schemas/Character";

vi.mock("../schemas/Character", () => ({
  default: {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 })
  }
}));

const USER_ID = "507f1f77bcf86cd799439001";
const SYSTEM_ID = "507f1f77bcf86cd799439002";
const CLASS_ID = "507f1f77bcf86cd799439003";
const CHAR_ID = "507f1f77bcf86cd799439004";
const SPELL_ID = "507f1f77bcf86cd799439006";
const TRAIT_ID = "507f1f77bcf86cd799439007";
const SUBCLASS_ID = "507f1f77bcf86cd799439008";

function sheetDoc() {
  return {
    _id: { toString: () => CHAR_ID },
    img: "",
    name: "Ada",
    race: "Humano",
    user: USER_ID,
    campaign: null,
    classes: [{ class: CLASS_ID, name: "Mago", level: 1, hitDie: 6 }],
    subclasses: [],
    hpMax: 8,
    hpCurrent: 8,
    xp: 0,
    attributes: [{ key: "int", value: 16 }, { key: "dex", value: 14 }],
    systems: [SYSTEM_ID],
    speed: { walk: 9 },
    traits: [],
    traitsData: {},
    skills: [],
    proficiencies: [],
    equipment: [{ instanceId: "eq1", equipmentId: "armor", quantity: 1, equipped: true }],
    languages: { speaks: [], understands: [], notes: [] },
    spells: { [CLASS_ID]: [SPELL_ID] },
    preparedSpells: {},
    extraSpells: {},
    optionSelections: [],
    forms: [],
    appearance: {},
    background: {},
    proficiencyBonus: 2,
    savingThrows: [],
    money: [],
    companions: [],
    size: "medium",
    spellPrivileges: []
  };
}

describe("CharacterRepository spell mutation responses", () => {
  const equipmentRepository = {
    getCharacterEquipmentsByIds: vi.fn().mockResolvedValue([]),
    getArmorClassInputsByIds: vi.fn().mockResolvedValue([])
  };
  const traitRepository = {
    getTraitsByIndexes: vi.fn().mockResolvedValue([])
  };
  const proficiencyRepository = {
    getProficienciesByIndices: vi.fn().mockResolvedValue([]),
    getDescendantProficiencies: vi.fn().mockResolvedValue([])
  };
  const languageRepository = {
    getByIds: vi.fn().mockResolvedValue([])
  };
  const skillService = {
    getCharacterSkills: vi.fn().mockResolvedValue([])
  };
  const spellRepository = {
    getSpellsByIndexes: vi.fn().mockResolvedValue([]),
    getSpellRefsByIndexes: vi.fn().mockResolvedValue([])
  };
  const characterClassRepository = {
    getSpellcastingSources: vi.fn(),
    getRulesByIds: vi.fn().mockResolvedValue([
      { id: CLASS_ID, name: "Mago", ruleset: SYSTEM_ID, hit_die: 6, levels: [], spellcasting: "int" }
    ]),
    getById: vi.fn(),
    dataLevelUp: vi.fn()
  };
  const subclassRepository = {
    getRulesByIds: vi.fn().mockResolvedValue([]),
    getSummariesByIds: vi.fn().mockResolvedValue([]),
    getByIds: vi.fn()
  };
  const groupOptionRepository = { getByIds: vi.fn().mockResolvedValue([]) };
  const optionGroupRepository = { getByIds: vi.fn().mockResolvedValue([]) };
  const raceRepository = { getSpellcastingAttribute: vi.fn() };
  const creatureRepository = {
    getByIds: vi.fn().mockResolvedValue([]),
    getSummariesByIds: vi.fn().mockResolvedValue([])
  };
  const attributeService = {
    getBySystems: vi.fn().mockResolvedValue([
      { id: "attr-int", key: "int", name: "Inteligencia", description: "", abbreviation: "INT", ruleset: SYSTEM_ID }
    ]),
    formatAttributes: vi.fn().mockImplementation(async (attributes: { key: string; value: number }[]) =>
      attributes.map(attribute => ({ ...attribute, modifier: Math.floor((attribute.value - 10) / 2) }))
    )
  };
  const systemRepository = {
    getMergedRulesConfig: vi.fn().mockResolvedValue({
      xpProgression: [0, 300],
      globalModifierFormula: "Math.floor((value - 10) / 2)"
    }),
    getInitiativeBonusFormula: vi.fn(),
    getGlobalModifierFormula: vi.fn()
  };
  const coinRepository = {
    getBySystems: vi.fn().mockResolvedValue([]),
    getCoinsByIds: vi.fn().mockResolvedValue([])
  };
  const campaignReader = { getById: vi.fn() };
  const conditionRepository = { getByIds: vi.fn().mockResolvedValue([]) };

  let repository: CharacterRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    equipmentRepository.getCharacterEquipmentsByIds.mockResolvedValue([]);
    equipmentRepository.getArmorClassInputsByIds.mockResolvedValue([]);
    spellRepository.getSpellRefsByIndexes.mockResolvedValue([
      { id: SPELL_ID, name: "Escudo", level: 1 }
    ]);
    spellRepository.getSpellsByIndexes.mockResolvedValue([
      { id: SPELL_ID, name: "Escudo", level: 1, classes: [{ id: CLASS_ID }], description: ["Largo"], tables: [], ruleset: SYSTEM_ID }
    ]);
    traitRepository.getTraitsByIndexes.mockResolvedValue([]);
    characterClassRepository.getRulesByIds.mockResolvedValue([
      { id: CLASS_ID, name: "Mago", ruleset: SYSTEM_ID, hit_die: 6, levels: [], spellcasting: "int" }
    ]);
    characterClassRepository.getSpellcastingSources.mockResolvedValue([{
      class: CLASS_ID,
      abilityKey: "int",
      spellsPreparedFormula: "1",
      preparedFrom: "known",
      slots: { cantrips: 3, 1: 2 }
    }]);
    subclassRepository.getRulesByIds.mockResolvedValue([]);
    systemRepository.getMergedRulesConfig.mockResolvedValue({
      xpProgression: [0, 300],
      globalModifierFormula: "Math.floor((value - 10) / 2)"
    });
    attributeService.getBySystems.mockResolvedValue([
      { id: "attr-int", key: "int", name: "Inteligencia", description: "", abbreviation: "INT", ruleset: SYSTEM_ID }
    ]);
    const doc = sheetDoc();
    vi.mocked(CharacterModel.findById).mockResolvedValue(doc as never);
    vi.mocked(CharacterModel.findByIdAndUpdate).mockResolvedValue({
      ...doc,
      preparedSpells: { [CLASS_ID]: [] }
    } as never);

    repository = new CharacterRepository(
      { getUserName: vi.fn().mockResolvedValue("Ada") } as never,
      equipmentRepository as never,
      traitRepository as never,
      proficiencyRepository as never,
      languageRepository as never,
      skillService as never,
      spellRepository as never,
      characterClassRepository as never,
      subclassRepository as never,
      groupOptionRepository as never,
      optionGroupRepository as never,
      raceRepository as never,
      creatureRepository as never,
      attributeService as never,
      systemRepository as never,
      coinRepository as never,
      campaignReader as never,
      {} as never,
      {} as never,
      conditionRepository as never
    );
  });

  it("prepareSpells returns sheet spell refs and skips equipment and AC hydration", async () => {
    const result = await repository.prepareSpells({
      id: CHAR_ID,
      classId: CLASS_ID,
      spells: [],
      userId: USER_ID
    });

    expect(result.spells[CLASS_ID].list).toEqual([SPELL_ID]);
    expect(result.spells[CLASS_ID].prepared).toEqual([]);
    expect(result.spellsById[SPELL_ID]).toEqual({ id: SPELL_ID, name: "Escudo", level: 1 });
    expect(result).not.toHaveProperty("ac");
    expect(result).not.toHaveProperty("equipment");
    expect(result).not.toHaveProperty("hpMax");
    expect(result).not.toHaveProperty("spellPrivileges");
    expect(spellRepository.getSpellRefsByIndexes).toHaveBeenCalled();
    expect(equipmentRepository.getCharacterEquipmentsByIds).not.toHaveBeenCalled();
    expect(equipmentRepository.getArmorClassInputsByIds).not.toHaveBeenCalled();
    expect(coinRepository.getBySystems).not.toHaveBeenCalled();
    expect(creatureRepository.getByIds).not.toHaveBeenCalled();
  });

  it("bindSpellPrivileges includes derived spells and spellPrivileges without hydrating the sheet", async () => {
    const doc = {
      ...sheetDoc(),
      traits: [TRAIT_ID]
    };
    vi.mocked(CharacterModel.findById).mockResolvedValue(doc as never);
    vi.mocked(CharacterModel.findByIdAndUpdate).mockResolvedValue({
      ...doc,
      spellPrivileges: [{ traitId: TRAIT_ID, classId: CLASS_ID, selections: [[SPELL_ID]] }]
    } as never);
    traitRepository.getTraitsByIndexes.mockResolvedValue([{
      id: TRAIT_ID,
      name: "Maestría",
      description: [],
      spellPrivileges: [{
        choose: 1,
        source: "classList",
        filter: { level: 1 },
        atLevel: 1,
        alwaysPrepared: true,
        countsTowardPreparedCap: false,
        freeCast: { slotLevel: "spellLevel", uses: "unlimited", recharge: null },
        replace: null
      }]
    }]);

    const result = await repository.bindSpellPrivileges({
      id: CHAR_ID,
      traitId: TRAIT_ID,
      classId: CLASS_ID,
      selections: [[SPELL_ID]],
      userId: USER_ID
    });

    expect(result.spells[CLASS_ID].list).toEqual([SPELL_ID]);
    expect(result.spells[CLASS_ID].prepared).toEqual([SPELL_ID]);
    expect(result.spellsById[SPELL_ID]).toMatchObject({ id: SPELL_ID, name: "Escudo", level: 1 });
    expect(result.spellPrivileges).toHaveLength(1);
    expect(result.spellPrivileges?.[0].traitId).toBe(TRAIT_ID);
    expect(result).not.toHaveProperty("ac");
    expect(result).not.toHaveProperty("equipment");
    expect(equipmentRepository.getCharacterEquipmentsByIds).not.toHaveBeenCalled();
    expect(equipmentRepository.getArmorClassInputsByIds).not.toHaveBeenCalled();
  });

  it("prepareSpells strips always-prepared subclass spells from the persisted cap and returns them prepared", async () => {
    const doc = {
      ...sheetDoc(),
      subclasses: [SUBCLASS_ID]
    };
    vi.mocked(CharacterModel.findById).mockResolvedValue(doc as never);
    vi.mocked(CharacterModel.findByIdAndUpdate).mockResolvedValue({
      ...doc,
      preparedSpells: { [CLASS_ID]: [] }
    } as never);
    subclassRepository.getRulesByIds.mockResolvedValue([{
      id: SUBCLASS_ID,
      classId: CLASS_ID,
      name: "Dominio de la Vida",
      ruleset: SYSTEM_ID,
      levels: [],
      expandedSpells: [],
      alwaysPreparedSpells: [{ atLevel: 1, spellIds: [SPELL_ID] }]
    }]);

    const result = await repository.prepareSpells({
      id: CHAR_ID,
      classId: CLASS_ID,
      spells: [SPELL_ID],
      userId: USER_ID
    });

    expect(CharacterModel.findByIdAndUpdate).toHaveBeenCalledWith(
      CHAR_ID,
      { $set: { preparedSpells: { [CLASS_ID]: [] } } },
      { returnDocument: "after" }
    );
    expect(result.spells[CLASS_ID].prepared).toEqual([SPELL_ID]);
  });
});
