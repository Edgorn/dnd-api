import { Response } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import CrearCaracteristica from "../../../application/use-cases/caracteristica/crearCaracteristica.use-case";
import ModificarCaracteristica from "../../../application/use-cases/caracteristica/modificarCaracteristica.use-case";
import AñadirCaracteristicaASistema from "../../../application/use-cases/caracteristica/añadirCaracteristicaASistema.use-case";
import EliminarCaracteristicaDeSistema from "../../../application/use-cases/caracteristica/eliminarCaracteristicaDeSistema.use-case";

export class CaracteristicaController {
  constructor(
    private readonly crearCaracteristicaUseCase: CrearCaracteristica,
    private readonly modificarCaracteristicaUseCase: ModificarCaracteristica,
    private readonly añadirCaracteristicaASistemaUseCase: AñadirCaracteristicaASistema,
    private readonly eliminarCaracteristicaDeSistemaUseCase: EliminarCaracteristicaDeSistema
  ) {}

  create = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { ruleset, name, description, key, abbreviation } = req.body;

      if (!ruleset || !name || !description || !key || !abbreviation) {
        return res.status(400).json({ error: "Faltan campos requeridos para crear la característica" });
      }

      const data = await this.crearCaracteristicaUseCase.execute({
        ruleset,
        name,
        description,
        key,
        abbreviation
      });

      return res.status(201).json(data);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message || "Error al crear la característica" });
    }
  };

  update = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description, key, abbreviation } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Se requiere el ID de la característica" });
      }

      const data = await this.modificarCaracteristicaUseCase.execute({
        id,
        name,
        description,
        key,
        abbreviation
      });

      return res.status(200).json(data);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message || "Error al modificar la característica" });
    }
  };

  addSystem = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const systemId = req.body?.systemId;

      if (!id || !systemId) {
        return res.status(400).json({ error: "Se requiere el ID de la característica y el ID del sistema" });
      }

      const data = await this.añadirCaracteristicaASistemaUseCase.execute(id, systemId);
      return res.status(200).json(data);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message || "Error al asociar la característica al sistema" });
    }
  };

  removeSystem = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id, systemId } = req.params;

      if (!id || !systemId) {
        return res.status(400).json({ error: "Se requiere el ID de la característica y el ID del sistema" });
      }

      const data = await this.eliminarCaracteristicaDeSistemaUseCase.execute(id, systemId);
      return res.status(200).json(data);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message || "Error al desasociar la característica del sistema" });
    }
  };
}
