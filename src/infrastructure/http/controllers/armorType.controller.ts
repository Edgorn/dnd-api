import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import { ValidationError } from "../../../domain/errors/AppError";
import CreateArmorType from "../../../application/use-cases/armorType/createArmorType.use-case";
import UpdateArmorType from "../../../application/use-cases/armorType/updateArmorType.use-case";
import SoftDeleteArmorType from "../../../application/use-cases/armorType/softDeleteArmorType.use-case";
import RestoreArmorType from "../../../application/use-cases/armorType/restoreArmorType.use-case";
import GetArmorTypesBySystems from "../../../application/use-cases/armorType/getArmorTypesBySystems.use-case";
import GetArmorTypeById from "../../../application/use-cases/armorType/getArmorTypeById.use-case";

export class ArmorTypeController {
  constructor(
    private readonly createArmorTypeUseCase: CreateArmorType,
    private readonly updateArmorTypeUseCase: UpdateArmorType,
    private readonly softDeleteArmorTypeUseCase: SoftDeleteArmorType,
    private readonly restoreArmorTypeUseCase: RestoreArmorType,
    private readonly getArmorTypesBySystemsUseCase: GetArmorTypesBySystems,
    private readonly getArmorTypeByIdUseCase: GetArmorTypeById
  ) {}

  getBySystems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ruleset } = req.query;
      let rulesets: string[] | undefined;

      if (typeof ruleset === "string") {
        rulesets = [ruleset];
      } else if (Array.isArray(ruleset)) {
        rulesets = ruleset as string[];
      }

      const data = await this.getArmorTypesBySystemsUseCase.execute(rulesets);
      return res.status(200).json(data);
    } catch (e) {
      console.error("[ArmorTypeController.getBySystems] Error:", e);
      next(e);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new ValidationError("ID de tipo de armadura requerido");
      }
      const data = await this.getArmorTypeByIdUseCase.execute(id);
      return res.status(200).json(data);
    } catch (e) {
      console.error("[ArmorTypeController.getById] Error:", e);
      next(e);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const data = await this.createArmorTypeUseCase.execute(req.body, userId);
      return res.status(201).json(data);
    } catch (e) {
      console.error("[ArmorTypeController.create] Error:", e);
      next(e);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const id = req.params.id as string;

      if (!id) {
        throw new ValidationError("ID de tipo de armadura requerido");
      }

      const data = await this.updateArmorTypeUseCase.execute({
        id,
        ...req.body
      }, userId);

      return res.status(200).json(data);
    } catch (e) {
      console.error("[ArmorTypeController.update] Error:", e);
      next(e);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const id = req.params.id as string;

      if (!id) {
        throw new ValidationError("ID de tipo de armadura requerido");
      }

      await this.softDeleteArmorTypeUseCase.execute(id, userId);
      return res.status(204).send();
    } catch (e) {
      console.error("[ArmorTypeController.delete] Error:", e);
      next(e);
    }
  };

  restore = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const id = req.params.id as string;

      if (!id) {
        throw new ValidationError("ID de tipo de armadura requerido");
      }

      await this.restoreArmorTypeUseCase.execute(id, userId);
      return res.status(200).json({ message: "Tipo de armadura restaurado con éxito" });
    } catch (e) {
      console.error("[ArmorTypeController.restore] Error:", e);
      next(e);
    }
  };
}
