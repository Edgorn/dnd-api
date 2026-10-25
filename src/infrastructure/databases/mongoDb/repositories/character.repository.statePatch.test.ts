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
const CONDITION_ID = "507f1f77bcf86cd799439008";
const CREATURE_ID = "507f1f77bcf86cd799439009";
const FORM_ID = "507f1f77bcf86cd79943900a";

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
    equipment: [],
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
    spellSlotsSpent: [],
    hitDiceSpent: [],
    activeConditions: [],
    traitResources: [],
    activeTraitIds: []
  };
}

describe("CharacterRepository combat mutation patches", () => {
  const userRepository = { getUserName: vi.fn().mockResolvedValue("Ada") };
  const equipmentRepository = {
    getCharacterEquipmentsByIds: vi.fn().mockResolvedValue([]),
    getArmorClassInputsByIds: vi.fn().mockResolvedValue([])
  };
  const traitRepository = {
    getTraitsByIndexes: vi.fn().mockResolvedValue([]),
    getArmorClassInputsByIds: vi.fn().mockResolvedValue([])
  };
  const proficiencyRepository = {
    getProficienciesByIndices: vi.fn().mockResolvedValue([]),
    getDescendantProficiencies: vi.fn().mockResolvedValue([])
  };
  const languageRepository = { getByIds: vi.fn().mockResolvedValue([]) };
  const skillService = { getCharacterSkills: vi.fn().mockResolvedValue([]) };
  const spellRepository = {
    getSpellsByIndexes: vi.fn().mockResolvedValue([]),
    getSpellRefsByIndexes: vi.fn().mockResolvedValue([])
  };
  const characterClassRepository = {
    getSpellcastingSources: vi.fn().mockResolvedValue([]),
    getRulesByIds: vi.fn().mockResolvedValue([
      { id: CLASS_ID, name: "Mago", ruleset: SYSTEM_ID, hit_die: 6, levels: [] }
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
  const raceRepository = { getSpellcastingAttribute: vi.fn(), getRaceRefsBySystems: vi.fn() };
  const creatureRepository = {
    getByIds: vi.fn().mockResolvedValue([]),
    getSummariesByIds: vi.fn().mockResolvedValue([])
  };
  const attributeService = {
    getBySystems: vi.fn().mockResolvedValue([
      { id: "attr-dex", key: "dex", name: "Destreza", description: "", abbreviation: "DES", ruleset: SYSTEM_ID }
    ]),
    formatAttributes: vi.fn().mockImplementation(async (attributes: { key: string; value: number }[]) =>
      attributes.map(attribute => ({ ...attribute, modifier: Math.floor((attribute.value - 10) / 2) }))
    )
  };
  const systemRepository = {
    getMergedRulesConfig: vi.fn().mockResolvedValue({
      xpProgression: [0, 300],
      globalModifierFormula: "Math.floor((value - 10) / 2)",
      restRules: {
        kinds: [{ key: "longRest", includes: [] }]
      }
    }),
    getSystemsAndAncestors: vi.fn().mockResolvedValue([SYSTEM_ID]),
    getInitiativeBonusFormula: vi.fn(),
    getGlobalModifierFormula: vi.fn()
  };
  const coinRepository = {
    getBySystems: vi.fn().mockResolvedValue([]),
    getCoinsByIds: vi.fn().mockResolvedValue([])
  };
  const campaignReader = { getById: vi.fn(), getNamesByIds: vi.fn().mockResolvedValue(new Map()) };
  const conditionRepository = {
    getById: vi.fn(),
    getByIds: vi.fn().mockResolvedValue([])
  };

  let repository: CharacterRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    userRepository.getUserName.mockResolvedValue("Ada");
    equipmentRepository.getCharacterEquipmentsByIds.mockResolvedValue([]);
    equipmentRepository.getArmorClassInputsByIds.mockResolvedValue([]);
    traitRepository.getTraitsByIndexes.mockResolvedValue([]);
    traitRepository.getArmorClassInputsByIds.mockResolvedValue([]);
    spellRepository.getSpellsByIndexes.mockResolvedValue([]);
    spellRepository.getSpellRefsByIndexes.mockResolvedValue([]);
    creatureRepository.getSummariesByIds.mockResolvedValue([]);
    creatureRepository.getByIds.mockResolvedValue([]);
    characterClassRepository.getSpellcastingSources.mockResolvedValue([{
      class: CLASS_ID,
      abilityKey: "int",
      slots: { slots: { 1: 2 } }
    }]);
    characterClassRepository.getRulesByIds.mockResolvedValue([
      { id: CLASS_ID, name: "Mago", ruleset: SYSTEM_ID, hit_die: 6, levels: [] }
    ]);
    systemRepository.getMergedRulesConfig.mockResolvedValue({
      xpProgression: [0, 300],
      globalModifierFormula: "Math.floor((value - 10) / 2)",
      restRules: {
        kinds: [{ key: "longRest", includes: [] }],
        hitPointRecovery: [{ restKey: "longRest", hp: "full", hitDice: "all" }],
        spellSlotRecovery: [{ restKey: "longRest", pool: "all" }]
      }
    });
    systemRepository.getSystemsAndAncestors.mockResolvedValue([SYSTEM_ID]);
    conditionRepository.getByIds.mockResolvedValue([]);
    const doc = sheetDoc();
    vi.mocked(CharacterModel.findById).mockResolvedValue(doc as never);
    vi.mocked(CharacterModel.findByIdAndUpdate).mockImplementation(async (_id, update) => {
      const set = (update as { $set?: Record<string, unknown> })?.$set ?? {};
      return { ...doc, ...set };
    });

    repository = new CharacterRepository(
      userRepository as never,
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

  it("applyHp returns only hpCurrent and skips spell hydration", async () => {
    const result = await repository.applyHp({
      id: CHAR_ID,
      amount: 3,
      kind: "damage",
      userId: USER_ID
    });

    expect(result).toEqual({ hpCurrent: 5 });
    expect(result).not.toHaveProperty("spells");
    expect(spellRepository.getSpellsByIndexes).not.toHaveBeenCalled();
    expect(equipmentRepository.getCharacterEquipmentsByIds).not.toHaveBeenCalled();
  });

  it("spendHitDice returns hpCurrent and hitDice without the sheet", async () => {
    const result = await repository.spendHitDice({
      id: CHAR_ID,
      classId: CLASS_ID,
      count: 1,
      hpGained: 4,
      userId: USER_ID
    });

    expect(result.hpCurrent).toBe(8);
    expect(result.hitDice).toEqual([expect.objectContaining({
      classId: CLASS_ID,
      spent: 1,
      remaining: 0,
      total: 1
    })]);
    expect(result).not.toHaveProperty("spells");
    expect(spellRepository.getSpellsByIndexes).not.toHaveBeenCalled();
  });

  it("spendSpellSlot returns only spellSlots", async () => {
    const result = await repository.spendSpellSlot({
      id: CHAR_ID,
      classId: CLASS_ID,
      pool: "standard",
      level: 1,
      userId: USER_ID
    });

    expect(result.spellSlots).toEqual([expect.objectContaining({
      classId: CLASS_ID,
      pool: "standard",
      level: 1,
      spent: 1,
      remaining: 1,
      total: 2
    })]);
    expect(result).not.toHaveProperty("hpCurrent");
    expect(result).not.toHaveProperty("spells");
    expect(spellRepository.getSpellsByIndexes).not.toHaveBeenCalled();
  });

  it("applyCharacterCondition returns only activeConditions", async () => {
    conditionRepository.getById.mockResolvedValue({
      id: CONDITION_ID,
      name: "Envenenado",
      ruleset: SYSTEM_ID,
      deletedAt: null,
      levels: []
    });
    conditionRepository.getByIds.mockResolvedValue([
      { id: CONDITION_ID, name: "Envenenado" }
    ]);

    const result = await repository.applyCharacterCondition({
      id: CHAR_ID,
      conditionId: CONDITION_ID,
      userId: USER_ID
    });

    expect(result).toEqual({
      activeConditions: [{ conditionId: CONDITION_ID, name: "Envenenado" }]
    });
    expect(result).not.toHaveProperty("spells");
    expect(spellRepository.getSpellsByIndexes).not.toHaveBeenCalled();
  });

  it("addForm returns summarized forms without combat overlays", async () => {
    creatureRepository.getSummariesByIds.mockResolvedValue([
      { id: CREATURE_ID, name: "Lechuza", size: "Tiny", cr: 0 }
    ]);
    spellRepository.getSpellRefsByIndexes.mockResolvedValue([
      { id: SPELL_ID, name: "Encontrar familiar", level: 1 }
    ]);

    const result = await repository.addForm({
      id: CHAR_ID,
      userId: USER_ID,
      entry: { creatureId: CREATURE_ID, spellId: SPELL_ID, purpose: "companion" },
      choose: 1,
      replaceOnRecast: true
    });

    expect(result.activeFormId).toBeNull();
    expect(result.forms?.[0]).toMatchObject({
      creature: { id: CREATURE_ID, name: "Lechuza" },
      purpose: "companion",
      spell: { id: SPELL_ID, name: "Encontrar familiar" }
    });
    expect(result).not.toHaveProperty("ac");
    expect(result).not.toHaveProperty("hpCurrent");
    expect(result).not.toHaveProperty("attributes");
    expect(spellRepository.getSpellsByIndexes).not.toHaveBeenCalled();
    expect(creatureRepository.getByIds).not.toHaveBeenCalled();
  });

  it("activateForm returns overlay stats without hydrating known spells", async () => {
    const doc = {
      ...sheetDoc(),
      forms: [{ id: FORM_ID, creatureId: CREATURE_ID, spellId: SPELL_ID, purpose: "self" }]
    };
    vi.mocked(CharacterModel.findById).mockResolvedValue(doc as never);
    vi.mocked(CharacterModel.findByIdAndUpdate).mockResolvedValue({
      ...doc,
      activeFormId: FORM_ID
    } as never);
    creatureRepository.getSummariesByIds.mockResolvedValue([
      { id: CREATURE_ID, name: "Lobo", size: "Medium", cr: 0.25 }
    ]);
    creatureRepository.getByIds.mockResolvedValue([{
      id: CREATURE_ID,
      name: "Lobo",
      size: "Medium",
      speed: { walk: 12 },
      CA: 13,
      HPMax: 11,
      attributes: [{ key: "dex", value: 15, modifier: 2 }],
      damage_resistances: [],
      condition_immunities: []
    }]);

    const result = await repository.activateForm({
      id: CHAR_ID,
      formId: FORM_ID,
      userId: USER_ID
    });

    expect(result.activeFormId).toBe(FORM_ID);
    expect(result.hpCurrent).toBe(11);
    expect(result.hpMax).toBe(11);
    expect(result.ac).toBe(13);
    expect(result.forms?.[0].creature).toMatchObject({ id: CREATURE_ID, name: "Lobo" });
    expect(result).not.toHaveProperty("spells");
    expect(spellRepository.getSpellsByIndexes).not.toHaveBeenCalled();
  });

  it("useTrait without stance returns only trait resources", async () => {
    const doc = { ...sheetDoc(), traits: [TRAIT_ID] };
    vi.mocked(CharacterModel.findById).mockResolvedValue(doc as never);
    traitRepository.getTraitsByIndexes.mockResolvedValue([{
      id: TRAIT_ID,
      name: "Segundo aliento",
      action: { uses: 1, kind: "instant" }
    }]);

    const result = await repository.useTrait({
      id: CHAR_ID,
      traitId: TRAIT_ID,
      userId: USER_ID
    });

    expect(result.traitResources).toEqual([{ traitId: TRAIT_ID, spent: 1 }]);
    expect(result.activeTraitIds).toEqual([]);
    expect(result).not.toHaveProperty("equipment");
    expect(result).not.toHaveProperty("spells");
    expect(spellRepository.getSpellsByIndexes).not.toHaveBeenCalled();
  });

  it("restCharacter returns resource patch without the spell catalog", async () => {
    const result = await repository.restCharacter({
      id: CHAR_ID,
      type: "longRest",
      userId: USER_ID
    });

    expect(result.hpCurrent).toBe(8);
    expect(result.hitDice).toBeDefined();
    expect(result.spellSlots).toBeDefined();
    expect(result.traitResources).toEqual([]);
    expect(result.activeTraitIds).toEqual([]);
    expect(result.activeConditions).toEqual([]);
    expect(result).not.toHaveProperty("spells");
    expect(spellRepository.getSpellsByIndexes).not.toHaveBeenCalled();
  });
});
