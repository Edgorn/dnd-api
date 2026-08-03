import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import { ValidationError } from "../../../domain/errors/AppError";
import CreateSpell from "../../../application/use-cases/spell/createSpell.use-case";
import UpdateSpell from "../../../application/use-cases/spell/updateSpell.use-case";
import SoftDeleteSpell from "../../../application/use-cases/spell/softDeleteSpell.use-case";
import RestoreSpell from "../../../application/use-cases/spell/restoreSpell.use-case";
import GetSpellsBySystems from "../../../application/use-cases/spell/getSpellsBySystems.use-case";
import GetSpellById from "../../../application/use-cases/spell/getSpellById.use-case";
import GetSpellsByLevel from "../../../application/use-cases/spell/getSpellsByLevel.use-case";
import GetRitualSpells from "../../../application/use-cases/spell/getRitualSpells.use-case";

export class SpellController {
  constructor(
    private readonly createSpellUseCase: CreateSpell,
    private readonly updateSpellUseCase: UpdateSpell,
    private readonly softDeleteSpellUseCase: SoftDeleteSpell,
    private readonly restoreSpellUseCase: RestoreSpell,
    private readonly getSpellsBySystemsUseCase: GetSpellsBySystems,
    private readonly getSpellByIdUseCase: GetSpellById,
    private readonly getSpellsByLevelUseCase: GetSpellsByLevel,
    private readonly getRitualSpellsUseCase: GetRitualSpells
  ) {}

  getSpellsBySystems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ruleset } = req.query;
      let rulesets: string[] = [];

      if (typeof ruleset === "string") {
        rulesets = [ruleset];
      } else if (Array.isArray(ruleset)) {
        rulesets = ruleset as string[];
      }

      const data = await this.getSpellsBySystemsUseCase.execute(rulesets);
      return res.status(200).json(data);
    } catch (e) {
      console.error("[SpellController.getSpellsBySystems] Error:", e);
      next(e);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id || typeof id !== "string") {
        throw new ValidationError("Spell ID is required");
      }

      const data = await this.getSpellByIdUseCase.execute(id);
      return res.status(200).json(data);
    } catch (e) {
      console.error("[SpellController.getById] Error:", e);
      next(e);
    }
  };

  getSpellsByLevel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { level } = req.params;
      const { ruleset, className } = req.query;
      let rulesets: string[] = [];

      if (typeof ruleset === "string") {
        rulesets = [ruleset];
      } else if (Array.isArray(ruleset)) {
        rulesets = ruleset as string[];
      }

      const data = await this.getSpellsByLevelUseCase.execute(
        Number(level),
        rulesets,
        typeof className === 'string' ? className : undefined
      );
      return res.status(200).json(data);
    } catch (e) {
      console.error("[SpellController.getSpellsByLevel] Error:", e);
      next(e);
    }
  };

  getRitualSpells = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ruleset } = req.query;
      let rulesets: string[] = [];

      if (typeof ruleset === "string") {
        rulesets = [ruleset];
      } else if (Array.isArray(ruleset)) {
        rulesets = ruleset as string[];
      }

      const data = await this.getRitualSpellsUseCase.execute(rulesets);
      return res.status(200).json(data);
    } catch (e) {
      console.error("[SpellController.getRitualSpells] Error:", e);
      next(e);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const data = await this.createSpellUseCase.execute(req.body, userId);
      return res.status(201).json(data);
    } catch (e) {
      console.error("[SpellController.create] Error:", e);
      next(e);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("Spell ID is required");
      }

      const data = await this.updateSpellUseCase.execute({
        id,
        ...req.body
      }, userId);

      return res.status(200).json(data);
    } catch (e) {
      console.error("[SpellController.update] Error:", e);
      next(e);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("Spell ID is required");
      }

      await this.softDeleteSpellUseCase.execute(id, userId);
      return res.status(204).send();
    } catch (e) {
      console.error("[SpellController.delete] Error:", e);
      next(e);
    }
  };

  restore = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("Spell ID is required");
      }

      await this.restoreSpellUseCase.execute(id, userId);
      return res.status(200).json({ message: 'Conjuro restaurado con éxito' });
    } catch (e) {
      console.error("[SpellController.restore] Error:", e);
      next(e);
    }
  };

  // Legacy controller method alias
  getConjurosPorNivel = this.getSpellsByLevel;
  getConjurosRituales = this.getRitualSpells;
}
