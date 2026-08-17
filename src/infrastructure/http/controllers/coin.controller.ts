import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import { ValidationError } from "../../../domain/errors/AppError";
import GetCoins from "../../../application/use-cases/coins/getCoins.use-case";
import GetCoinById from "../../../application/use-cases/coins/getCoinById.use-case";
import CreateCoin from "../../../application/use-cases/coins/createCoin.use-case";
import UpdateCoin from "../../../application/use-cases/coins/updateCoin.use-case";
import DeleteCoin from "../../../application/use-cases/coins/deleteCoin.use-case";
import RestoreCoin from "../../../application/use-cases/coins/restoreCoin.use-case";

export class CoinController {
  constructor(
    private readonly getCoinsUseCase: GetCoins,
    private readonly getCoinByIdUseCase: GetCoinById,
    private readonly createCoinUseCase: CreateCoin,
    private readonly updateCoinUseCase: UpdateCoin,
    private readonly deleteCoinUseCase: DeleteCoin,
    private readonly restoreCoinUseCase: RestoreCoin
  ) {}

  getCoins = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const rulesetQuery = req.query.ruleset;
      let rulesets: string[] = [];
      if (typeof rulesetQuery === "string") {
        rulesets = [rulesetQuery];
      } else if (Array.isArray(rulesetQuery)) {
        rulesets = rulesetQuery.map(r => String(r));
      }
      const data = await this.getCoinsUseCase.execute(rulesets);
      return res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError("El ID de la moneda es obligatorio");
      }
      const data = await this.getCoinByIdUseCase.execute(id);
      return res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.createCoinUseCase.execute(req.body);
      return res.status(201).json(data);
    } catch (e) {
      next(e);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError("El ID de la moneda es obligatorio");
      }

      const data = await this.updateCoinUseCase.execute({
        id,
        ...req.body
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
        throw new ValidationError("El ID de la moneda es obligatorio");
      }

      await this.deleteCoinUseCase.execute(id);
      return res.status(204).send();
    } catch (e) {
      next(e);
    }
  };

  restore = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError("El ID de la moneda es obligatorio");
      }

      await this.restoreCoinUseCase.execute(id);
      return res.status(200).json({ message: "Moneda restaurada con éxito" });
    } catch (e) {
      next(e);
    }
  };
}
