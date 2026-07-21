import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import { ValidationError } from "../../../domain/errors/AppError";
import GetSkillsBySystems from "../../../application/use-cases/skill/getSkillsBySystems.use-case";
import CreateSkill from "../../../application/use-cases/skill/createSkill.use-case";
import UpdateSkill from "../../../application/use-cases/skill/updateSkill.use-case";
import SoftDeleteSkill from "../../../application/use-cases/skill/softDeleteSkill.use-case";
import RestoreSkill from "../../../application/use-cases/skill/restoreSkill.use-case";

export class SkillController {
  constructor(
    private readonly getSkillsBySystemsUseCase: GetSkillsBySystems,
    private readonly createSkillUseCase: CreateSkill,
    private readonly updateSkillUseCase: UpdateSkill,
    private readonly softDeleteSkillUseCase: SoftDeleteSkill,
    private readonly restoreSkillUseCase: RestoreSkill
  ) {}

  obtenerTodas = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const rulesetQuery = req.query.ruleset;
      let rulesets: string[] | undefined = undefined;
      if (typeof rulesetQuery === 'string') {
        rulesets = [rulesetQuery];
      } else if (Array.isArray(rulesetQuery)) {
        rulesets = rulesetQuery.map(r => String(r));
      }
      const data = await this.getSkillsBySystemsUseCase.execute(rulesets);
      return res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const data = await this.createSkillUseCase.execute(req.body, userId);
      return res.status(201).json(data);
    } catch (e) {
      next(e);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("Skill ID is required");
      }

      const data = await this.updateSkillUseCase.execute({
        id,
        ...req.body
      }, userId);

      return res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;
      
      if (!id) {
        throw new ValidationError("Skill ID is required");
      }

      await this.softDeleteSkillUseCase.execute(id, userId);
      return res.status(204).send();
    } catch (e) {
      next(e);
    }
  };

  restore = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;
      
      if (!id) {
        throw new ValidationError("Skill ID is required");
      }

      await this.restoreSkillUseCase.execute(id, userId);
      return res.status(200).json({ message: 'Habilidad restaurada con éxito' });
    } catch (e) {
      next(e);
    }
  };
}
