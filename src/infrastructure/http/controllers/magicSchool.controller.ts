import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import { ValidationError } from "../../../domain/errors/AppError";
import CreateMagicSchool from "../../../application/use-cases/magicSchool/createMagicSchool.use-case";
import UpdateMagicSchool from "../../../application/use-cases/magicSchool/updateMagicSchool.use-case";
import SoftDeleteMagicSchool from "../../../application/use-cases/magicSchool/softDeleteMagicSchool.use-case";
import RestoreMagicSchool from "../../../application/use-cases/magicSchool/restoreMagicSchool.use-case";
import GetMagicSchoolsBySystems from "../../../application/use-cases/magicSchool/getMagicSchoolsBySystems.use-case";

export class MagicSchoolController {
  constructor(
    private readonly createMagicSchoolUseCase: CreateMagicSchool,
    private readonly updateMagicSchoolUseCase: UpdateMagicSchool,
    private readonly softDeleteMagicSchoolUseCase: SoftDeleteMagicSchool,
    private readonly restoreMagicSchoolUseCase: RestoreMagicSchool,
    private readonly getMagicSchoolsBySystemsUseCase: GetMagicSchoolsBySystems
  ) {}

  getMagicSchoolsBySystems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ruleset } = req.query;
      let rulesets: string[] | undefined;

      if (typeof ruleset === "string") {
        rulesets = [ruleset];
      } else if (Array.isArray(ruleset)) {
        rulesets = ruleset as string[];
      }

      const data = await this.getMagicSchoolsBySystemsUseCase.execute(rulesets);
      return res.status(200).json(data);
    } catch (e) {
      console.error("[MagicSchoolController.getMagicSchoolsBySystems] Error:", e);
      next(e);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const data = await this.createMagicSchoolUseCase.execute(req.body, userId);
      return res.status(201).json(data);
    } catch (e) {
      console.error("[MagicSchoolController.create] Error:", e);
      next(e);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("MagicSchool ID is required");
      }

      const data = await this.updateMagicSchoolUseCase.execute({
        id,
        ...req.body
      }, userId);

      return res.status(200).json(data);
    } catch (e) {
      console.error("[MagicSchoolController.update] Error:", e);
      next(e);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("MagicSchool ID is required");
      }

      await this.softDeleteMagicSchoolUseCase.execute(id, userId);
      return res.status(204).send();
    } catch (e) {
      console.error("[MagicSchoolController.delete] Error:", e);
      next(e);
    }
  };

  restore = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("MagicSchool ID is required");
      }

      await this.restoreMagicSchoolUseCase.execute(id, userId);
      return res.status(200).json({ message: 'Escuela de magia restaurada con éxito' });
    } catch (e) {
      console.error("[MagicSchoolController.restore] Error:", e);
      next(e);
    }
  };
}
