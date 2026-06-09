import { DegenesisChat } from "./chat.js";
import { AutomateAttackDefenseFlow, AutomateAttackRangeCheck } from "./settings.js";

function getSingleTargetToken() {
  const targets = Array.from(game.user?.targets ?? []);
  if (targets.length !== 1) return null;
  return targets[0];
}

function getActorActiveToken(actor) {
  if (!actor) return null;
  const activeTokens = actor.getActiveTokens(true) ?? [];
  return activeTokens.find((t) => t.controlled) ?? activeTokens[0] ?? null;
}

function getDistanceMeters(tokenA, tokenB) {
  if (!tokenA || !tokenB) return Number.POSITIVE_INFINITY;
  // v14+: use canvas.grid.measurePath; v12: use canvas.grid.measureDistances
  if (typeof canvas.grid.measurePath === "function") {
    const result = canvas.grid.measurePath([tokenA.center, tokenB.center]);
    return Number(result?.distance ?? Number.POSITIVE_INFINITY);
  } else if (typeof canvas.grid.measureDistances === "function") {
    const ray = new Ray(tokenA.center, tokenB.center);
    const distances = canvas.grid.measureDistances([{ ray }], { gridSpaces: true });
    return Number(distances?.[0] ?? Number.POSITIVE_INFINITY);
  }
  return Number.POSITIVE_INFINITY;
}

function parseNumeric(value, fallback = 0) {
  const n = Number.parseFloat(String(value ?? "").trim());
  return Number.isFinite(n) ? n : fallback;
}

function getAttackAllowedRange(item, use) {
  if (!item) return Number.POSITIVE_INFINITY;
  const d = item.distance ?? {};

  if (use === "attack-short") return parseNumeric(d.short, Number.POSITIVE_INFINITY);
  if (use === "attack-far") return parseNumeric(d.far, Number.POSITIVE_INFINITY);
  if (use === "attack-extreme") return parseNumeric(d.extreme, Number.POSITIVE_INFINITY);

  // Default attack mode: use close/short band for melee and generic attacks.
  return item.isMelee ? Math.max(1, parseNumeric(d.short, 1)) : parseNumeric(d.short, Number.POSITIVE_INFINITY);
}

function isFirearm(item) {
  return Boolean(item?.isRanged && !item?.isSonic);
}

function getArmorMitigation(actor, weaponUsed) {
  if (!actor) return 0;
  const equippedArmor = actor.items.filter((i) => i.type === "armor" && i.equipped);
  if (!equippedArmor.length) return 0;
  const qualityName = isFirearm(weaponUsed) ? "bulletproof" : "massive";

  let bestQualityMitigation = 0;
  let bestApMitigation = 0;
  for (const armor of equippedArmor) {
    // Fallback for armors that store mitigation as AP instead of quality values.
    bestApMitigation = Math.max(bestApMitigation, Number(armor.AP ?? armor.system?.AP ?? 0) || 0);

    for (const q of armor.system?.qualities ?? []) {
      if (q?.name !== qualityName) continue;
      for (const v of q?.values ?? []) {
        bestQualityMitigation = Math.max(bestQualityMitigation, parseNumeric(v?.value));
      }
    }
  }
  return Math.max(bestQualityMitigation, bestApMitigation);
}

function splitDamage(actor, amount) {
  const incoming = Math.max(0, Number(amount) || 0);
  const flesh = Number(actor.system.condition.fleshwounds.value) || 0;
  const fleshMax = Number(actor.system.condition.fleshwounds.max) || flesh;
  const trauma = Number(actor.system.condition.trauma.value) || 0;
  const traumaMax = Number(actor.system.condition.trauma.max) || trauma;

  const fleshSpace = Math.max(0, fleshMax - flesh);
  const appliedToFlesh = Math.min(incoming, fleshSpace);
  const overflow = Math.max(0, incoming - appliedToFlesh);

  const traumaSpace = Math.max(0, traumaMax - trauma);
  const appliedToTrauma = Math.min(overflow, traumaSpace);

  const fleshAfter = flesh + appliedToFlesh;
  const traumaAfter = trauma + appliedToTrauma;

  return {
    fleshAfter,
    traumaAfter,
    absorbedByFlesh: appliedToFlesh,
    appliedToTrauma,
  };
}

function applyDamageByType(actor, amount, damageType) {
  const incoming = Math.max(0, Number(amount) || 0);
  const type = String(damageType || "fleshwounds");

  if (type === "ego") {
    const ego = Number(actor.system.condition.ego.value) || 0;
    const egoMax = Number(actor.system.condition.ego.max) || ego;
    return {
      updates: {
        "system.condition.ego.value": Math.min(egoMax, ego + incoming),
      },
      applied: incoming,
    };
  }

  if (type === "trauma") {
    const trauma = Number(actor.system.condition.trauma.value) || 0;
    const traumaMax = Number(actor.system.condition.trauma.max) || trauma;
    return {
      updates: {
        "system.condition.trauma.value": Math.min(traumaMax, trauma + incoming),
      },
      applied: incoming,
    };
  }

  const split = splitDamage(actor, incoming);
  return {
    updates: {
      "system.condition.fleshwounds.value": split.fleshAfter,
      "system.condition.trauma.value": split.traumaAfter,
    },
    applied: incoming,
  };
}

