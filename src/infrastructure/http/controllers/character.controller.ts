import CreateCharacter from "../../../application/use-cases/character/createCharacter.use-case";
import GetCharactersByUser from "../../../application/use-cases/character/getCharactersByUser.use-case";
import GetCharacterById from "../../../application/use-cases/character/getCharacterById.use-case";
import UpdateCharacterXp from "../../../application/use-cases/character/updateCharacterXp.use-case";
import GetLevelUpData from "../../../application/use-cases/character/getLevelUpData.use-case";
import LevelUp from "../../../application/use-cases/character/levelUp.use-case";
import AddEquipment from "../../../application/use-cases/character/addEquipment.use-case";
import DeleteEquipment from "../../../application/use-cases/character/deleteEquipment.use-case";
import EquipEquipment from "../../../application/use-cases/character/equipEquipment.use-case";
import GenerateCharacterPdf from "../../../application/use-cases/character/generateCharacterPdf.use-case";
import UpdateMoney from "../../../application/use-cases/character/updateMoney.use-case";
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import BindWeaponBond from "../../../application/use-cases/character/bindWeaponBond.use-case";
import LearnSpells from "../../../application/use-cases/character/learnSpells.use-case";
import CopySpells from "../../../application/use-cases/character/copySpells.use-case";
import AddCharacterForm from "../../../application/use-cases/character/addCharacterForm.use-case";
import ActivateCharacterForm from "../../../application/use-cases/character/activateCharacterForm.use-case";
import DeactivateCharacterForm from "../../../application/use-cases/character/deactivateCharacterForm.use-case";
import ToggleFavoriteEquipment from "../../../application/use-cases/character/toggleFavoriteEquipment.use-case";
import PrepareSpells from "../../../application/use-cases/character/prepareSpells.use-case";
import BindSpellPrivileges from "../../../application/use-cases/character/bindSpellPrivileges.use-case";
import UpdateCompanions from "../../../application/use-cases/character/updateCompanions.use-case";
import UpdateCharacterFlavor from "../../../application/use-cases/character/updateCharacterFlavor.use-case";
import UseTrait from "../../../application/use-cases/character/useTrait.use-case";
import DeactivateTrait from "../../../application/use-cases/character/deactivateTrait.use-case";
import RestCharacter from "../../../application/use-cases/character/restCharacter.use-case";
import SpendHitDice from "../../../application/use-cases/character/spendHitDice.use-case";
import ApplyCharacterHp from "../../../application/use-cases/character/applyCharacterHp.use-case";
import SpendSpellSlot from "../../../application/use-cases/character/spendSpellSlot.use-case";
import ApplyCharacterCondition from "../../../application/use-cases/character/applyCharacterCondition.use-case";
import UpdateCharacterCondition from "../../../application/use-cases/character/updateCharacterCondition.use-case";
import RemoveCharacterCondition from "../../../application/use-cases/character/removeCharacterCondition.use-case";
import { ValidationError } from "../../../domain/errors/AppError";

export class CharacterController {
  constructor(
    private readonly getCharactersByUser: GetCharactersByUser,
    private readonly createCharacterUseCase: CreateCharacter,
    private readonly getCharacterByIdUseCase: GetCharacterById,
    private readonly updateCharacterXp: UpdateCharacterXp,
    private readonly getLevelUpDataUseCase: GetLevelUpData,
    private readonly levelUpUseCase: LevelUp,
    private readonly addEquipmentUseCase: AddEquipment,
    private readonly deleteEquipmentUseCase: DeleteEquipment,
    private readonly equipEquipment: EquipEquipment,
    private readonly updateMoneyUseCase: UpdateMoney,
    private readonly generateCharacterPdf: GenerateCharacterPdf,
    private readonly bindWeaponBond: BindWeaponBond,
    private readonly learnSpellsUseCase: LearnSpells,
    private readonly copySpellsUseCase: CopySpells,
    private readonly addCharacterForm: AddCharacterForm,
    private readonly activateCharacterFormUseCase: ActivateCharacterForm,
    private readonly deactivateCharacterFormUseCase: DeactivateCharacterForm,
    private readonly toggleFavoriteEquipment: ToggleFavoriteEquipment,
    private readonly prepareSpellsUseCase: PrepareSpells,
    private readonly bindSpellPrivilegesUseCase: BindSpellPrivileges,
    private readonly updateCompanionsUseCase: UpdateCompanions,
    private readonly updateCharacterFlavorUseCase: UpdateCharacterFlavor,
    private readonly useTraitUseCase: UseTrait,
    private readonly deactivateTraitUseCase: DeactivateTrait,
    private readonly restCharacterUseCase: RestCharacter,
    private readonly spendHitDiceUseCase: SpendHitDice,
    private readonly applyCharacterHpUseCase: ApplyCharacterHp,
    private readonly spendSpellSlotUseCase: SpendSpellSlot,
    private readonly applyCharacterConditionUseCase: ApplyCharacterCondition,
    private readonly updateCharacterConditionUseCase: UpdateCharacterCondition,
    private readonly removeCharacterConditionUseCase: RemoveCharacterCondition
  ) { }

