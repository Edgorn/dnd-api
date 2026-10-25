import { describe, it, expect, vi, beforeEach } from "vitest";
import CharacterRepository, { CHARACTER_LIST_SELECT } from "./character.repository";
import CharacterModel from "../schemas/Character";

vi.mock("../schemas/Character", () => ({
  default: {
    find: vi.fn(),
    updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
    bulkWrite: vi.fn()
  }
}));

const USER_ID = "507f1f77bcf86cd799439001";
const SYSTEM_ID = "507f1f77bcf86cd799439002";
const SUBCLASS_ID = "507f1f77bcf86cd799439003";
const CHAR_A = "507f1f77bcf86cd799439004";
const CHAR_B = "507f1f77bcf86cd799439005";
const TRAIT_ID = "507f1f77bcf86cd799439006";
const ARMOR_ID = "507f1f77bcf86cd799439007";

function listDoc(id: string, systems: string[] = [SYSTEM_ID], extra: { ac?: number } = {}) {
  return {
    _id: { toString: () => id },
    ...(extra.ac !== undefined ? { ac: extra.ac } : {}),
    img: "",
    name: id,
    race: "Humano",
    user: USER_ID,
    campaign: null,
    classes: [{ class: "class-1", name: "Guerrero", level: 1, hitDie: 10 }],
    subclasses: [SUBCLASS_ID],
    hpMax: 12,
    hpCurrent: 12,
    xp: 0,
    attributes: [{ key: "dex", value: 14 }],
    systems,
    speed: { walk: 9 },
    traits: [TRAIT_ID],
    traitsData: {},
    equipment: [{
      instanceId: `eq-${id}`,
      equipmentId: ARMOR_ID,
      quantity: 1,
      equipped: true,
      isMagic: false,
      isBond: false,
      isFavorite: false
    }]
  };
}

function mockFindLean(docs: unknown[]) {
  const lean = vi.fn().mockResolvedValue(docs);
  const sort = vi.fn().mockReturnValue({ lean });
  const collation = vi.fn().mockReturnValue({ sort });
  const select = vi.fn().mockReturnValue({ collation });
  const whereIn = vi.fn().mockReturnValue({ select });
  const where = vi.fn().mockReturnValue({ in: whereIn });
  vi.mocked(CharacterModel.find).mockReturnValue({
    select,
    collation,
    sort,
    lean,
    where
  } as never);
  return { select, collation, sort, lean, where, whereIn };
}

