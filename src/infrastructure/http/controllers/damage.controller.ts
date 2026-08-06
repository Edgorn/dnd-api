import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import { ValidationError } from "../../../domain/errors/AppError";
import CreateDamage from "../../../application/use-cases/damage/createDamage.use-case";
import UpdateDamage from "../../../application/use-cases/damage/updateDamage.use-case";
import SoftDeleteDamage from "../../../application/use-cases/damage/softDeleteDamage.use-case";
import RestoreDamage from "../../../application/use-cases/damage/restoreDamage.use-case";
import GetDamagesBySystems from "../../../application/use-cases/damage/getDamagesBySystems.use-case";

export class DamageController {
  constructor(
    private readonly createDamageUseCase: CreateDamage,
    private readonly updateDamageUseCase: UpdateDamage,
    private readonly softDeleteDamageUseCase: SoftDeleteDamage,
    private readonly restoreDamageUseCase: RestoreDamage,
    private readonly getDamagesBySystemsUseCase: GetDamagesBySystems
  ) {}

  getDamagesBySystems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ruleset } = req.query;
      let rulesets: string[] | undefined;

      if (typeof ruleset === "string") {
        rulesets = [ruleset];
      } else if (Array.isArray(ruleset)) {
        rulesets = ruleset as string[];
      }

      const data = await this.getDamagesBySystemsUseCase.execute(rulesets);
      return res.status(200).json(data);
    } catch (e) {
      console.error("[DamageController.getDamagesBySystems] Error:", e);
      next(e);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const data = await this.createDamageUseCase.execute(req.body, userId);
      return res.status(201).json(data);
    } catch (e) {
      console.error("[DamageController.create] Error:", e);
      next(e);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("Damage ID is required");
      }

      const data = await this.updateDamageUseCase.execute({
        id,
        ...req.body
      }, userId);

      return res.status(200).json(data);
    } catch (e) {
      console.error("[DamageController.update] Error:", e);
      next(e);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("Damage ID is required");
      }

      await this.softDeleteDamageUseCase.execute(id, userId);
      return res.status(204).send();
    } catch (e) {
      console.error("[DamageController.delete] Error:", e);
      next(e);
    }
  };

  restore = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("Damage ID is required");
      }

      await this.restoreDamageUseCase.execute(id, userId);
      return res.status(200).json({ message: 'Tipo de daño restaurado con éxito' });
    } catch (e) {
      console.error("[DamageController.restore] Error:", e);
      next(e);
    }
  };
}
