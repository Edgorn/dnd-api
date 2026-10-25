import { describe, it, expect, vi, beforeEach } from "vitest";
import CharacterRepository from "./character.repository";
import CharacterModel from "../schemas/Character";

vi.mock("../schemas/Character", () => ({
  default: {
    findById: vi.fn(),
    updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 })
  }
}));

const USER_ID = "507f1f77bcf86cd799439001";
const SYSTEM_ID = "507f1f77bcf86cd799439002";
const CLASS_ID = "507f1f77bcf86cd799439003";
const CHAR_ID = "507f1f77bcf86cd799439004";
const SUBCLASS_ID = "507f1f77bcf86cd799439005";
const SPELL_ID = "507f1f77bcf86cd799439006";

function sheetDoc() {
  return {
    _id: { toString: () => CHAR_ID },
    img: "",
    name: "Ada",
    race: "Humano",
    user: USER_ID,
    campaign: null,
    classes: [{ class: CLASS_ID, name: "Guerrero", level: 1, hitDie: 10 }],
    subclasses: [SUBCLASS_ID],
    hpMax: 12,
    hpCurrent: 12,
    xp: 0,
    attributes: [{ key: "str", value: 10 }, { key: "dex", value: 14 }],
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
    size: "medium"
  };
}

describe("CharacterRepository.getById query budget", () => {
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
    getSpellcastingSources: vi.fn().mockResolvedValue([]),
    getRulesByIds: vi.fn().mockResolvedValue([
      { id: CLASS_ID, name: "Guerrero", ruleset: SYSTEM_ID, hit_die: 10, levels: [] }
    ]),
    getById: vi.fn(),
    dataLevelUp: vi.fn()
  };
  const subclassRepository = {
    getRulesByIds: vi.fn().mockResolvedValue([
      { id: SUBCLASS_ID, classId: CLASS_ID, name: "Campeón", ruleset: SYSTEM_ID, levels: [], expandedSpells: [] }
    ]),
    getSummariesByIds: vi.fn().mockResolvedValue([
      { id: SUBCLASS_ID, name: "Campeón", classId: CLASS_ID }
    ]),
    getByIds: vi.fn()
  };
  const groupOptionRepository = {
    getByIds: vi.fn().mockResolvedValue([])
  };
  const optionGroupRepository = {
    getByIds: vi.fn().mockResolvedValue([])
  };
  const raceRepository = {
    getSpellcastingAttribute: vi.fn()
  };
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
      globalModifierFormula: "Math.floor((value - 10) / 2)"
    }),
    getInitiativeBonusFormula: vi.fn(),
    getGlobalModifierFormula: vi.fn()
  };
  const coinRepository = {
    getBySystems: vi.fn().mockResolvedValue([]),
    getCoinsByIds: vi.fn().mockResolvedValue([])
  };
  const campaignReader = {
    getById: vi.fn()
  };
  const conditionRepository = {
    getByIds: vi.fn().mockResolvedValue([])
  };

  let repository: CharacterRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    equipmentRepository.getCharacterEquipmentsByIds.mockResolvedValue([]);
    equipmentRepository.getArmorClassInputsByIds.mockResolvedValue([]);
    spellRepository.getSpellRefsByIndexes.mockResolvedValue([]);
    creatureRepository.getSummariesByIds.mockResolvedValue([]);
    traitRepository.getTraitsByIndexes.mockResolvedValue([]);
    proficiencyRepository.getProficienciesByIndices.mockResolvedValue([]);
    proficiencyRepository.getDescendantProficiencies.mockResolvedValue([]);
    languageRepository.getByIds.mockResolvedValue([]);
    skillService.getCharacterSkills.mockResolvedValue([]);
    spellRepository.getSpellsByIndexes.mockResolvedValue([]);
    characterClassRepository.getSpellcastingSources.mockResolvedValue([]);
    characterClassRepository.getRulesByIds.mockResolvedValue([
      { id: CLASS_ID, name: "Guerrero", ruleset: SYSTEM_ID, hit_die: 10, levels: [] }
    ]);
    subclassRepository.getRulesByIds.mockResolvedValue([
      { id: SUBCLASS_ID, classId: CLASS_ID, name: "Campeón", ruleset: SYSTEM_ID, levels: [], expandedSpells: [] }
    ]);
    subclassRepository.getSummariesByIds.mockResolvedValue([
      { id: SUBCLASS_ID, name: "Campeón", classId: CLASS_ID }
    ]);
    systemRepository.getMergedRulesConfig.mockResolvedValue({
      xpProgression: [0, 300],
      globalModifierFormula: "Math.floor((value - 10) / 2)"
    });
    coinRepository.getBySystems.mockResolvedValue([]);
    conditionRepository.getByIds.mockResolvedValue([]);
    attributeService.getBySystems.mockResolvedValue([
      { id: "attr-dex", key: "dex", name: "Destreza", description: "", abbreviation: "DES", ruleset: SYSTEM_ID }
    ]);
    vi.mocked(CharacterModel.findById).mockReturnValue({
      lean: vi.fn().mockResolvedValue(sheetDoc())
    } as never);

    repository = new CharacterRepository(
      { getUserName: vi.fn() } as never,
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

  it("loads the sheet with one rules config, class rules, subclass rules and spell batch", async () => {
    const result = await repository.getById(CHAR_ID, USER_ID);

    expect(result.id).toBe(CHAR_ID);
    expect(result.name).toBe("Ada");
    expect(systemRepository.getMergedRulesConfig).toHaveBeenCalledTimes(1);
    expect(systemRepository.getInitiativeBonusFormula).not.toHaveBeenCalled();
    expect(attributeService.getBySystems).toHaveBeenCalledTimes(1);
    expect(characterClassRepository.getRulesByIds).toHaveBeenCalledTimes(1);
    expect(characterClassRepository.getById).not.toHaveBeenCalled();
    expect(subclassRepository.getRulesByIds).toHaveBeenCalledTimes(1);
    expect(subclassRepository.getByIds).not.toHaveBeenCalled();
    expect(spellRepository.getSpellsByIndexes).toHaveBeenCalledTimes(1);
    expect(spellRepository.getSpellsByIndexes).toHaveBeenCalledWith([SPELL_ID]);
    expect(campaignReader.getById).not.toHaveBeenCalled();
  });

  it("combat view skips full equipment, money and spell hydration", async () => {
    spellRepository.getSpellRefsByIndexes.mockResolvedValue([
      { id: SPELL_ID, name: "Escudo", level: 1 }
    ]);

    const result = await repository.getById(CHAR_ID, USER_ID, { view: "combat" });

    expect(result).not.toHaveProperty("equipment");
    expect(result).not.toHaveProperty("money");
    expect((result as { spells: Record<string, { list: Array<{ id: string }> }> }).spells[CLASS_ID].list).toEqual([
      { id: SPELL_ID, name: "Escudo", level: 1 }
    ]);
    expect(equipmentRepository.getCharacterEquipmentsByIds).not.toHaveBeenCalled();
    expect(equipmentRepository.getArmorClassInputsByIds).toHaveBeenCalledTimes(1);
    expect(coinRepository.getBySystems).not.toHaveBeenCalled();
    expect(proficiencyRepository.getDescendantProficiencies).not.toHaveBeenCalled();
    expect(spellRepository.getSpellsByIndexes).not.toHaveBeenCalled();
    expect(spellRepository.getSpellRefsByIndexes).toHaveBeenCalledTimes(1);
  });

  it("sheet view maps spells by id and summarizes inactive forms", async () => {
    const ACTIVE_FORM = "507f1f77bcf86cd7994390aa";
    const INACTIVE_FORM = "507f1f77bcf86cd7994390ab";
    const ACTIVE_CREATURE = "507f1f77bcf86cd7994390ac";
    const INACTIVE_CREATURE = "507f1f77bcf86cd7994390ad";
    vi.mocked(CharacterModel.findById).mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        ...sheetDoc(),
        forms: [
          { id: ACTIVE_FORM, creatureId: ACTIVE_CREATURE, purpose: "self", spellId: SPELL_ID },
          { id: INACTIVE_FORM, creatureId: INACTIVE_CREATURE, purpose: "self" }
        ],
        activeFormId: ACTIVE_FORM
      })
    } as never);
    creatureRepository.getByIds.mockResolvedValue([
      { id: ACTIVE_CREATURE, name: "Oso", size: "large", CA: 11, HPMax: 34 }
    ]);
    creatureRepository.getSummariesByIds.mockResolvedValue([
      { id: INACTIVE_CREATURE, name: "Lobo", size: "medium", cr: 0.25 }
    ]);
    spellRepository.getSpellRefsByIndexes.mockResolvedValue([
      { id: SPELL_ID, name: "Escudo", level: 1 }
    ]);

    const result = await repository.getById(CHAR_ID, USER_ID, { view: "sheet" }) as {
      spells: Record<string, { list: string[] }>;
      spellsById: Record<string, { id: string }>;
      forms: Array<{ id: string; creature?: { id: string; cr?: number; CA?: number }; spell?: { id: string; name: string } }>;
    };

    expect(result.spells[CLASS_ID].list).toEqual([SPELL_ID]);
    expect(result.spellsById[SPELL_ID].id).toBe(SPELL_ID);
    expect(creatureRepository.getByIds).toHaveBeenCalledWith([ACTIVE_CREATURE]);
    expect(creatureRepository.getSummariesByIds).toHaveBeenCalledWith([INACTIVE_CREATURE]);
    expect(result.forms.find(form => form.id === INACTIVE_FORM)?.creature).toEqual({
      id: INACTIVE_CREATURE,
      name: "Lobo",
      size: "medium",
      cr: 0.25
    });
    expect(result.forms.find(form => form.id === ACTIVE_FORM)?.creature).toMatchObject({ CA: 11 });
    expect(result.forms.find(form => form.id === ACTIVE_FORM)?.spell).toEqual({
      id: SPELL_ID,
      name: "Escudo"
    });
    expect(spellRepository.getSpellsByIndexes).not.toHaveBeenCalled();
  });

  it("getByIdForExport reuses the same character load for the owner id", async () => {
    const result = await repository.getByIdForExport(CHAR_ID, USER_ID);

    expect(result.ownerId).toBe(USER_ID);
    expect(result.character.id).toBe(CHAR_ID);
    expect(CharacterModel.findById).toHaveBeenCalledTimes(1);
  });
});