describe("CharacterRepository list queries", () => {
  const userRepository = { getUserName: vi.fn().mockResolvedValue("Edgar") };
  const equipmentRepository = {
    getCharacterEquipmentsByIds: vi.fn().mockResolvedValue([]),
    getArmorClassInputsByIds: vi.fn().mockResolvedValue([])
  };
  const traitRepository = {
    getTraitsByIndexes: vi.fn().mockResolvedValue([]),
    getArmorClassInputsByIds: vi.fn().mockResolvedValue([])
  };
  const subclassRepository = {
    getByIds: vi.fn(),
    getSummariesByIds: vi.fn().mockResolvedValue([
      { id: SUBCLASS_ID, name: "Campeón", classId: "class-1" }
    ])
  };
  const attributeService = {
    formatAttributes: vi.fn().mockImplementation(async (attributes: { key: string; value: number }[]) =>
      attributes.map(attribute => ({ ...attribute, modifier: Math.floor(attribute.value / 2) - 5 }))
    )
  };
  const systemRepository = {
    getMergedRulesConfig: vi.fn().mockResolvedValue({
      xpProgression: [0, 300],
      globalModifierFormula: "Math.floor((value - 10) / 2)"
    })
  };
  const campaignReader = { getNamesByIds: vi.fn().mockResolvedValue(new Map()) };

  let repository: CharacterRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    userRepository.getUserName.mockResolvedValue("Edgar");
    equipmentRepository.getCharacterEquipmentsByIds.mockResolvedValue([]);
    equipmentRepository.getArmorClassInputsByIds.mockResolvedValue([]);
    traitRepository.getTraitsByIndexes.mockResolvedValue([]);
    traitRepository.getArmorClassInputsByIds.mockResolvedValue([]);
    subclassRepository.getSummariesByIds.mockResolvedValue([
      { id: SUBCLASS_ID, name: "Campeón", classId: "class-1" }
    ]);
    systemRepository.getMergedRulesConfig.mockResolvedValue({
      xpProgression: [0, 300],
      globalModifierFormula: "Math.floor((value - 10) / 2)"
    });
    campaignReader.getNamesByIds.mockResolvedValue(new Map());
    repository = new CharacterRepository(
      userRepository as never,
      equipmentRepository as never,
      traitRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      subclassRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      attributeService as never,
      systemRepository as never,
      {} as never,
      campaignReader as never,
      {} as never,
      {} as never,
      {} as never
    );
  });

  it("getByUser projects list fields and does not hydrate full subclasses", async () => {
    const { select } = mockFindLean([listDoc(CHAR_A), listDoc(CHAR_B)]);

    const result = await repository.getByUser(USER_ID);

    expect(select).toHaveBeenCalledWith(CHARACTER_LIST_SELECT);
    expect(subclassRepository.getSummariesByIds).toHaveBeenCalledWith([SUBCLASS_ID]);
    expect(subclassRepository.getByIds).not.toHaveBeenCalled();
    expect(traitRepository.getArmorClassInputsByIds).toHaveBeenCalledTimes(1);
    expect(traitRepository.getArmorClassInputsByIds).toHaveBeenCalledWith([TRAIT_ID]);
    expect(traitRepository.getTraitsByIndexes).not.toHaveBeenCalled();
    expect(equipmentRepository.getArmorClassInputsByIds).toHaveBeenCalledTimes(1);
    expect(equipmentRepository.getCharacterEquipmentsByIds).not.toHaveBeenCalled();
    expect(systemRepository.getMergedRulesConfig).toHaveBeenCalledTimes(1);
    expect(systemRepository.getMergedRulesConfig).toHaveBeenCalledWith([SYSTEM_ID]);
    expect(result).toHaveLength(2);
    expect(result[0].subclasses).toEqual([
      { class: "class-1", name: "Campeón", id: SUBCLASS_ID }
    ]);
    expect(result[0]).not.toHaveProperty("attributes");
    expect(result[0]).not.toHaveProperty("speed");
    expect(result[0]).not.toHaveProperty("systems");
  });

  it("getByUser includes combat seed fields when requested", async () => {
    mockFindLean([listDoc(CHAR_A)]);

    const [item] = await repository.getByUser(USER_ID, { includeCombatSeed: true });

    expect(item.attributes).toEqual([{ key: "dex", value: 14 }]);
    expect(item.systems).toEqual([SYSTEM_ID]);
    expect(item.speed).toEqual({ walk: 9 });
  });

  it("getByIds keeps combat seed fields for campaign", async () => {
    const { whereIn } = mockFindLean([listDoc(CHAR_A)]);

    const [item] = await repository.getByIds([CHAR_A]);

    expect(whereIn).toHaveBeenCalledWith([CHAR_A]);
    expect(item.attributes).toEqual([{ key: "dex", value: 14 }]);
    expect(item.systems).toEqual([SYSTEM_ID]);
    expect(item.speed).toEqual({ walk: 9 });
  });

  it("getByIds returns empty without querying when there are no ids", async () => {
    const result = await repository.getByIds([]);

    expect(CharacterModel.find).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("merges rules once per distinct systems combination", async () => {
    mockFindLean([
      listDoc(CHAR_A, [SYSTEM_ID], { ac: 16 }),
      listDoc(CHAR_B, [SYSTEM_ID, "sys-b"], { ac: 15 })
    ]);

    await repository.getByUser(USER_ID);

    expect(systemRepository.getMergedRulesConfig).toHaveBeenCalledTimes(2);
  });

  it("getByUser uses stored ac and skips armor-class catalog reads", async () => {
    mockFindLean([listDoc(CHAR_A, [SYSTEM_ID], { ac: 16 })]);

    const [item] = await repository.getByUser(USER_ID);

    expect(item.ac).toBe(16);
    expect(traitRepository.getArmorClassInputsByIds).not.toHaveBeenCalled();
    expect(equipmentRepository.getArmorClassInputsByIds).not.toHaveBeenCalled();
    expect(CharacterModel.updateOne).not.toHaveBeenCalled();
  });

  it("getByUser computes and persists ac when it is missing", async () => {
    mockFindLean([listDoc(CHAR_A)]);

    const [item] = await repository.getByUser(USER_ID);
    await Promise.resolve();
    await Promise.resolve();

    expect(item.ac).toBe(12);
    expect(traitRepository.getArmorClassInputsByIds).toHaveBeenCalledWith([TRAIT_ID]);
    expect(CharacterModel.updateOne).toHaveBeenCalledWith(
      { _id: expect.anything() },
      { $set: { ac: 12 } }
    );
  });

  it("includeCombatSeed still overlays attributes even with stored ac", async () => {
    mockFindLean([listDoc(CHAR_A, [SYSTEM_ID], { ac: 16 })]);

    const [item] = await repository.getByUser(USER_ID, { includeCombatSeed: true });

    expect(item.ac).toBe(12);
    expect(item.attributes).toEqual([{ key: "dex", value: 14 }]);
    expect(traitRepository.getArmorClassInputsByIds).toHaveBeenCalledTimes(1);
  });

  it("refreshStoredAc persists when the stored value differs", async () => {
    const ac = await repository.refreshStoredAc(listDoc(CHAR_A) as never);

    expect(ac).toBe(12);
    expect(CharacterModel.updateOne).toHaveBeenCalledWith(
      { _id: expect.anything() },
      { $set: { ac: 12 } }
    );
  });

  it("refreshStoredAc skips the write when ac already matches", async () => {
    const ac = await repository.refreshStoredAc(listDoc(CHAR_A, [SYSTEM_ID], { ac: 12 }) as never);

    expect(ac).toBe(12);
    expect(CharacterModel.updateOne).not.toHaveBeenCalled();
  });
});
