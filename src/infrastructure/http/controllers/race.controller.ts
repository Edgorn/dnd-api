import { Response, NextFunction } from 'express';
import GetAllRacesUseCase from '../../../application/use-cases/race/getAllRaces.use-case';
import GetRaceSummariesUseCase from '../../../application/use-cases/race/getRaceSummaries.use-case';
import GetRaceByIdUseCase from '../../../application/use-cases/race/getRaceById.use-case';
import GetRaceCatalogUseCase from '../../../application/use-cases/race/getRaceCatalog.use-case';
import CreateRaceUseCase from '../../../application/use-cases/race/createRace.use-case';
import UpdateRaceUseCase from '../../../application/use-cases/race/updateRace.use-case';
import SoftDeleteRace from '../../../application/use-cases/race/softDeleteRace.use-case';
import RestoreRace from '../../../application/use-cases/race/restoreRace.use-case';
import UpsertRaceOverride from '../../../application/use-cases/race/upsertRaceOverride.use-case';
import DeleteRaceOverride from '../../../application/use-cases/race/deleteRaceOverride.use-case';
import GetRaceOverride from '../../../application/use-cases/race/getRaceOverride.use-case';
import { AuthenticatedRequest } from '../interfaces/AuthenticatedRequest';
import { NotFoundError, ValidationError } from '../../../domain/errors/AppError';

export class RaceController {
  constructor(
    private readonly getAllRaces: GetAllRacesUseCase,
    private readonly getRaceSummaries: GetRaceSummariesUseCase,
    private readonly getRaceByIdUseCase: GetRaceByIdUseCase,
    private readonly getRaceCatalogUseCase: GetRaceCatalogUseCase,
    private readonly createRaceUseCase: CreateRaceUseCase,
    private readonly updateRaceUseCase: UpdateRaceUseCase,
    private readonly softDeleteRaceUseCase: SoftDeleteRace,
    private readonly restoreRaceUseCase: RestoreRace,
    private readonly upsertRaceOverrideUseCase: UpsertRaceOverride,
    private readonly deleteRaceOverrideUseCase: DeleteRaceOverride,
    private readonly getRaceOverrideUseCase: GetRaceOverride
  ) { }

  getRaces = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const ruleset = this.optionalRuleset(req.query.ruleset);
      const playable = this.parsePlayable(req.query.playable);
      const viewQuery = Array.isArray(req.query.view) ? req.query.view[0] : req.query.view;
      const data = viewQuery === "summary"
        ? await this.getRaceSummaries.execute(ruleset, playable)
        : await this.getAllRaces.execute(ruleset, playable);
      res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  getCatalog = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const ruleset = this.optionalRuleset(req.query.ruleset);
      const playable = this.parsePlayable(req.query.playable);
      const data = await this.getRaceCatalogUseCase.execute(ruleset, playable);
      res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError('El id de la raza es obligatorio');
      }
      const ruleset = this.optionalRuleset(req.query.ruleset);
      const data = await this.getRaceByIdUseCase.execute(id, ruleset);
      res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  createRace = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.createRaceUseCase.execute(req.body)
      res.status(201).json(data);
    } catch (e) {
      next(e);
    }
  };

  updateRace = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = await this.updateRaceUseCase.execute({ ...req.body, id })
      if (data) {
        res.status(200).json(data);
      } else {
        throw new NotFoundError('No se encontro la raza');
      }
    } catch (e) {
      next(e);
    }
  };

  softDeleteRace = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user;
      if (!userId) {
        throw new NotFoundError('Usuario no autenticado');
      }
      await this.softDeleteRaceUseCase.execute(id, userId);
      res.status(200).json({ message: 'Raza eliminada exitosamente' });
    } catch (e) {
      next(e);
    }
  };

  restoreRace = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user;
      if (!userId) {
        throw new NotFoundError('Usuario no autenticado');
      }
      await this.restoreRaceUseCase.execute(id, userId);
      res.status(200).json({ message: 'Raza restaurada exitosamente' });
    } catch (e) {
      next(e);
    }
  };

  upsertRaceOverride = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user;
      if (!userId) {
        throw new NotFoundError('Usuario no autenticado');
      }
      if (!id) {
        throw new ValidationError('El id de la raza es obligatorio');
      }
      const data = await this.upsertRaceOverrideUseCase.execute(id, req.body, userId);
      res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  getRaceOverride = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user;
      if (!userId) {
        throw new NotFoundError('Usuario no autenticado');
      }
      if (!id) {
        throw new ValidationError('El id de la raza es obligatorio');
      }
      const ruleset = this.parseRuleset(req.query.ruleset);
      const data = await this.getRaceOverrideUseCase.execute(id, ruleset, userId);
      res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  deleteRaceOverride = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user;
      if (!userId) {
        throw new NotFoundError('Usuario no autenticado');
      }
      if (!id) {
        throw new ValidationError('El id de la raza es obligatorio');
      }
      const ruleset = this.parseRuleset(req.query.ruleset);
      await this.deleteRaceOverrideUseCase.execute(id, ruleset, userId);
      res.status(200).json({ message: 'Parche de raza eliminado exitosamente' });
    } catch (e) {
      next(e);
    }
  };

  private parsePlayable(playable: unknown): boolean | undefined {
    const playableQuery = Array.isArray(playable) ? playable[0] : playable;
    if (playableQuery === "true") return true;
    if (playableQuery === "false") return false;
    return undefined;
  }

  private optionalRuleset(ruleset: unknown): string | undefined {
    const parsed = Array.isArray(ruleset) ? String(ruleset[0]) : (ruleset ? String(ruleset) : undefined);
    return parsed || undefined;
  }

  private parseRuleset(ruleset: unknown): string {
    const parsed = this.optionalRuleset(ruleset);
    if (!parsed) {
      throw new ValidationError('El sistema (ruleset) no puede estar vacío');
    }
    return parsed;
  };
}
