import { describe, it, expect, vi, beforeEach } from "vitest";
import GetSystemById from "./getSystemById.use-case";
import GetSystemApi from "./getSystemApi.use-case";
import SystemService from "../../../domain/services/system.service";
import IUserRepository from "../../../domain/repositories/IUserRepository";
import { AppError, NotFoundError } from "../../../domain/errors/AppError";
import { System, SystemApi } from "../../../domain/types/system.types";

function asId(id: string): System["_id"] {
  return { toString: () => id } as System["_id"];
}

function makeSystem(id: string, overrides: Partial<System> = {}): System {
  return {
    _id: asId(id),
    name: id,
    description: "",
    publisher: "owner-1",
    isOpen: false,
    isBase: true,
    kind: "ruleset",
    parentIds: [],
    ...overrides,
  };
}

const systemApi = { id: "sys-1", name: "Homebrew" } as SystemApi;

describe("GetSystemById", () => {
  const system = makeSystem("sys-1");
  const systemService = { getById: vi.fn() };
  const userRepository = { getUserById: vi.fn() };
  const getSystemApi = { execute: vi.fn() };

  let useCase: GetSystemById;

  beforeEach(() => {
    vi.clearAllMocks();
    systemService.getById.mockResolvedValue(system);
    userRepository.getUserById.mockResolvedValue({ accessibleSystems: [] });
    getSystemApi.execute.mockResolvedValue(systemApi);
    useCase = new GetSystemById(
      systemService as unknown as SystemService,
      userRepository as unknown as IUserRepository,
      getSystemApi as unknown as GetSystemApi
    );
  });

  it("returns SystemApi when the user is the publisher", async () => {
    const result = await useCase.execute("sys-1", "owner-1");

    expect(result).toEqual(systemApi);
    expect(getSystemApi.execute).toHaveBeenCalledWith(system, "owner-1");
  });

  it("returns SystemApi when the system is open", async () => {
    const openSystem = makeSystem("sys-1", { isOpen: true, publisher: "other" });
    systemService.getById.mockResolvedValue(openSystem);

    const result = await useCase.execute("sys-1", "reader-1");

    expect(result).toEqual(systemApi);
    expect(getSystemApi.execute).toHaveBeenCalledWith(openSystem, "reader-1");
  });

  it("returns SystemApi when the id is in accessibleSystems", async () => {
    userRepository.getUserById.mockResolvedValue({ accessibleSystems: ["sys-1"] });

    const result = await useCase.execute("sys-1", "reader-1");

    expect(result).toEqual(systemApi);
    expect(getSystemApi.execute).toHaveBeenCalledWith(system, "reader-1");
  });

  it("throws NotFoundError when the system does not exist or is deleted", async () => {
    systemService.getById.mockResolvedValue(null);

    await expect(useCase.execute("missing", "owner-1")).rejects.toBeInstanceOf(NotFoundError);
    expect(getSystemApi.execute).not.toHaveBeenCalled();
    expect(userRepository.getUserById).not.toHaveBeenCalled();
  });

  it("throws 403 when the user has no listing access, even with empty accessibleSystems", async () => {
    await expect(useCase.execute("sys-1", "outsider")).rejects.toSatisfy(
      (error: unknown) => error instanceof AppError && error.statusCode === 403
    );
    expect(getSystemApi.execute).not.toHaveBeenCalled();
  });

  it("throws 403 when accessibleSystems is non-empty but does not include the system", async () => {
    userRepository.getUserById.mockResolvedValue({ accessibleSystems: ["other-sys"] });

    await expect(useCase.execute("sys-1", "outsider")).rejects.toSatisfy(
      (error: unknown) => error instanceof AppError && error.statusCode === 403
    );
    expect(getSystemApi.execute).not.toHaveBeenCalled();
  });
});
