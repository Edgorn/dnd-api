import CrearPersonaje from "../../../application/use-cases/personaje/crearPersonaje.use-case";
import ObtenerPersonajesPorUsuario from "../../../application/use-cases/personaje/obtenerPersonajesPorUsuario.use-case";
import ConsultarPersonaje from "../../../application/use-cases/personaje/obtenerPersonajePorId.use-case";
import ModificarXp from "../../../application/use-cases/personaje/modificarXp.use-case";
import SubirNivelDatos from "../../../application/use-cases/personaje/subirNivelDatos.use-case";
import SubirNivel from "../../../application/use-cases/personaje/subirNivel.use-case";
import AñadirEquipo from "../../../application/use-cases/personaje/añadirEquipo.use-case";
import EliminarEquipo from "../../../application/use-cases/personaje/eliminarEquipo.use-case";
import EquipArmor from "../../../application/use-cases/personaje/equiparArmadura.use-case.";
import CrearPdf from "../../../application/use-cases/personaje/obtenerPdf.use-case";
import UpdateMoney from "../../../application/use-cases/personaje/modificarDinero.use-case";
import { Response } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import VincularPacto from "../../../application/use-cases/personaje/vincularPacto.use-case";
import AprenderConjuros from "../../../application/use-cases/personaje/aprenderConjuros.use-case";

export class PersonajeController {
  constructor(
    private readonly obtenerPersonajesPorUsuario: ObtenerPersonajesPorUsuario,
    private readonly crearPersonaje: CrearPersonaje,
    private readonly consultarPersonaje: ConsultarPersonaje,
    private readonly modificarXp: ModificarXp,
    private readonly subirNivelDatos: SubirNivelDatos,
    private readonly subirNivel: SubirNivel,
    private readonly añadirEquipo: AñadirEquipo,
    private readonly eliminarEquipo: EliminarEquipo,
    private readonly equipArmor: EquipArmor,
    private readonly updateMoney: UpdateMoney,
    private readonly crearPdf: CrearPdf,
    private readonly vincularPacto: VincularPacto,
    private readonly aprenderConjuros: AprenderConjuros
  ) { }
 
  getCharacters = async (req: AuthenticatedRequest, res: Response) => {
    const data = await this.obtenerPersonajesPorUsuario.execute(req.user!)
    res.status(200).json(data);
  };

  createCharacter = async (req: AuthenticatedRequest, res: Response) => {
    const data = await this.crearPersonaje.execute({ ...req.body, user: req.user! })
    res.status(200).json(data);
  };

  getCharacter = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Se requiere el ID del personaje' });
    }

    const data = await this.consultarPersonaje.execute(id, req.user!)
    res.status(200).json(data);
  };

  generarPdf = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Se requiere el ID del personaje' });
    }

    const data = await this.crearPdf.execute(id, req.user!)
    res.status(200).send(Buffer.from(data));
  };

  añadirEquipamiento = async (req: AuthenticatedRequest, res: Response) => {
    const data = await this.añadirEquipo.execute(req.body)
    res.status(200).json(data);
  };

  eliminarEquipamiento = async (req: AuthenticatedRequest, res: Response) => {
    const data = await this.eliminarEquipo.execute(req.body)
    res.status(200).json(data);
  };

  equiparArmadura = async (req: AuthenticatedRequest, res: Response) => {
    const data = await this.equipArmor.execute(req.body)
    res.status(200).json(data);
  };

  vincularArmaPacto = async (req: AuthenticatedRequest, res: Response) => {
    const data = await this.vincularPacto.execute(req.body)
    res.status(200).json(data);
  };

  modificarDinero = async (req: AuthenticatedRequest, res: Response) => {
    const { id, money } = req.body

    const data = await this.updateMoney.execute(id, money)
    res.status(200).json(data);
  };

  changeXp = async (req: AuthenticatedRequest, res: Response) => {
    const data = await this.modificarXp.execute(req.body)
    res.status(200).json(data);
  };

  levelUpData = async (req: AuthenticatedRequest, res: Response) => {
    const data = await this.subirNivelDatos.execute(req.body)
    res.status(200).json(data);
  }

  levelUp = async (req: AuthenticatedRequest, res: Response) => {
    const data = await this.subirNivel.execute(req.body)
    res.status(200).json(data);
  };

  aprenderListaConjuros = async (req: AuthenticatedRequest, res: Response) => {
    const data = await this.aprenderConjuros.execute(req.body)
    res.status(200).json(data);
  };
}
