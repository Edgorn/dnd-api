import SystemService from "../../../domain/services/system.service";
import { collectConditionRestKeys, restKeysRejection } from "../../../domain/services/restRules";
import { AppError } from "../../../domain/errors/AppError";
import { ConditionRecovery } from "../../../domain/types/condition.types";

export async function assertConditionRestKeys(
  recovery: ConditionRecovery[] | undefined,
  ruleset: string,
  systemService: SystemService
): Promise<void> {
  const keys = collectConditionRestKeys({ recovery });
  if (keys.length === 0) return;

  const config = await systemService.getMergedRulesConfig([ruleset]);
  const error = restKeysRejection(keys, config.restRules);
  if (error) {
    throw new AppError(error, 400);
  }
}
