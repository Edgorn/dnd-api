import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import { ValidationError } from "../../../domain/errors/AppError";
import GetSubclassesBySystems from "../../../application/use-cases/subclass/getSubclassesBySystems.use-case";
import GetSubclassById from "../../../application/use-cases/subclass/getSubclassById.use-case";
import CreateSubclass from "../../../application/use-cases/subclass/createSubclass.use-case";
import UpdateSubclass from "../../../application/use-cases/subclass/updateSubclass.use-case";
import SoftDeleteSubclass from "../../../application/use-cases/subclass/softDeleteSubclass.use-case";
import RestoreSubclass from "../../../application/use-cases/subclass/restoreSubclass.use-case";

export class SubclassController {
  constructor(
    private readonly getSubclassesBySystemsUseCase: GetSubclassesBySystems,
    private readonly getSubclassByIdUseCase: GetSubclassById,
    private readonly createSubclassUseCase: CreateSubclass,
    private readonly updateSubclassUseCase: UpdateSubclass,
    private readonly softDeleteSubclassUseCase: SoftDeleteSubclass,
    private readonly restoreSubclassUseCase: RestoreSubclass
  ) { }

  getBySystems = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { ruleset, classId } = req.query;
      let rulesets: string[] = [];
      if (typeof ruleset === "string") {
        rulesets = [ruleset];
      } else if (Array.isArray(ruleset)) {
        rulesets = ruleset.map(item => String(item));
      }

      const classFilter = typeof classId === "string" ? classId : undefined;
      const data = await this.getSubclassesBySystemsUseCase.execute(rulesets, classFilter);
      return res.status(200).json(data);
    } catch (error) {
      console.error("[SubclassController.getBySystems] Error:", error);
      next(error);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError("El ID de la subclase es obligatorio");
      }
      const data = await this.getSubclassByIdUseCase.execute(id);
      return res.status(200).json(data);
    } catch (error) {
      console.error("[SubclassController.getById] Error:", error);
      next(error);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const data = await this.createSubclassUseCase.execute(req.body, userId);
      return res.status(201).json(data);
    } catch (error) {
      console.error("[SubclassController.create] Error:", error);
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;
      if (!id) {
        throw new ValidationError("El ID de la subclase es obligatorio");
      }
      const data = await this.updateSubclassUseCase.execute({ id, ...req.body }, userId);
      return res.status(200).json(data);
    } catch (error) {
      console.error("[SubclassController.update] Error:", error);
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;
      if (!id) {
        throw new ValidationError("El ID de la subclase es obligatorio");
      }
      await this.softDeleteSubclassUseCase.execute(id, userId);
      return res.status(204).send();
    } catch (error) {
      console.error("[SubclassController.delete] Error:", error);
      next(error);
    }
  };

  restore = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;
      if (!id) {
        throw new ValidationError("El ID de la subclase es obligatorio");
      }
      await this.restoreSubclassUseCase.execute(id, userId);
      return res.status(200).json({ message: "Subclase restaurada con éxito" });
    } catch (error) {
      console.error("[SubclassController.restore] Error:", error);
      next(error);
    }
  };
}
