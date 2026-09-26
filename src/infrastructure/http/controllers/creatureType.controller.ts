import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import { ValidationError } from "../../../domain/errors/AppError";
import GetCreatureTypesBySystem from "../../../application/use-cases/creatureType/getCreatureTypesBySystem.use-case";
import CreateCreatureType from "../../../application/use-cases/creatureType/createCreatureType.use-case";
import UpdateCreatureType from "../../../application/use-cases/creatureType/updateCreatureType.use-case";
import SoftDeleteCreatureType from "../../../application/use-cases/creatureType/softDeleteCreatureType.use-case";
import RestoreCreatureType from "../../../application/use-cases/creatureType/restoreCreatureType.use-case";

export class CreatureTypeController {
  constructor(
    private readonly getCreatureTypesBySystemUseCase: GetCreatureTypesBySystem,
    private readonly createCreatureTypeUseCase: CreateCreatureType,
    private readonly updateCreatureTypeUseCase: UpdateCreatureType,
    private readonly softDeleteCreatureTypeUseCase: SoftDeleteCreatureType,
    private readonly restoreCreatureTypeUseCase: RestoreCreatureType
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

      const creatureTypes = await this.getCreatureTypesBySystemUseCase.execute(rulesetArray, req.user);
      return res.status(200).json(creatureTypes);
    } catch (error) {
      console.error("[CreatureTypeController] Error in getBySystems:", error);
      next(error);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const creatureType = await this.createCreatureTypeUseCase.execute(req.body, req.user!);
      return res.status(201).json(creatureType);
    } catch (error) {
      console.error("[CreatureTypeController] Error in create:", error);
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      if (!id) {
        throw new ValidationError("ID de tipo de criatura requerido");
      }

      const creatureType = await this.updateCreatureTypeUseCase.execute({
        ...req.body,
        id
      }, req.user!);
      return res.status(200).json(creatureType);
    } catch (error) {
      console.error("[CreatureTypeController] Error in update:", error);
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      if (!id) {
        throw new ValidationError("ID de tipo de criatura requerido");
      }

      await this.softDeleteCreatureTypeUseCase.execute(id, req.user!);
      return res.status(204).send();
    } catch (error) {
      console.error("[CreatureTypeController] Error in delete:", error);
      next(error);
    }
  };

  restore = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      if (!id) {
        throw new ValidationError("ID de tipo de criatura requerido");
      }

      await this.restoreCreatureTypeUseCase.execute(id, req.user!);
      return res.status(200).json({ message: "Tipo de criatura restaurado con éxito" });
    } catch (error) {
      console.error("[CreatureTypeController] Error in restore:", error);
      next(error);
    }
  };
}
