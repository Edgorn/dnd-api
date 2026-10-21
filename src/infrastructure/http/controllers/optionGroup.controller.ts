import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import { ValidationError } from "../../../domain/errors/AppError";

export function requiredPathId(value: string | string[] | undefined, message: string): string {
  const id = Array.isArray(value) ? value[0] : value;
  if (!id) {
    throw new ValidationError(message);
  }
  return id;
}
import CreateOptionGroup from "../../../application/use-cases/optionGroup/createOptionGroup.use-case";
import UpdateOptionGroup from "../../../application/use-cases/optionGroup/updateOptionGroup.use-case";
import SoftDeleteOptionGroup from "../../../application/use-cases/optionGroup/softDeleteOptionGroup.use-case";
import RestoreOptionGroup from "../../../application/use-cases/optionGroup/restoreOptionGroup.use-case";
import GetOptionGroupsBySystems from "../../../application/use-cases/optionGroup/getOptionGroupsBySystems.use-case";
import GetGroupOptionsByGroup from "../../../application/use-cases/groupOption/getGroupOptionsByGroup.use-case";
import CreateGroupOption from "../../../application/use-cases/groupOption/createGroupOption.use-case";
import UpdateGroupOption from "../../../application/use-cases/groupOption/updateGroupOption.use-case";
import SoftDeleteGroupOption from "../../../application/use-cases/groupOption/softDeleteGroupOption.use-case";
import RestoreGroupOption from "../../../application/use-cases/groupOption/restoreGroupOption.use-case";

export class OptionGroupController {
  constructor(
    private readonly getOptionGroupsBySystemsUseCase: GetOptionGroupsBySystems,
    private readonly createOptionGroupUseCase: CreateOptionGroup,
    private readonly updateOptionGroupUseCase: UpdateOptionGroup,
    private readonly softDeleteOptionGroupUseCase: SoftDeleteOptionGroup,
    private readonly restoreOptionGroupUseCase: RestoreOptionGroup,
    private readonly getGroupOptionsByGroupUseCase: GetGroupOptionsByGroup,
    private readonly createGroupOptionUseCase: CreateGroupOption,
    private readonly updateGroupOptionUseCase: UpdateGroupOption,
    private readonly softDeleteGroupOptionUseCase: SoftDeleteGroupOption,
    private readonly restoreGroupOptionUseCase: RestoreGroupOption
  ) {}

  getBySystems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ruleset } = req.query;
      let rulesets: string[] | undefined;
      if (typeof ruleset === "string") {
        rulesets = [ruleset];
      } else if (Array.isArray(ruleset)) {
        rulesets = ruleset as string[];
      }
      const data = await this.getOptionGroupsBySystemsUseCase.execute(rulesets);
      return res.status(200).json(data);
    } catch (e) {
      console.error("[OptionGroupController.getBySystems] Error:", e);
      next(e);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.createOptionGroupUseCase.execute(req.body, req.user!);
      return res.status(201).json(data);
    } catch (e) {
      console.error("[OptionGroupController.create] Error:", e);
      next(e);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) throw new ValidationError("El ID del grupo de opciones es obligatorio");
      const data = await this.updateOptionGroupUseCase.execute({ id, ...req.body }, req.user!);
      return res.status(200).json(data);
    } catch (e) {
      console.error("[OptionGroupController.update] Error:", e);
      next(e);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) throw new ValidationError("El ID del grupo de opciones es obligatorio");
      await this.softDeleteOptionGroupUseCase.execute(id, req.user!);
      return res.status(204).send();
    } catch (e) {
      console.error("[OptionGroupController.delete] Error:", e);
      next(e);
    }
  };

  restore = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) throw new ValidationError("El ID del grupo de opciones es obligatorio");
      await this.restoreOptionGroupUseCase.execute(id, req.user!);
      return res.status(200).json({ message: "Grupo de opciones restaurado con éxito" });
    } catch (e) {
      console.error("[OptionGroupController.restore] Error:", e);
      next(e);
    }
  };

  getOptions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const groupId = requiredPathId(req.params.groupId, "El ID del grupo de opciones es obligatorio");
      const { ruleset } = req.query;
      let rulesets: string[] | undefined;
      if (typeof ruleset === "string") {
        rulesets = [ruleset];
      } else if (Array.isArray(ruleset)) {
        rulesets = ruleset as string[];
      }
      const data = await this.getGroupOptionsByGroupUseCase.execute(groupId, rulesets);
      return res.status(200).json(data);
    } catch (e) {
      console.error("[OptionGroupController.getOptions] Error:", e);
      next(e);
    }
  };

  createOption = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.createGroupOptionUseCase.execute(req.body, req.user!);
      return res.status(201).json(data);
    } catch (e) {
      console.error("[OptionGroupController.createOption] Error:", e);
      next(e);
    }
  };

  updateOption = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) throw new ValidationError("El ID de la opción es obligatorio");
      const data = await this.updateGroupOptionUseCase.execute({ id, ...req.body }, req.user!);
      return res.status(200).json(data);
    } catch (e) {
      console.error("[OptionGroupController.updateOption] Error:", e);
      next(e);
    }
  };

  deleteOption = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) throw new ValidationError("El ID de la opción es obligatorio");
      await this.softDeleteGroupOptionUseCase.execute(id, req.user!);
      return res.status(204).send();
    } catch (e) {
      console.error("[OptionGroupController.deleteOption] Error:", e);
      next(e);
    }
  };

  restoreOption = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) throw new ValidationError("El ID de la opción es obligatorio");
      await this.restoreGroupOptionUseCase.execute(id, req.user!);
      return res.status(200).json({ message: "Opción restaurada con éxito" });
    } catch (e) {
      console.error("[OptionGroupController.restoreOption] Error:", e);
      next(e);
    }
  };
}
