import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import { ValidationError } from "../../../domain/errors/AppError";
import GetCreaturesBySystems from "../../../application/use-cases/creature/getCreaturesBySystems.use-case";
import GetCreatureById from "../../../application/use-cases/creature/getCreatureById.use-case";
import CreateCreatureUseCase from "../../../application/use-cases/creature/createCreature.use-case";
import UpdateCreatureUseCase from "../../../application/use-cases/creature/updateCreature.use-case";
import SoftDeleteCreature from "../../../application/use-cases/creature/softDeleteCreature.use-case";
import RestoreCreature from "../../../application/use-cases/creature/restoreCreature.use-case";

export class CreatureController {
  constructor(
    private readonly getCreaturesBySystemsUseCase: GetCreaturesBySystems,
    private readonly getCreatureByIdUseCase: GetCreatureById,
    private readonly createCreatureUseCase: CreateCreatureUseCase,
    private readonly updateCreatureUseCase: UpdateCreatureUseCase,
    private readonly softDeleteCreatureUseCase: SoftDeleteCreature,
    private readonly restoreCreatureUseCase: RestoreCreature
  ) {}

  getBySystems = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { ruleset, creatureTypeId } = req.query;
      let rulesetArray: string[] = [];
      if (typeof ruleset === "string") {
        rulesetArray = [ruleset];
      } else if (Array.isArray(ruleset)) {
        rulesetArray = ruleset.map(item => String(item));
      }

      const creatures = await this.getCreaturesBySystemsUseCase.execute(
        rulesetArray,
        { creatureTypeId: typeof creatureTypeId === "string" ? creatureTypeId : undefined },
        req.user
      );
      return res.status(200).json(creatures);
    } catch (error) {
      console.error("[CreatureController] Error in getBySystems:", error);
      next(error);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      if (!id) {
        throw new ValidationError("ID de criatura requerido");
      }

      const creature = await this.getCreatureByIdUseCase.execute(id);
      return res.status(200).json(creature);
    } catch (error) {
      console.error("[CreatureController] Error in getById:", error);
      next(error);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const creature = await this.createCreatureUseCase.execute(req.body, req.user!);
      return res.status(201).json(creature);
    } catch (error) {
      console.error("[CreatureController] Error in create:", error);
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      if (!id) {
        throw new ValidationError("ID de criatura requerido");
      }

      const creature = await this.updateCreatureUseCase.execute({
        ...req.body,
        id
      }, req.user!);
      return res.status(200).json(creature);
    } catch (error) {
      console.error("[CreatureController] Error in update:", error);
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      if (!id) {
        throw new ValidationError("ID de criatura requerido");
      }

      await this.softDeleteCreatureUseCase.execute(id, req.user!);
      return res.status(204).send();
    } catch (error) {
      console.error("[CreatureController] Error in delete:", error);
      next(error);
    }
  };

  restore = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      if (!id) {
        throw new ValidationError("ID de criatura requerido");
      }

      await this.restoreCreatureUseCase.execute(id, req.user!);
      return res.status(200).json({ message: "Criatura restaurada con éxito" });
    } catch (error) {
      console.error("[CreatureController] Error in restore:", error);
      next(error);
    }
  };
}
