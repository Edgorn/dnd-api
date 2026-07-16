import { Response, NextFunction } from 'express';
import GetAllRacesUseCase from '../../../application/use-cases/race/getAllRaces.use-case';
import CreateRaceUseCase from '../../../application/use-cases/race/createRace.use-case';
import UpdateRaceUseCase from '../../../application/use-cases/race/updateRace.use-case';
import SoftDeleteRace from '../../../application/use-cases/race/softDeleteRace.use-case';
import RestoreRace from '../../../application/use-cases/race/restoreRace.use-case';
import { AuthenticatedRequest } from '../interfaces/AuthenticatedRequest';
import { NotFoundError } from '../../../domain/errors/AppError';

export class RaceController {
  constructor(
    private readonly getAllRaces: GetAllRacesUseCase,
    private readonly createRaceUseCase: CreateRaceUseCase,
    private readonly updateRaceUseCase: UpdateRaceUseCase,
    private readonly softDeleteRaceUseCase: SoftDeleteRace,
    private readonly restoreRaceUseCase: RestoreRace
  ) { }

  getRaces = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { ruleset } = req.query;

    try {
      const parsedRuleset = Array.isArray(ruleset)
        ? String(ruleset[0])
        : (ruleset ? String(ruleset) : undefined);
      const data = await this.getAllRaces.execute(parsedRuleset as string)
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
      const userId = req.user; // Wait, is req.user the userId? Let's check AuthenticatedRequest definition.
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
}
