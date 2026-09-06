import CrearPersonaje from "../../../application/use-cases/personaje/crearPersonaje.use-case";
import GetCharactersByUser from "../../../application/use-cases/personaje/getCharactersByUser.use-case";
import ConsultarPersonaje from "../../../application/use-cases/personaje/obtenerPersonajePorId.use-case";
import UpdateCharacterXp from "../../../application/use-cases/personaje/updateCharacterXp.use-case";
import GetLevelUpData from "../../../application/use-cases/personaje/getLevelUpData.use-case";
import LevelUp from "../../../application/use-cases/personaje/levelUp.use-case";
import AddEquipment from "../../../application/use-cases/personaje/addEquipment.use-case";
import DeleteEquipment from "../../../application/use-cases/personaje/deleteEquipment.use-case";
import EquipArmor from "../../../application/use-cases/personaje/equipArmor.use-case";
import GenerateCharacterPdf from "../../../application/use-cases/personaje/generateCharacterPdf.use-case";
import UpdateMoney from "../../../application/use-cases/personaje/updateMoney.use-case";
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import VincularPacto from "../../../application/use-cases/personaje/vincularPacto.use-case";
import AprenderConjuros from "../../../application/use-cases/personaje/aprenderConjuros.use-case";
import AñadirForma from "../../../application/use-cases/personaje/añadirForma.use-case";
import ToggleFavoriteEquipment from "../../../application/use-cases/personaje/toggleFavoriteEquipment.use-case";
import { ValidationError } from "../../../domain/errors/AppError";

export class PersonajeController {
  constructor(
    private readonly getCharactersByUser: GetCharactersByUser,
    private readonly crearPersonaje: CrearPersonaje,
    private readonly consultarPersonaje: ConsultarPersonaje,
    private readonly updateCharacterXp: UpdateCharacterXp,
    private readonly getLevelUpDataUseCase: GetLevelUpData,
    private readonly levelUpUseCase: LevelUp,
    private readonly addEquipmentUseCase: AddEquipment,
    private readonly deleteEquipmentUseCase: DeleteEquipment,
    private readonly equipArmor: EquipArmor,
    private readonly updateMoneyUseCase: UpdateMoney,
    private readonly generateCharacterPdf: GenerateCharacterPdf,
    private readonly vincularPacto: VincularPacto,
    private readonly aprenderConjuros: AprenderConjuros,
    private readonly añadirForma: AñadirForma,
    private readonly toggleFavoriteEquipment: ToggleFavoriteEquipment
  ) { }

  getCharacters = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.getCharactersByUser.execute(req.user!)
      res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  createCharacter = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.crearPersonaje.execute({ ...req.body, user: req.user! })
      res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  getCharacter = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('Se requiere el ID del personaje');
      }

      const data = await this.consultarPersonaje.execute(id, req.user!)
      res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  generatePdf = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = await this.generateCharacterPdf.execute(id, req.user!);
      const filename = `character-${id}.pdf`;

      res.status(200)
        .setHeader("Content-Type", "application/pdf")
        .setHeader("Content-Disposition", `attachment; filename="${filename}"`)
        .send(Buffer.from(data));
    } catch (e) {
      console.error("[PersonajeController.generatePdf] Error:", e);
      next(e);
    }
  };

  addEquipment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("Se requiere el ID del personaje");
      }

      const data = await this.addEquipmentUseCase.execute({ id, ...req.body });
      res.status(200).json(data);
    } catch (e) {
      console.error("[PersonajeController.addEquipment] Error:", e);
      next(e);
    }
  };

  deleteEquipment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("Se requiere el ID del personaje");
      }

      const data = await this.deleteEquipmentUseCase.execute({ id, ...req.body });
      res.status(200).json(data);
    } catch (e) {
      console.error("[PersonajeController.deleteEquipment] Error:", e);
      next(e);
    }
  };

  updateEquipmentEquipped = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("Se requiere el ID del personaje");
      }

      const data = await this.equipArmor.execute({ id, ...req.body });
      res.status(200).json(data);
    } catch (e) {
      console.error("[PersonajeController.updateEquipmentEquipped] Error:", e);
      next(e);
    }
  };

  vincularArmaPacto = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.vincularPacto.execute(req.body)
      res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  toggleFavoriteEquipmentHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("Se requiere el ID del personaje");
      }

      const data = await this.toggleFavoriteEquipment.execute({ id, ...req.body });
      res.status(200).json(data);
    } catch (e) {
      console.error("[PersonajeController.toggleFavoriteEquipmentHandler] Error:", e);
      next(e);
    }
  };

  updateMoney = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("Se requiere el ID del personaje");
      }

      const { money } = req.body;
      const data = await this.updateMoneyUseCase.execute(id, money);
      res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  updateXp = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("Se requiere el ID del personaje");
      }

      const { XP } = req.body;
      await this.updateCharacterXp.execute(id, XP, req.user!);
      res.status(200).json({ success: true });
    } catch (e) {
      console.error("[PersonajeController.updateXp] Error:", e);
      next(e);
    }
  };

  getLevelUpData = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const classId = req.query.class as string;

      if (!id) {
        throw new ValidationError("Se requiere el ID del personaje");
      }

      const data = await this.getLevelUpDataUseCase.execute(id, classId, req.user!);
      res.status(200).json(data);
    } catch (e) {
      console.error("[PersonajeController.getLevelUpData] Error:", e);
      next(e);
    }
  };

  levelUp = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("Se requiere el ID del personaje");
      }

      const { class: classId, hpIncrease } = req.body;
      const data = await this.levelUpUseCase.execute({
        id,
        classId,
        hpIncrease,
        userId: req.user!,
      });
      res.status(200).json(data);
    } catch (e) {
      console.error("[PersonajeController.levelUp] Error:", e);
      next(e);
    }
  };

  aprenderListaConjuros = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.aprenderConjuros.execute(req.body)
      res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  addForm = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = await this.añadirForma.execute({ id, form: req.body.form })
      res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };
}
