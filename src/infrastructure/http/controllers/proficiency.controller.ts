import { Request, Response } from "express";
import CreateProficiency from "../../../application/use-cases/proficiency/createProficiency.use-case";
import UpdateProficiency from "../../../application/use-cases/proficiency/updateProficiency.use-case";
import SoftDeleteProficiency from "../../../application/use-cases/proficiency/softDeleteProficiency.use-case";
import RestoreProficiency from "../../../application/use-cases/proficiency/restoreProficiency.use-case";
import GetProficienciesBySystems from "../../../application/use-cases/proficiency/getProficienciesBySystems.use-case";

export class ProficiencyController {
  constructor(
    private readonly getProficienciesBySystemsUseCase: GetProficienciesBySystems,
    private readonly createProficiencyUseCase: CreateProficiency,
    private readonly updateProficiencyUseCase: UpdateProficiency,
    private readonly softDeleteProficiencyUseCase: SoftDeleteProficiency,
    private readonly restoreProficiencyUseCase: RestoreProficiency
  ) {}

  getBySystems = async (req: Request, res: Response) => {
    try {
      const systems = typeof req.query.systems === 'string' ? req.query.systems.split(",") : [];
      const proficiencies = await this.getProficienciesBySystemsUseCase.execute(systems);
      res.status(200).json(proficiencies);
    } catch (error) {
      throw error;
    }
  }

  create = async (req: Request, res: Response) => {
    try {
      const email = (req as any).user!.email;
      const result = await this.createProficiencyUseCase.execute(req.body, email);
      res.status(201).json(result);
    } catch (error) {
      throw error;
    }
  }

  update = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const email = (req as any).user!.email;
      const result = await this.updateProficiencyUseCase.execute(id, req.body, email);
      res.status(200).json(result);
    } catch (error) {
      throw error;
    }
  }

  softDelete = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const email = (req as any).user!.email;
      await this.softDeleteProficiencyUseCase.execute(id, email);
      res.status(204).send();
    } catch (error) {
      throw error;
    }
  }

  restore = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const email = (req as any).user!.email;
      await this.restoreProficiencyUseCase.execute(id, email);
      res.status(200).json({ message: "Proficiency restaurado correctamente" });
    } catch (error) {
      throw error;
    }
  }
}