export async function runAutomatedAttackFlow({
  actor,
  item,
  use,
  skipDialog,
  attackRollMethod,
}) {
  if (!AutomateAttackDefenseFlow()) return { handled: false };
  const targetToken = getSingleTargetToken();
  if (!targetToken) return { handled: false };

  const attackerToken = getActorActiveToken(actor);
  if (!attackerToken) return { handled: false };

  const targetActor = targetToken.actor;
  if (!targetActor) return { handled: false };
  const distanceToTarget = getDistanceMeters(attackerToken, targetToken);
  const allowedAttackRange = getAttackAllowedRange(item, use);
  if (AutomateAttackRangeCheck() && distanceToTarget > allowedAttackRange) {
    ui.notifications.warn(
      game.i18n.format("DGNS.AutoOutOfRange", {
        distance: Math.round(distanceToTarget * 10) / 10,
        maxRange: Math.round(allowedAttackRange * 10) / 10,
      })
    );
    return { handled: true };
  }

  const attackContext = game.i18n.format("DGNS.AutoAttackContext", {
    targetName: targetToken.name,
    weaponName: item.name,
  });
  const passiveDefenseDifficulty = Math.max(
    0,
    Number(
      targetActor?.fighting?.passiveDefense ??
        targetActor?.system?.fighting?.passiveDefense ??
        targetActor?.fighting?.p_defense ??
        targetActor?.system?.fighting?.p_defense ??
        0
    ) || 0
  );

  const rolled = await attackRollMethod(item, {
    use,
    skipDialog,
    override: {
      contextNote: attackContext,
      prefilled: {
        difficulty: passiveDefenseDifficulty,
      },
      deferRender: true,
    },
  });
  if (!rolled) return { handled: true };

  const { rollResults: attackRollResults, cardData: attackCardData } = rolled;
  const attackSuccessesRaw = Number(attackRollResults?.successes ?? 0);
  const attackPassedPassiveDefense =
    passiveDefenseDifficulty <= 0 || attackSuccessesRaw >= passiveDefenseDifficulty;

  const hits = attackPassedPassiveDefense;
  const triggerDamageBonus = Number(attackRollResults?.triggers ?? 0);
  const baseDamage = Number(item.fullDamage(0, { modifier: actor.modifiers.damage })) || 0;
  const totalDamage = hits ? Math.max(0, baseDamage + triggerDamageBonus) : 0;

  attackCardData.autoCombatData = {
    didHit: hits,
    totalDamage,
    triggerDamageBonus,
  };

  const extraFlags = hits ? {
    degenesis: {
      autoCombatDamage: {
        targetActorId: targetActor.id,
        targetTokenId: targetToken.id,
        attackerActorId: actor.id,
        weaponItemId: item?.id ?? null,
        weaponType: isFirearm(item) ? "firearm" : "other",
        damageType: item?.damageType ?? "fleshwounds",
        rawDamage: totalDamage,
      },
    },
  } : {};

  await DegenesisChat.renderRollCard(attackRollResults, attackCardData, extraFlags);

  return { handled: true };
}

export async function applyAutomatedDamageFromMessage(message) {
  const payload = message?.flags?.degenesis?.autoCombatDamage;
  if (!payload) return;
  if (!game.user.isGM) return;

  const token = canvas.tokens?.get(payload.targetTokenId);
  const targetActor = token?.actor ?? game.actors.get(payload.targetActorId);
  if (!targetActor) return;
  const rawDamage = Number(payload.rawDamage ?? 0);

  let mitigatedDamage = rawDamage;
  const armorItems = targetActor.items.filter((i) => i.type === "armor" && i.equipped);
  const npcArmorRating = Number(targetActor.system?.armor?.rating ?? 0) || 0;

  if (armorItems.length || npcArmorRating > 0) {
    const confirmed = await Dialog.confirm({
      title: game.i18n.localize("DGNS.AutoArmorPromptTitle"),
      content: `<p>${game.i18n.localize("DGNS.AutoArmorPromptContent")}</p>`,
      yes: () => true,
      no: () => false,
      defaultYes: true,
    });
    if (confirmed) {
      let reduction;
      if (armorItems.length) {
        const attackerActor = game.actors.get(payload.attackerActorId);
        const weapon = payload.weaponItemId ? attackerActor?.items?.get(payload.weaponItemId) : null;
        reduction = getArmorMitigation(targetActor, weapon ?? { isRanged: payload.weaponType === "firearm" });
      } else {
        reduction = npcArmorRating;
      }
      mitigatedDamage = Math.max(0, rawDamage - reduction);
    }
  }

  const applied = applyDamageByType(targetActor, mitigatedDamage, payload.damageType);
  await targetActor.update(applied.updates);

  ui.notifications.info(
    game.i18n.format("DGNS.AutoDamageApplied", {
      damage: mitigatedDamage,
      actorName: targetActor.name,
    })
  );
}
