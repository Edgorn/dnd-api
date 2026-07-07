import { Response, NextFunction } from "express"
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import GetLanguagesBySystem from "../../../application/use-cases/language/getLanguagesBySystem.use-case";
import CreateLanguage from "../../../application/use-cases/language/createLanguage.use-case";
import UpdateLanguage from "../../../application/use-cases/language/updateLanguage.use-case";

import SoftDeleteLanguage from "../../../application/use-cases/language/softDeleteLanguage.use-case";
import RestoreLanguage from "../../../application/use-cases/language/restoreLanguage.use-case";
import { AppError, ValidationError } from "../../../domain/errors/AppError";

export class LanguageController {
  constructor(
    private readonly getLanguagesBySystemUseCase: GetLanguagesBySystem,
    private readonly createLanguageUseCase: CreateLanguage,
    private readonly updateLanguageUseCase: UpdateLanguage,
    private readonly softDeleteLanguageUseCase: SoftDeleteLanguage,
    private readonly restoreLanguageUseCase: RestoreLanguage
  ) { }

  getLanguagesBySystems = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { ruleset } = req.query;
      let rulesetArray: string[] = [];
      if (typeof ruleset === 'string') {
        rulesetArray = [ruleset];
      } else if (Array.isArray(ruleset)) {
        rulesetArray = ruleset.map(r => String(r));
      }

      const userId = req.user;
      const languages = await this.getLanguagesBySystemUseCase.execute(rulesetArray, userId)
      return res.status(200).json(languages)
    } catch (error) {
      console.error('[LanguageController] Error in getLanguagesBySystems:', error);
      next(error);
    }
  }

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const language = await this.createLanguageUseCase.execute(req.body);
      return res.status(201).json(language);
    } catch (error) {
      console.error('[LanguageController] Error in create:', error);
      next(error);
    }
  }

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = { ...req.body, id: req.params.id };
      const language = await this.updateLanguageUseCase.execute(data);
      return res.status(200).json(language);
    } catch (error) {
      console.error('[LanguageController] Error in update:', error);
      next(error);
    }
  }

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;
      
      if (!id) {
        throw new ValidationError("Language ID is required");
      }

      await this.softDeleteLanguageUseCase.execute(id, userId);
      return res.status(204).send();
    } catch (e: any) {
      if (e.message === 'No tienes permisos para borrar este idioma' || e.message === 'Sistema asociado no encontrado' || e.message === 'Idioma no encontrado') {
        return next(new AppError(e.message, e.message.includes('encontrado') ? 404 : 403));
      }
      console.error('[LanguageController] Error in delete:', e);
      next(e);
    }
  }

  restore = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;
      
      if (!id) {
        throw new ValidationError("Language ID is required");
      }

      await this.restoreLanguageUseCase.execute(id, userId);
      return res.status(200).json({ message: 'Idioma restaurado con éxito' });
    } catch (e: any) {
      if (e.message === 'No tienes permisos para restaurar este idioma' || e.message === 'Sistema asociado no encontrado' || e.message === 'Idioma no encontrado') {
        return next(new AppError(e.message, e.message.includes('encontrado') ? 404 : 403));
      }
      console.error('[LanguageController] Error in restore:', e);
      next(e);
    }
  }
}
