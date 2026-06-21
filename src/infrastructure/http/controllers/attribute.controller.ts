import { Response } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import CreateAttribute from "../../../application/use-cases/attribute/createAttribute.use-case";
import UpdateAttribute from "../../../application/use-cases/attribute/updateAttribute.use-case";
import AddAttributeToSystem from "../../../application/use-cases/attribute/addAttributeToSystem.use-case";
import RemoveAttributeFromSystem from "../../../application/use-cases/attribute/removeAttributeFromSystem.use-case";

export class AttributeController {
  constructor(
    private readonly createAttributeUseCase: CreateAttribute,
    private readonly updateAttributeUseCase: UpdateAttribute,
    private readonly addAttributeToSystemUseCase: AddAttributeToSystem,
    private readonly removeAttributeFromSystemUseCase: RemoveAttributeFromSystem
  ) {}

  create = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = await this.createAttributeUseCase.execute(req.body);
      return res.status(201).json(data);
    } catch (e: unknown) {
      console.error(e);
      const message = e instanceof Error ? e.message : "Error creating attribute";
      return res.status(500).json({ error: message });
    }
  };

  update = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: "Attribute ID is required" });
      }

      const data = await this.updateAttributeUseCase.execute({
        id,
        ...req.body
      });

      return res.status(200).json(data);
    } catch (e: unknown) {
      console.error(e);
      const message = e instanceof Error ? e.message : "Error updating attribute";
      return res.status(500).json({ error: message });
    }
  };

  addSystem = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { systemId } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Attribute ID is required" });
      }

      const data = await this.addAttributeToSystemUseCase.execute(id, systemId);
      return res.status(200).json(data);
    } catch (e: unknown) {
      console.error(e);
      const message = e instanceof Error ? e.message : "Error associating attribute to system";
      return res.status(500).json({ error: message });
    }
  };

  removeSystem = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id, systemId } = req.params;

      if (!id || !systemId) {
        return res.status(400).json({ error: "Attribute ID and system ID are required" });
      }

      const data = await this.removeAttributeFromSystemUseCase.execute(id, systemId);
      return res.status(200).json(data);
    } catch (e: unknown) {
      console.error(e);
      const message = e instanceof Error ? e.message : "Error unassociating attribute from system";
      return res.status(500).json({ error: message });
    }
  };
}
