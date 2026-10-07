import { describe, it, expect, vi, beforeEach } from "vitest";
import CascadeSoftDeleteSystem from "./cascadeSoftDeleteSystem.use-case";
import CascadeRestoreSystem from "./cascadeRestoreSystem.use-case";
import SystemService from "../../../domain/services/system.service";
import { System } from "../../../domain/types/system.types";
import { AppError } from "../../../domain/errors/AppError";

function asId(id: string): System["_id"] {
  return { toString: () => id } as System["_id"];
}

function makeSystem(id: string, overrides: Partial<System> = {}): System {
  return {
    _id: asId(id),
    name: id,
    description: "",
    publisher: "user-1",
    isOpen: true,
    isBase: false,
    kind: "ruleset",
    parentIds: [],
    ...overrides,
  };
}

function emptyEntityRepo() {
  return {
    softDeleteByRuleset: vi.fn().mockResolvedValue(undefined),
    restoreByRuleset: vi.fn().mockResolvedValue(undefined),
  };
}

describe("CascadeSoftDeleteSystem", () => {
  const systemService = {
    getById: vi.fn(),
    getChildren: vi.fn(),
    softDelete: vi.fn().mockResolvedValue(undefined),
  };
  const attributes = emptyEntityRepo();
  const skills = emptyEntityRepo();
  const languages = emptyEntityRepo();
  let useCase: CascadeSoftDeleteSystem;

  beforeEach(() => {
    vi.clearAllMocks();
    systemService.softDelete.mockResolvedValue(undefined);
    useCase = new CascadeSoftDeleteSystem(
      systemService as unknown as SystemService,
      attributes as never,
      skills as never,
      languages as never
    );
  });

  it("deletes orphans whose only living parents are in the cascade set", async () => {
    const root = makeSystem("root", { isBase: true });
    const child = makeSystem("child", { parentIds: [asId("root")] });
    systemService.getById.mockImplementation(async (id: string) => {
      if (id === "root") return root;
      if (id === "child") return child;
      return null;
    });
    systemService.getChildren.mockImplementation(async (id: string) => {
      if (id === "root") return [child];
      return [];
    });

    await useCase.execute("root", "user-1");

    expect(systemService.softDelete).toHaveBeenCalledTimes(2);
    expect(systemService.softDelete).toHaveBeenCalledWith("root", expect.any(Date));
    expect(systemService.softDelete).toHaveBeenCalledWith("child", expect.any(Date));
  });

  it("keeps a child that still has another living parent", async () => {
    const root = makeSystem("root", { isBase: true });
    const other = makeSystem("other", { isBase: true });
    const survivor = makeSystem("survivor", { parentIds: [asId("root"), asId("other")] });
    systemService.getById.mockImplementation(async (id: string) => {
      if (id === "root") return root;
      if (id === "other") return other;
      if (id === "survivor") return survivor;
      return null;
    });
    systemService.getChildren.mockImplementation(async (id: string) => {
      if (id === "root") return [survivor];
      return [];
    });

    await useCase.execute("root", "user-1");

    expect(systemService.softDelete).toHaveBeenCalledTimes(1);
    expect(systemService.softDelete).toHaveBeenCalledWith("root", expect.any(Date));
  });

  it("blocks the cascade with 409 when a foreign system would be deleted", async () => {
    const root = makeSystem("root", { isBase: true });
    const foreign = makeSystem("foreign", { publisher: "other", parentIds: [asId("root")] });
    systemService.getById.mockImplementation(async (id: string) => {
      if (id === "root") return root;
      if (id === "foreign") return foreign;
      return null;
    });
    systemService.getChildren.mockImplementation(async (id: string) => {
      if (id === "root") return [foreign];
      return [];
    });

    await expect(useCase.execute("root", "user-1")).rejects.toMatchObject({ statusCode: 409 });
    expect(systemService.softDelete).not.toHaveBeenCalled();
  });
});

describe("CascadeRestoreSystem", () => {
  const systemService = {
    getById: vi.fn(),
    getByIdWithDeleted: vi.fn(),
    getChildrenDeletedAt: vi.fn(),
    restore: vi.fn().mockResolvedValue(undefined),
  };
  const attributes = emptyEntityRepo();
  const skills = emptyEntityRepo();
  const languages = emptyEntityRepo();
  const buildSystemSummary = {
    execute: vi.fn().mockResolvedValue({ id: "root" }),
  };
  let useCase: CascadeRestoreSystem;

  beforeEach(() => {
    vi.clearAllMocks();
    systemService.restore.mockResolvedValue(undefined);
    systemService.getChildrenDeletedAt.mockResolvedValue([]);
    useCase = new CascadeRestoreSystem(
      systemService as unknown as SystemService,
      attributes as never,
      skills as never,
      languages as never,
      buildSystemSummary as never
    );
  });

  it("restores descendants that share the same deletedAt", async () => {
    const deletedAt = new Date("2026-01-01T00:00:00.000Z");
    const root = makeSystem("root", { isBase: true, deletedAt });
    const child = makeSystem("child", { parentIds: [asId("root")], deletedAt });
    systemService.getByIdWithDeleted.mockResolvedValue(root);
    systemService.getById.mockResolvedValue(makeSystem("root", { isBase: true }));
    systemService.getChildrenDeletedAt.mockImplementation(async (id: string) => {
      if (id === "root") return [child];
      return [];
    });

    const result = await useCase.execute("root", "user-1");

    expect(systemService.restore).toHaveBeenCalledWith("root");
    expect(systemService.restore).toHaveBeenCalledWith("child");
    expect(buildSystemSummary.execute).toHaveBeenCalledWith(
      expect.objectContaining({ name: "root" }),
      "user-1"
    );
    expect(result).toEqual({ id: "root" });
  });

  it("rejects restoring a non-base system without a living parent", async () => {
    const deletedAt = new Date("2026-01-01T00:00:00.000Z");
    systemService.getByIdWithDeleted.mockResolvedValue(
      makeSystem("child", { isBase: false, parentIds: [asId("root")], deletedAt })
    );
    systemService.getById.mockResolvedValue(null);

    await expect(useCase.execute("child", "user-1")).rejects.toBeInstanceOf(AppError);
    expect(systemService.restore).not.toHaveBeenCalled();
  });
});