describe("CharacterRepository.getLevelUpData query budget", () => {
  const CLASS_CATALOG = {
    id: CLASS_ID,
    name: "Guerrero",
    ruleset: SYSTEM_ID,
    hit_die: 10,
    deletedAt: null,
    levels: [],
    optionReplacements: []
  };

  it("loads the class catalog once and skips unused spell lists", async () => {
    const traitRepository = {
      getTraitsByIndexes: vi.fn().mockResolvedValue([])
    };
    const characterClassRepository = {
      getById: vi.fn().mockResolvedValue(CLASS_CATALOG),
      dataLevelUp: vi.fn().mockResolvedValue({
        hit_die: 10,
        traits: [],
        traits_data: {},
        ability_score: false,
        subclassChoice: null
      }),
      getRulesByIds: vi.fn().mockResolvedValue([CLASS_CATALOG])
    };
    const subclassRepository = {
      getRulesByIds: vi.fn().mockResolvedValue([]),
      getSummariesByClassAndSystems: vi.fn().mockResolvedValue([]),
      getByClassAndSystems: vi.fn()
    };
    const systemRepository = {
      getMergedRulesConfig: vi.fn().mockResolvedValue({
        proficiencyProgression: [2, 2]
      }),
      getSystemsAndAncestors: vi.fn().mockResolvedValue([SYSTEM_ID])
    };
    const groupOptionRepository = {
      getByGroupIds: vi.fn().mockResolvedValue([])
    };
    const optionGroupRepository = {
      getByIds: vi.fn().mockResolvedValue([])
    };
    const raceRepository = {
      getLevelUpDataByLevels: vi.fn().mockResolvedValue(new Map())
    };
    const attributeService = {
      formatAttributes: vi.fn().mockResolvedValue([]),
      getBySystems: vi.fn().mockResolvedValue([])
    };

    vi.mocked(CharacterModel.findById).mockReturnValue({
      lean: vi.fn().mockResolvedValue(sheetDoc())
    } as never);

    const repository = new CharacterRepository(
      { getUserName: vi.fn() } as never,
      { getCharacterEquipmentsByIds: vi.fn(), getArmorClassInputsByIds: vi.fn() } as never,
      traitRepository as never,
      { getProficienciesByIndices: vi.fn().mockResolvedValue([]) } as never,
      { getByIds: vi.fn().mockResolvedValue([]) } as never,
      { getCharacterSkills: vi.fn() } as never,
      { getSpellsByIndexes: vi.fn().mockResolvedValue([]), formatSpellChoices: vi.fn(), getSpellRefsByIndexes: vi.fn().mockResolvedValue([]), formatSpellChoiceRefs: vi.fn() } as never,
      characterClassRepository as never,
      subclassRepository as never,
      groupOptionRepository as never,
      optionGroupRepository as never,
      raceRepository as never,
      { getByIds: vi.fn() } as never,
      attributeService as never,
      systemRepository as never,
      { getBySystems: vi.fn() } as never,
      { getById: vi.fn() } as never,
      {} as never,
      {} as never,
      { getByIds: vi.fn() } as never
    );

    const data = await repository.getLevelUpData(CHAR_ID, CLASS_ID, USER_ID);

    expect(data.class).toBe(CLASS_ID);
    expect(characterClassRepository.getById).toHaveBeenCalledTimes(1);
    expect(characterClassRepository.dataLevelUp).toHaveBeenCalledWith(
      CLASS_ID,
      2,
      [SUBCLASS_ID],
      [SYSTEM_ID],
      { includeSpellList: false }
    );
    expect(systemRepository.getMergedRulesConfig).toHaveBeenCalledTimes(1);
  });

  it("compact view asks dataLevelUp for spell refs and subclass summaries", async () => {
    const characterClassRepository = {
      getById: vi.fn().mockResolvedValue(CLASS_CATALOG),
      dataLevelUp: vi.fn().mockResolvedValue({
        hit_die: 10,
        traits: [],
        traits_data: {},
        ability_score: false,
        subclassChoice: null
      }),
      getRulesByIds: vi.fn().mockResolvedValue([CLASS_CATALOG])
    };
    const subclassRepository = {
      getRulesByIds: vi.fn().mockResolvedValue([]),
      getSummariesByClassAndSystems: vi.fn().mockResolvedValue([]),
      getByClassAndSystems: vi.fn()
    };

    vi.mocked(CharacterModel.findById).mockReturnValue({
      lean: vi.fn().mockResolvedValue(sheetDoc())
    } as never);

    const repository = new CharacterRepository(
      { getUserName: vi.fn() } as never,
      { getCharacterEquipmentsByIds: vi.fn(), getArmorClassInputsByIds: vi.fn() } as never,
      { getTraitsByIndexes: vi.fn().mockResolvedValue([]) } as never,
      { getProficienciesByIndices: vi.fn().mockResolvedValue([]) } as never,
      { getByIds: vi.fn().mockResolvedValue([]) } as never,
      { getCharacterSkills: vi.fn() } as never,
      { getSpellsByIndexes: vi.fn().mockResolvedValue([]), formatSpellChoices: vi.fn(), getSpellRefsByIndexes: vi.fn().mockResolvedValue([]), formatSpellChoiceRefs: vi.fn() } as never,
      characterClassRepository as never,
      subclassRepository as never,
      { getByGroupIds: vi.fn().mockResolvedValue([]) } as never,
      { getByIds: vi.fn().mockResolvedValue([]) } as never,
      { getLevelUpDataByLevels: vi.fn().mockResolvedValue(new Map()) } as never,
      { getByIds: vi.fn() } as never,
      { formatAttributes: vi.fn().mockResolvedValue([]), getBySystems: vi.fn().mockResolvedValue([]) } as never,
      { getMergedRulesConfig: vi.fn().mockResolvedValue({ proficiencyProgression: [2, 2] }), getSystemsAndAncestors: vi.fn().mockResolvedValue([SYSTEM_ID]) } as never,
      { getBySystems: vi.fn() } as never,
      { getById: vi.fn() } as never,
      {} as never,
      {} as never,
      { getByIds: vi.fn() } as never
    );

    await repository.getLevelUpData(CHAR_ID, CLASS_ID, USER_ID, { view: "compact" });

    expect(characterClassRepository.dataLevelUp).toHaveBeenCalledWith(
      CLASS_ID,
      2,
      [SUBCLASS_ID],
      [SYSTEM_ID],
      { includeSpellList: false, spellChoiceMode: "refs", subclassMenuMode: "summaries" }
    );
    expect(subclassRepository.getByClassAndSystems).not.toHaveBeenCalled();
  });
});

