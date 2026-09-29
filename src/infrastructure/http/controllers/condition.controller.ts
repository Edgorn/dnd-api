import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import { ValidationError } from "../../../domain/errors/AppError";
import GetConditionsBySystem from "../../../application/use-cases/condition/getConditionsBySystem.use-case";
import CreateCondition from "../../../application/use-cases/condition/createCondition.use-case";
import UpdateCondition from "../../../application/use-cases/condition/updateCondition.use-case";
import SoftDeleteCondition from "../../../application/use-cases/condition/softDeleteCondition.use-case";
import RestoreCondition from "../../../application/use-cases/condition/restoreCondition.use-case";

export class ConditionController {
  constructor(
    private readonly getConditionsBySystemUseCase: GetConditionsBySystem,
    private readonly createConditionUseCase: CreateCondition,
    private readonly updateConditionUseCase: UpdateCondition,
    private readonly softDeleteConditionUseCase: SoftDeleteCondition,
    private readonly restoreConditionUseCase: RestoreCondition
  ) {}

  getBySystems = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { ruleset } = req.query;
      let rulesetArray: string[] = [];
      if (typeof ruleset === "string") {
        rulesetArray = [ruleset];
      } else if (Array.isArray(ruleset)) {
        rulesetArray = ruleset.map(item => String(item));
      }

      const conditions = await this.getConditionsBySystemUseCase.execute(rulesetArray, req.user);
      return res.status(200).json(conditions);
    } catch (error) {
      console.error("[ConditionController] Error in getBySystems:", error);
      next(error);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const condition = await this.createConditionUseCase.execute(req.body, req.user!);
      return res.status(201).json(condition);
    } catch (error) {
      console.error("[ConditionController] Error in create:", error);
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      if (!id) {
        throw new ValidationError("ID de estado requerido");
      }

      const condition = await this.updateConditionUseCase.execute({
        ...req.body,
        id
      }, req.user!);
      return res.status(200).json(condition);
    } catch (error) {
      console.error("[ConditionController] Error in update:", error);
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      if (!id) {
        throw new ValidationError("ID de estado requerido");
      }

      await this.softDeleteConditionUseCase.execute(id, req.user!);
      return res.status(204).send();
    } catch (error) {
      console.error("[ConditionController] Error in delete:", error);
      next(error);
    }
  };

  restore = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      if (!id) {
        throw new ValidationError("ID de estado requerido");
      }

      await this.restoreConditionUseCase.execute(id, req.user!);
      return res.status(200).json({ message: "Estado restaurado con éxito" });
    } catch (error) {
      console.error("[ConditionController] Error in restore:", error);
      next(error);
    }
  };
}
