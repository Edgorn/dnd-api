import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import { ValidationError } from "../../../domain/errors/AppError";
import GetBackgroundsBySystems from "../../../application/use-cases/background/getBackgroundsBySystems.use-case";
import GetBackgroundById from "../../../application/use-cases/background/getBackgroundById.use-case";
import CreateBackground from "../../../application/use-cases/background/createBackground.use-case";
import UpdateBackground from "../../../application/use-cases/background/updateBackground.use-case";
import SoftDeleteBackground from "../../../application/use-cases/background/softDeleteBackground.use-case";
import RestoreBackground from "../../../application/use-cases/background/restoreBackground.use-case";

export class BackgroundController {
  constructor(
    private readonly getBackgroundsBySystemsUseCase: GetBackgroundsBySystems,
    private readonly getBackgroundByIdUseCase: GetBackgroundById,
    private readonly createBackgroundUseCase: CreateBackground,
    private readonly updateBackgroundUseCase: UpdateBackground,
    private readonly softDeleteBackgroundUseCase: SoftDeleteBackground,
    private readonly restoreBackgroundUseCase: RestoreBackground
  ) { }

  getBackgrounds = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const rulesetQuery = req.query.ruleset;
      let rulesets: string[] = [];
      if (typeof rulesetQuery === "string") {
        rulesets = [rulesetQuery];
      } else if (Array.isArray(rulesetQuery)) {
        rulesets = rulesetQuery.map(r => String(r));
      }
      const data = await this.getBackgroundsBySystemsUseCase.execute(rulesets);
      return res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError("El ID del trasfondo es obligatorio");
      }
      const data = await this.getBackgroundByIdUseCase.execute(id);
      return res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { description, ...rest } = req.body;
      const normalizedDescription = typeof description === "string" ? [description] : (description || []);
      const data = await this.createBackgroundUseCase.execute({
        ...rest,
        description: normalizedDescription
      });
      return res.status(201).json(data);
    } catch (e) {
      next(e);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError("El ID del trasfondo es obligatorio");
      }

      const { description, ...rest } = req.body;
      const normalizedDescription = description !== undefined
        ? (typeof description === "string" ? [description] : description)
        : undefined;

      const data = await this.updateBackgroundUseCase.execute({
        id,
        ...rest,
        ...(normalizedDescription !== undefined ? { description: normalizedDescription } : {})
      });

      return res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError("El ID del trasfondo es obligatorio");
      }

      await this.softDeleteBackgroundUseCase.execute(id);
      return res.status(204).send();
    } catch (e) {
      next(e);
    }
  };

  restore = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError("El ID del trasfondo es obligatorio");
      }

      await this.restoreBackgroundUseCase.execute(id);
      return res.status(200).json({ message: "Trasfondo restaurado con éxito" });
    } catch (e) {
      next(e);
    }
  };
}
