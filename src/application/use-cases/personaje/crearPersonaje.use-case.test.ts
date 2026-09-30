import { describe, it, expect, vi, beforeEach } from "vitest";
import CrearPersonaje from "./crearPersonaje.use-case";
import SystemService from "../../../domain/services/system.service";
import PersonajeService from "../../../domain/services/personaje.service";
import IEquipmentRepository from "../../../domain/repositories/IEquipmentRepository";

describe("CrearPersonaje systems", () => {
  const personajeService = {
    crear: vi.fn().mockResolvedValue({ id: "char-1" }),
  };
  const systemService = {
    assertSingleBase: vi.fn().mockResolvedValue(undefined),
  };
  const equipmentRepository = {
    getById: vi.fn(),
  };
  let useCase: CrearPersonaje;

  beforeEach(() => {
    vi.clearAllMocks();
    personajeService.crear.mockResolvedValue({ id: "char-1" });
    systemService.assertSingleBase.mockResolvedValue(undefined);
    useCase = new CrearPersonaje(
      personajeService as unknown as PersonajeService,
      systemService as unknown as SystemService,
      equipmentRepository as unknown as IEquipmentRepository
    );
  });

  it("validates that character systems resolve to a single base", async () => {
    await useCase.execute({
      name: "Astarion",
      user: "user-1",
      systems: ["phb", "mm"],
      equipment: [],
    } as never);

    expect(systemService.assertSingleBase).toHaveBeenCalledWith(["phb", "mm"]);
    expect(personajeService.crear).toHaveBeenCalled();
  });
});
