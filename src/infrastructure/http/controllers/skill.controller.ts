import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import GetSkillsBySystems from "../../../application/use-cases/skill/getSkillsBySystems.use-case";
import CreateSkill from "../../../application/use-cases/skill/createSkill.use-case";
import UpdateSkill from "../../../application/use-cases/skill/updateSkill.use-case";
import AddSystemToSkill from "../../../application/use-cases/skill/addSystemToSkill.use-case";
import RemoveSystemFromSkill from "../../../application/use-cases/skill/removeSystemFromSkill.use-case";
import { ValidationError } from "../../../domain/errors/AppError";

export class SkillController {
  constructor(
    private readonly getSkillsBySystemsUseCase: GetSkillsBySystems,
    private readonly createSkillUseCase: CreateSkill,
    private readonly updateSkillUseCase: UpdateSkill,
    private readonly addSystemToSkillUseCase: AddSystemToSkill,
    private readonly removeSystemFromSkillUseCase: RemoveSystemFromSkill
  ) {}

  obtenerTodas = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.getSkillsBySystemsUseCase.execute();
      return res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.createSkillUseCase.execute(req.body);
      return res.status(201).json(data);
    } catch (e) {
      next(e);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("Skill ID is required");
      }

      const data = await this.updateSkillUseCase.execute({
        id,
        ...req.body
      });

      return res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  addSystem = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { systemId } = req.body;

      if (!id) {
        throw new ValidationError("Skill ID is required");
      }

      const data = await this.addSystemToSkillUseCase.execute(id, systemId);
      return res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  removeSystem = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id, systemId } = req.params;

      if (!id || !systemId) {
        throw new ValidationError("Skill ID and system ID are required");
      }

      const data = await this.removeSystemFromSkillUseCase.execute(id, systemId);
      return res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };
}
