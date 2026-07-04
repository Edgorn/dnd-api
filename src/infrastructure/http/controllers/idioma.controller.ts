import { Response, NextFunction } from "express"
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import ObtenerIdiomasPorSistemas from "../../../application/use-cases/idioma/obtenerIdiomaPorSistema.use-case";
import CrearIdioma from "../../../application/use-cases/idioma/crearIdioma.use-case";
import ModificarIdioma from "../../../application/use-cases/idioma/modificarIdioma.use-case";

export class IdiomaController {
  constructor(
    private readonly obtenerIdiomasPorSistemasUseCase: ObtenerIdiomasPorSistemas,
    private readonly createIdiomaUseCase: CrearIdioma,
    private readonly updateIdiomaUseCase: ModificarIdioma
  ) { }

  obtenerIdiomasPorSistemas = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { ruleset } = req.query;
      let rulesetArray: string[] = [];
      if (typeof ruleset === 'string') {
        rulesetArray = [ruleset];
      } else if (Array.isArray(ruleset)) {
        rulesetArray = ruleset.map(r => String(r));
      }

      const idiomas = await this.obtenerIdiomasPorSistemasUseCase.execute(rulesetArray)
      return res.status(200).json(idiomas)
    } catch (error) {
      next(error);
    }
  }

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const idiomas = await this.createIdiomaUseCase.execute(req.body);
      return res.status(201).json(idiomas);
    } catch (error) {
      next(error);
    }
  }

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const idiomas = await this.updateIdiomaUseCase.execute(req.body);
      return res.status(200).json(idiomas);
    } catch (error) {
      next(error);
    }
  }
}