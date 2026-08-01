import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import { ValidationError } from "../../../domain/errors/AppError";
import GetCharacterClassesBySystems from "../../../application/use-cases/characterClass/getCharacterClassesBySystems.use-case";
import CreateCharacterClass from "../../../application/use-cases/characterClass/createCharacterClass.use-case";
import UpdateCharacterClass from "../../../application/use-cases/characterClass/updateCharacterClass.use-case";
import SoftDeleteCharacterClass from "../../../application/use-cases/characterClass/softDeleteCharacterClass.use-case";
import RestoreCharacterClass from "../../../application/use-cases/characterClass/restoreCharacterClass.use-case";

export class CharacterClassController {
  constructor(
    private readonly getCharacterClassesBySystemsUseCase: GetCharacterClassesBySystems,
    private readonly createCharacterClassUseCase: CreateCharacterClass,
    private readonly updateCharacterClassUseCase: UpdateCharacterClass,
    private readonly softDeleteCharacterClassUseCase: SoftDeleteCharacterClass,
    private readonly restoreCharacterClassUseCase: RestoreCharacterClass
  ) { }

  getClasses = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const rulesetQuery = req.query.ruleset;
      let rulesets: string[] | undefined = undefined;
      if (typeof rulesetQuery === "string") {
        rulesets = [rulesetQuery];
      } else if (Array.isArray(rulesetQuery)) {
        rulesets = rulesetQuery.map(r => String(r));
      }
      const data = await this.getCharacterClassesBySystemsUseCase.execute(rulesets);
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
}
