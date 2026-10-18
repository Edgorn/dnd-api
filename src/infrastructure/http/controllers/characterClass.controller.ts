import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import { ValidationError } from "../../../domain/errors/AppError";
import GetCharacterClassSummaries from "../../../application/use-cases/characterClass/getCharacterClassSummaries.use-case";
import GetCharacterClassCatalog from "../../../application/use-cases/characterClass/getCharacterClassCatalog.use-case";
import GetCharacterClassById from "../../../application/use-cases/characterClass/getCharacterClassById.use-case";
import CreateCharacterClass from "../../../application/use-cases/characterClass/createCharacterClass.use-case";
import UpdateCharacterClass from "../../../application/use-cases/characterClass/updateCharacterClass.use-case";
import SoftDeleteCharacterClass from "../../../application/use-cases/characterClass/softDeleteCharacterClass.use-case";
import RestoreCharacterClass from "../../../application/use-cases/characterClass/restoreCharacterClass.use-case";

export class CharacterClassController {
  constructor(
    private readonly getCharacterClassSummariesUseCase: GetCharacterClassSummaries,
    private readonly getCharacterClassCatalogUseCase: GetCharacterClassCatalog,
    private readonly getCharacterClassByIdUseCase: GetCharacterClassById,
    private readonly createCharacterClassUseCase: CreateCharacterClass,
    private readonly updateCharacterClassUseCase: UpdateCharacterClass,
    private readonly softDeleteCharacterClassUseCase: SoftDeleteCharacterClass,
    private readonly restoreCharacterClassUseCase: RestoreCharacterClass
  ) { }

  getClasses = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.getCharacterClassSummariesUseCase.execute(this.parseRulesets(req.query.ruleset));
      return res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  getCatalog = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const include = Array.isArray(req.query.include) ? req.query.include[0] : req.query.include;
      const data = await this.getCharacterClassCatalogUseCase.execute(
        this.parseRulesets(req.query.ruleset),
        include === "multiclass"
      );
      return res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError("El ID de la clase es obligatorio");
      }
      const data = await this.getCharacterClassByIdUseCase.execute(id, this.optionalRuleset(req.query.ruleset));
      return res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const data = await this.createCharacterClassUseCase.execute(req.body, userId);
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
        throw new ValidationError("El ID de la clase es obligatorio");
      }

      const data = await this.updateCharacterClassUseCase.execute({
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
        throw new ValidationError("El ID de la clase es obligatorio");
      }

      await this.softDeleteCharacterClassUseCase.execute(id, userId);
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
        throw new ValidationError("El ID de la clase es obligatorio");
      }

      await this.restoreCharacterClassUseCase.execute(id, userId);
      return res.status(200).json({ message: "Clase restaurada con éxito" });
    } catch (e) {
      next(e);
    }
  };

  private parseRulesets(ruleset: unknown): string[] | undefined {
    if (typeof ruleset === "string") return [ruleset];
    if (Array.isArray(ruleset)) return ruleset.map(item => String(item));
    return undefined;
  }

  private optionalRuleset(ruleset: unknown): string | undefined {
    const parsed = Array.isArray(ruleset) ? String(ruleset[0]) : (ruleset ? String(ruleset) : undefined);
    return parsed || undefined;
  }
}
