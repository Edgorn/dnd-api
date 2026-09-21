import { describe, it, expect, vi } from "vitest";
import CreateBackground from "./createBackground.use-case";
import UpdateBackground from "./updateBackground.use-case";
import IBackgroundRepository from "../../../domain/repositories/IBackgroundRepository";
import ISystemRepository from "../../../domain/repositories/ISystemRepository";
import { BackgroundApi, InputCreateBackground } from "../../../domain/types/background.types";
import { AppError, NotFoundError, ValidationError } from "../../../domain/errors/AppError";

const PARENT_ID = "507f1f77bcf86cd799439011";
const VARIANT_ID = "507f1f77bcf86cd799439022";
const PHB = "507f1f77bcf86cd799439001";
const DRAGONLANCE = "507f1f77bcf86cd799439002";
const OTHER = "507f1f77bcf86cd799439003";

function nobleApi(overrides: Partial<BackgroundApi> = {}): BackgroundApi {
  return {
    id: PARENT_ID,
    ruleset: PHB,
    parentId: null,
    name: "Noble",
    description: ["Linaje"],
    img: "",
    traits: [],
    proficiencies: [],
    personalized_equipment: [],
    money: [],
    god: false,
    personality_traits: [],
    ideals: [],
    bonds: [],
    flaws: [],
    variants: [],
    ...overrides
  };
}

describe("CreateBackground variants", () => {
  it("creates a root background without parent validation", async () => {
    const created = nobleApi();
    const backgroundRepository = {
      getById: vi.fn(),
      create: vi.fn().mockResolvedValue(created)
    } as unknown as IBackgroundRepository;
    const systemRepository = {
      getSystemsAndAncestors: vi.fn()
    } as unknown as ISystemRepository;

    const useCase = new CreateBackground(backgroundRepository, systemRepository);
    const input: InputCreateBackground = { ruleset: PHB, name: "Noble" };
    const result = await useCase.execute(input);

    expect(backgroundRepository.getById).not.toHaveBeenCalled();
    expect(backgroundRepository.create).toHaveBeenCalledWith(input);
    expect(result).toEqual(created);
  });

  it("creates a variant when the parent is a root in the same ancestry", async () => {
    const backgroundRepository = {
      getById: vi.fn().mockResolvedValue(nobleApi()),
      create: vi.fn().mockResolvedValue(nobleApi({ id: VARIANT_ID, name: "Caballero", parentId: PARENT_ID }))
    } as unknown as IBackgroundRepository;
    const systemRepository = {
      getSystemsAndAncestors: vi.fn().mockResolvedValue([PHB])
    } as unknown as ISystemRepository;

    const useCase = new CreateBackground(backgroundRepository, systemRepository);
    await useCase.execute({ ruleset: PHB, name: "Caballero", parentId: PARENT_ID });

    expect(systemRepository.getSystemsAndAncestors).toHaveBeenCalledWith([PHB]);
    expect(backgroundRepository.create).toHaveBeenCalled();
  });

  it("allows a descendant system to add a variant of an inherited background", async () => {
    const backgroundRepository = {
      getById: vi.fn().mockResolvedValue(nobleApi()),
      create: vi.fn().mockResolvedValue(nobleApi({ id: VARIANT_ID, parentId: PARENT_ID, ruleset: DRAGONLANCE }))
    } as unknown as IBackgroundRepository;
    const systemRepository = {
      getSystemsAndAncestors: vi.fn().mockResolvedValue([DRAGONLANCE, PHB])
    } as unknown as ISystemRepository;

    const useCase = new CreateBackground(backgroundRepository, systemRepository);
    await useCase.execute({ ruleset: DRAGONLANCE, name: "Caballero de Solamnia", parentId: PARENT_ID });

    expect(backgroundRepository.create).toHaveBeenCalled();
  });

  it("throws 404 when the parent does not exist", async () => {
    const backgroundRepository = {
      getById: vi.fn().mockResolvedValue(null),
      create: vi.fn()
    } as unknown as IBackgroundRepository;
    const systemRepository = {
      getSystemsAndAncestors: vi.fn()
    } as unknown as ISystemRepository;

    const useCase = new CreateBackground(backgroundRepository, systemRepository);

    await expect(
      useCase.execute({ ruleset: PHB, name: "Caballero", parentId: PARENT_ID })
    ).rejects.toSatisfy((error: unknown) => error instanceof NotFoundError && error.statusCode === 404);
    expect(backgroundRepository.create).not.toHaveBeenCalled();
  });

  it("throws 400 when the parent is itself a variant", async () => {
    const backgroundRepository = {
      getById: vi.fn().mockResolvedValue(nobleApi({ parentId: "another-root" })),
      create: vi.fn()
    } as unknown as IBackgroundRepository;
    const systemRepository = {
      getSystemsAndAncestors: vi.fn()
    } as unknown as ISystemRepository;

    const useCase = new CreateBackground(backgroundRepository, systemRepository);

    await expect(
      useCase.execute({ ruleset: PHB, name: "Caballero", parentId: PARENT_ID })
    ).rejects.toSatisfy((error: unknown) => error instanceof ValidationError && error.statusCode === 400);
    expect(backgroundRepository.create).not.toHaveBeenCalled();
  });

  it("throws 400 when the child ruleset is not a descendant of the parent", async () => {
    const backgroundRepository = {
      getById: vi.fn().mockResolvedValue(nobleApi()),
      create: vi.fn()
    } as unknown as IBackgroundRepository;
    const systemRepository = {
      getSystemsAndAncestors: vi.fn().mockResolvedValue([OTHER])
    } as unknown as ISystemRepository;

    const useCase = new CreateBackground(backgroundRepository, systemRepository);

    await expect(
      useCase.execute({ ruleset: OTHER, name: "Caballero", parentId: PARENT_ID })
    ).rejects.toSatisfy((error: unknown) => error instanceof AppError && error.statusCode === 400);
    expect(backgroundRepository.create).not.toHaveBeenCalled();
  });
});

