import SystemService from "../../../domain/services/system.service";
import { collectTraitRestKeys, restKeysRejection } from "../../../domain/services/restRules";
import { AppError } from "../../../domain/errors/AppError";

export async function assertTraitRestKeys(
  trait: {
    action?: { recharge?: string | null } | null;
    spellPrivileges?: Array<{ freeCast?: { recharge?: string | null } | null }> | null;
    innateSpells?: { grants?: Array<{ recharge?: string | null }> } | null;
    damageChoices?: Array<{ replaceOn?: string }> | null;
  },
  ruleset: string,
  systemService: SystemService
): Promise<void> {
  const keys = collectTraitRestKeys(trait);
  if (keys.length === 0) return;

  const config = await systemService.getMergedRulesConfig([ruleset]);
  const error = restKeysRejection(keys, config.restRules);
  if (error) {
    throw new AppError(error, 400);
  }
}