  getCharacters = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const include = Array.isArray(req.query.include) ? req.query.include[0] : req.query.include;
      const data = await this.getCharactersByUser.execute(req.user!, {
        includeCombatSeed: include === "combatSeed"
      });
      res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  createCharacter = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.createCharacterUseCase.execute({ ...req.body, user: req.user! })
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

      const view = Array.isArray(req.query.view) ? req.query.view[0] : req.query.view;
      const data = await this.getCharacterByIdUseCase.execute(
        id,
        req.user!,
        view === "sheet" || view === "combat" ? { view } : undefined
      )
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
      console.error("[CharacterController.generatePdf] Error:", e);
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
      console.error("[CharacterController.addEquipment] Error:", e);
      next(e);
    }
  };

  deleteEquipment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id, instanceId } = req.params;

      if (!id) {
        throw new ValidationError("Se requiere el ID del personaje");
      }

      if (!instanceId) {
        throw new ValidationError("Se requiere el ID de la instancia de equipamiento");
      }

      const quantity = req.query.quantity === undefined
        ? undefined
        : Number(req.query.quantity);

      const data = await this.deleteEquipmentUseCase.execute({ id, instanceId, quantity });
      res.status(200).json(data);
    } catch (e) {
      console.error("[CharacterController.deleteEquipment] Error:", e);
      next(e);
    }
  };

  updateEquipmentEquipped = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id, instanceId } = req.params;

      if (!id) {
        throw new ValidationError("Se requiere el ID del personaje");
      }

      if (!instanceId) {
        throw new ValidationError("Se requiere el ID de la instancia de equipamiento");
      }

      const data = await this.equipEquipment.execute({ id, instanceId, ...req.body });
      res.status(200).json(data);
    } catch (e) {
      console.error("[CharacterController.updateEquipmentEquipped] Error:", e);
      next(e);
    }
  };

  bindWeaponBondHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id, instanceId } = req.params;

      if (!id) {
        throw new ValidationError("Se requiere el ID del personaje");
      }

      if (!instanceId) {
        throw new ValidationError("Se requiere el ID de la instancia de equipamiento");
      }

      const data = await this.bindWeaponBond.execute({ id, instanceId, ...req.body });
      res.status(200).json(data);
    } catch (e) {
      console.error("[CharacterController.bindWeaponBondHandler] Error:", e);
      next(e);
    }
  };

  toggleFavoriteEquipmentHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id, instanceId } = req.params;

      if (!id) {
        throw new ValidationError("Se requiere el ID del personaje");
      }

      if (!instanceId) {
        throw new ValidationError("Se requiere el ID de la instancia de equipamiento");
      }

      const data = await this.toggleFavoriteEquipment.execute({ id, instanceId, ...req.body });
      res.status(200).json(data);
    } catch (e) {
      console.error("[CharacterController.toggleFavoriteEquipmentHandler] Error:", e);
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

      const { xp } = req.body;
      await this.updateCharacterXp.execute(id, xp, req.user!);
      res.status(200).json({ success: true });
    } catch (e) {
      console.error("[CharacterController.updateXp] Error:", e);
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

      const view = Array.isArray(req.query.view) ? req.query.view[0] : req.query.view;
      const data = await this.getLevelUpDataUseCase.execute(
        id,
        classId,
        req.user!,
        view === "compact" ? { view: "compact" } : undefined
      );
      res.status(200).json(data);
    } catch (e) {
      console.error("[CharacterController.getLevelUpData] Error:", e);
      next(e);
    }
  };

  levelUp = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("Se requiere el ID del personaje");
      }

      const {
        class: classId,
        hpIncrease,
        spells,
        subclass,
        abilityScore,
        abilityScoreOption,
        traitChoices,
        skillPicks,
        skillProficiencyPicks,
        proficiencyPicks,
        spellReplacements,
        optionPicks,
      } = req.body;
      const data = await this.levelUpUseCase.execute({
        id,
        classId,
        hpIncrease,
        userId: req.user!,
        spells,
        subclass,
        abilityScore,
        abilityScoreOption,
        traitChoices,
        skillPicks,
        skillProficiencyPicks,
        proficiencyPicks,
        spellReplacements,
        optionPicks,
      });
      res.status(200).json(data);
    } catch (e) {
      console.error("[CharacterController.levelUp] Error:", e);
      next(e);
    }
  };

  learnSpells = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("Se requiere el ID del personaje");
      }

      const { class: classId, spells } = req.body;
      const data = await this.learnSpellsUseCase.execute({
        id,
        classId,
        spells,
        userId: req.user!,
      });
      res.status(200).json(data);
    } catch (e) {
      console.error("[CharacterController.learnSpells] Error:", e);
      next(e);
    }
  };

  copySpells = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("Se requiere el ID del personaje");
      }

      const { class: classId, spells, traitId } = req.body;
      const data = await this.copySpellsUseCase.execute({
        id,
        classId,
        spells,
        traitId,
        userId: req.user!,
      });
      res.status(200).json(data);
    } catch (e) {
      console.error("[CharacterController.copySpells] Error:", e);
      next(e);
    }
  };

  prepareSpells = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("Se requiere el ID del personaje");
      }

      const { class: classId, spells } = req.body;
      const data = await this.prepareSpellsUseCase.execute({
        id,
        classId,
        spells,
        userId: req.user!,
      });
      res.status(200).json(data);
    } catch (e) {
      console.error("[CharacterController.prepareSpells] Error:", e);
      next(e);
    }
  };

  bindSpellPrivileges = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id, traitId } = req.params;

      if (!id) {
        throw new ValidationError("Se requiere el ID del personaje");
      }
      if (!traitId) {
        throw new ValidationError("Se requiere el ID del rasgo");
      }

      const { class: classId, selections } = req.body;
      const data = await this.bindSpellPrivilegesUseCase.execute({
        id,
        traitId,
        classId,
        selections,
        userId: req.user!,
      });
      res.status(200).json(data);
    } catch (e) {
      console.error("[CharacterController.bindSpellPrivileges] Error:", e);
      next(e);
    }
  };

  addForm = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError("Se requiere el ID del personaje");
      }
      const { creatureId, spellId } = req.body;
      const data = await this.addCharacterForm.execute({
        id,
        creatureId,
        spellId,
        userId: req.user!
      });
      res.status(200).json(data);
    } catch (e) {
      console.error("[CharacterController.addForm] Error:", e);
      next(e);
    }
  };

  activateForm = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id, formId } = req.params;
      if (!id || !formId) {
        throw new ValidationError("Se requiere el ID del personaje y de la forma");
      }
      const data = await this.activateCharacterFormUseCase.execute({
        id,
        formId,
        userId: req.user!
      });
      res.status(200).json(data);
    } catch (e) {
      console.error("[CharacterController.activateForm] Error:", e);
      next(e);
    }
  };

  deactivateForm = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id, formId } = req.params;
      if (!id || !formId) {
        throw new ValidationError("Se requiere el ID del personaje y de la forma");
      }
      const data = await this.deactivateCharacterFormUseCase.execute({
        id,
        formId,
        userId: req.user!
      });
      res.status(200).json(data);
    } catch (e) {
      console.error("[CharacterController.deactivateForm] Error:", e);
      next(e);
    }
  };

  useTrait = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id, traitId } = req.params;
      if (!id) {
        throw new ValidationError("Se requiere el ID del personaje");
      }
      if (!traitId) {
        throw new ValidationError("Se requiere el ID del rasgo");
      }
      const data = await this.useTraitUseCase.execute({
        id,
        traitId,
        userId: req.user!,
        equipmentId: req.body?.equipmentId
      });
      res.status(200).json(data);
    } catch (e) {
      console.error("[CharacterController.useTrait] Error:", e);
      next(e);
    }
  };

  deactivateTrait = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id, traitId } = req.params;
      if (!id) {
        throw new ValidationError("Se requiere el ID del personaje");
      }
      if (!traitId) {
        throw new ValidationError("Se requiere el ID del rasgo");
      }
      const data = await this.deactivateTraitUseCase.execute({
        id,
        traitId,
        userId: req.user!
      });
      res.status(200).json(data);
    } catch (e) {
      console.error("[CharacterController.deactivateTrait] Error:", e);
      next(e);
    }
  };

  restCharacter = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError("Se requiere el ID del personaje");
      }
      const data = await this.restCharacterUseCase.execute({
        id,
        type: req.body.type,
        userId: req.user!,
        traitChoices: req.body.traitChoices,
        hitDiceSpends: req.body.hitDiceSpends
      });
      res.status(200).json(data);
    } catch (e) {
      console.error("[CharacterController.restCharacter] Error:", e);
      next(e);
    }
  };

  spendHitDice = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError("Se requiere el ID del personaje");
      }
      const data = await this.spendHitDiceUseCase.execute({
        id,
        classId: req.body.classId,
        count: req.body.count,
        hpGained: req.body.hpGained,
        userId: req.user!
      });
      res.status(200).json(data);
    } catch (e) {
      console.error("[CharacterController.spendHitDice] Error:", e);
      next(e);
    }
  };

  applyHpDamage = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError("Se requiere el ID del personaje");
      }
      const data = await this.applyCharacterHpUseCase.execute({
        id,
        amount: req.body.amount,
        kind: "damage",
        userId: req.user!
      });
      res.status(200).json(data);
    } catch (e) {
      console.error("[CharacterController.applyHpDamage] Error:", e);
      next(e);
    }
  };

  applyHpHeal = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError("Se requiere el ID del personaje");
      }
      const data = await this.applyCharacterHpUseCase.execute({
        id,
        amount: req.body.amount,
        kind: "heal",
        userId: req.user!
      });
      res.status(200).json(data);
    } catch (e) {
      console.error("[CharacterController.applyHpHeal] Error:", e);
      next(e);
    }
  };

  applyCharacterCondition = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError("Se requiere el ID del personaje");
      }
      const data = await this.applyCharacterConditionUseCase.execute({
        id,
        conditionId: req.body.conditionId,
        level: req.body.level,
        userId: req.user!
      });
      res.status(200).json(data);
    } catch (e) {
      console.error("[CharacterController.applyCharacterCondition] Error:", e);
      next(e);
    }
  };

  updateCharacterCondition = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id, conditionId } = req.params;
      if (!id || !conditionId) {
        throw new ValidationError("Se requiere el ID del personaje y del estado");
      }
      const data = await this.updateCharacterConditionUseCase.execute({
        id,
        conditionId,
        delta: req.body.delta,
        userId: req.user!
      });
      res.status(200).json(data);
    } catch (e) {
      console.error("[CharacterController.updateCharacterCondition] Error:", e);
      next(e);
    }
  };

  removeCharacterCondition = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id, conditionId } = req.params;
      if (!id || !conditionId) {
        throw new ValidationError("Se requiere el ID del personaje y del estado");
      }
      const data = await this.removeCharacterConditionUseCase.execute({
        id,
        conditionId,
        userId: req.user!
      });
      res.status(200).json(data);
    } catch (e) {
      console.error("[CharacterController.removeCharacterCondition] Error:", e);
      next(e);
    }
  };

  spendSpellSlot = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError("Se requiere el ID del personaje");
      }
      const data = await this.spendSpellSlotUseCase.execute({
        id,
        classId: req.body.classId,
        pool: req.body.pool,
        level: req.body.level,
        userId: req.user!
      });
      res.status(200).json(data);
    } catch (e) {
      console.error("[CharacterController.spendSpellSlot] Error:", e);
      next(e);
    }
  };

  updateCompanions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("Se requiere el ID del personaje");
      }

      const { companions } = req.body;
      const data = await this.updateCompanionsUseCase.execute(id, companions, req.user!);
      res.status(200).json(data);
    } catch (e) {
      console.error("[CharacterController.updateCompanions] Error:", e);
      next(e);
    }
  };

  updateFlavor = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("Se requiere el ID del personaje");
      }

      const data = await this.updateCharacterFlavorUseCase.execute({
        id,
        userId: req.user!,
        ...req.body,
      });
      res.status(200).json(data);
    } catch (e) {
      console.error("[CharacterController.updateFlavor] Error:", e);
      next(e);
    }
  };
}
