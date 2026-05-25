import { Response } from "express"
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

  obtenerIdiomasPorSistemas = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { ruleset } = req.query;
      
      const idiomas = await this.obtenerIdiomasPorSistemasUseCase.execute(ruleset as string[])
      return res.status(200).json(idiomas)
    } catch (error: any) {
      console.error(error)
      return res.status(500).json({ message: error.message })
    }
  }

  create = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const idiomas = await this.createIdiomaUseCase.execute(req.body);
      return res.status(201).json(idiomas);
    } catch (error: any) {
      console.error("Error al crear el idiomas:", error);
      return res.status(500).json({ message: error.message });
    }
  }

  update = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const idiomas = await this.updateIdiomaUseCase.execute(req.body);
      return res.status(200).json(idiomas);
    } catch (error: any) {
      console.error("Error al actualizar el idiomas:", error);
      return res.status(500).json({ message: error.message });
    }
  }
}