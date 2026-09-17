import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import { ValidationError } from "../../../domain/errors/AppError";
import GetFeatsBySystems from "../../../application/use-cases/feat/getFeatsBySystems.use-case";
import CreateFeat from "../../../application/use-cases/feat/createFeat.use-case";
import UpdateFeat from "../../../application/use-cases/feat/updateFeat.use-case";
import SoftDeleteFeat from "../../../application/use-cases/feat/softDeleteFeat.use-case";
import RestoreFeat from "../../../application/use-cases/feat/restoreFeat.use-case";

export class FeatController {
  constructor(
    private readonly getFeatsBySystemsUseCase: GetFeatsBySystems,
    private readonly createFeatUseCase: CreateFeat,
    private readonly updateFeatUseCase: UpdateFeat,
    private readonly softDeleteFeatUseCase: SoftDeleteFeat,
    private readonly restoreFeatUseCase: RestoreFeat
  ) { }

  getBySystems = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { ruleset } = req.query;
      let rulesetArray: string[] = [];
      if (typeof ruleset === "string") {
        rulesetArray = [ruleset];
      } else if (Array.isArray(ruleset)) {
        rulesetArray = ruleset.map(r => String(r));
      }

      const feats = await this.getFeatsBySystemsUseCase.execute(rulesetArray, req.user);
      return res.status(200).json(feats);
    } catch (error) {
      console.error("[FeatController] Error in getBySystems:", error);
      next(error);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const feat = await this.createFeatUseCase.execute(req.body, userId);
      return res.status(201).json(feat);
    } catch (error) {
      console.error("[FeatController] Error in create:", error);
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("Feat ID is required");
      }

      const feat = await this.updateFeatUseCase.execute({ ...req.body, id }, userId);
      return res.status(200).json(feat);
    } catch (error) {
      console.error("[FeatController] Error in update:", error);
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("Feat ID is required");
      }

      await this.softDeleteFeatUseCase.execute(id, userId);
      return res.status(204).send();
    } catch (error) {
      console.error("[FeatController] Error in delete:", error);
      next(error);
    }
  };

  restore = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("Feat ID is required");
      }

      await this.restoreFeatUseCase.execute(id, userId);
      return res.status(200).json({ message: "Dote restaurado con éxito" });
    } catch (error) {
      console.error("[FeatController] Error in restore:", error);
      next(error);
    }
  };
}
