import { Response, NextFunction } from "express"
import GetTraitsBySystemsUseCase from "../../../application/use-cases/trait/getTraitsBySystems.use-case"
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import CreateTraitUseCase from "../../../application/use-cases/trait/createTrait.use-case";
import UpdateTraitUseCase from "../../../application/use-cases/trait/updateTrait.use-case";
import SoftDeleteTraitUseCase from "../../../application/use-cases/trait/softDeleteTrait.use-case";
import RestoreTraitUseCase from "../../../application/use-cases/trait/restoreTrait.use-case";
import { ValidationError, AppError } from "../../../domain/errors/AppError";

export class TraitController {
  constructor(
    private readonly getTraitsBySystemsUseCase: GetTraitsBySystemsUseCase,
    private readonly createTraitUseCase: CreateTraitUseCase,
    private readonly updateTraitUseCase: UpdateTraitUseCase,
    private readonly softDeleteTraitUseCase: SoftDeleteTraitUseCase,
    private readonly restoreTraitUseCase: RestoreTraitUseCase
  ) { }

  getBySystems = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { ruleset } = req.query;
      let rulesetArray: string[] = [];
      if (typeof ruleset === 'string') {
        rulesetArray = [ruleset];
      } else if (Array.isArray(ruleset)) {
        rulesetArray = ruleset.map(r => String(r));
      }

      const traits = await this.getTraitsBySystemsUseCase.execute(rulesetArray)
      return res.status(200).json(traits)
    } catch (error) {
      console.error("[TraitController.getBySystems] Error:", error);
      next(error);
    }
  }

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const trait = await this.createTraitUseCase.execute(req.body, userId);
      return res.status(201).json(trait);
    } catch (error) {
      console.error("[TraitController.create] Error:", error);
      next(error);
    }
  }

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;
      if (!id) {
        throw new ValidationError("Trait ID is required");
      }
      const trait = await this.updateTraitUseCase.execute({ id, ...req.body }, userId);
      return res.status(200).json(trait);
    } catch (error) {
      console.error("[TraitController.update] Error:", error);
      next(error);
    }
  }

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;
      
      if (!id) {
        throw new ValidationError("Trait ID is required");
      }

      await this.softDeleteTraitUseCase.execute(id, userId);
      return res.status(204).send();
    } catch (error) {
      console.error("[TraitController.delete] Error:", error);
      next(error);
    }
  }

  restore = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;
      
      if (!id) {
        throw new ValidationError("Trait ID is required");
      }

      await this.restoreTraitUseCase.execute(id, userId);
      return res.status(200).json({ message: 'Rasgo restaurado con éxito' });
    } catch (error) {
      console.error("[TraitController.restore] Error:", error);
      next(error);
    }
  }
}