describe("UpdateBackground variants", () => {
  it("revalidates ancestry when updating a variant ruleset", async () => {
    const backgroundRepository = {
      getById: vi.fn()
        .mockResolvedValueOnce(nobleApi({ id: VARIANT_ID, parentId: PARENT_ID, ruleset: PHB }))
        .mockResolvedValueOnce(nobleApi()),
      update: vi.fn().mockResolvedValue(nobleApi({ id: VARIANT_ID, parentId: PARENT_ID, ruleset: DRAGONLANCE }))
    } as unknown as IBackgroundRepository;
    const systemRepository = {
      getSystemsAndAncestors: vi.fn().mockResolvedValue([DRAGONLANCE, PHB])
    } as unknown as ISystemRepository;

    const useCase = new UpdateBackground(backgroundRepository, systemRepository);
    await useCase.execute({ id: VARIANT_ID, ruleset: DRAGONLANCE });

    expect(systemRepository.getSystemsAndAncestors).toHaveBeenCalledWith([DRAGONLANCE]);
    expect(backgroundRepository.update).toHaveBeenCalled();
  });

  it("throws 404 when the background to update does not exist", async () => {
    const backgroundRepository = {
      getById: vi.fn().mockResolvedValue(null),
      update: vi.fn()
    } as unknown as IBackgroundRepository;
    const systemRepository = {
      getSystemsAndAncestors: vi.fn()
    } as unknown as ISystemRepository;

    const useCase = new UpdateBackground(backgroundRepository, systemRepository);

    await expect(useCase.execute({ id: VARIANT_ID, name: "X" })).rejects.toSatisfy(
      (error: unknown) => error instanceof NotFoundError
    );
    expect(backgroundRepository.update).not.toHaveBeenCalled();
  });
});
