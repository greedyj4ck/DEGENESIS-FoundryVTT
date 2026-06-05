import { DegenesisChat } from "./chat.js";
import { AutomateAttackDefenseFlow, AutomateAttackRangeCheck } from "./settings.js";
import { appendIntrinsicMeleeWeaponsForParry } from "./intrinsic-melee-weapons.js";

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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getItemReach(item) {
  if (!item) return 0;
  const d = item.distance ?? {};
  if (item.isRanged) {
    return Math.max(parseNumeric(d.short), parseNumeric(d.far), parseNumeric(d.extreme));
  }
  return Math.max(1, parseNumeric(d.short, 1));
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

function getEquippedParryWeapons(actor) {
  if (!actor) return [];
  // Attack items (notably LUTTE/BRAWL) often do not use an "equipped" flag.
  // Keep them eligible for parry selection, while still requiring equipped=true for regular weapons.
  const base = actor.items.filter((i) => {
    if (!["weapon", "attack"].includes(i.type)) return false;
    if (i.type === "weapon" && !Boolean(i?.equipped)) return false;
    if (i.isRanged) return false;
    const defenseDice = i?.dice?.defense ?? i?.system?.dice?.defense ?? 0;
    const group = String(i?.system?.group ?? "").toLowerCase();
    const isBrawlGroup = group === "lutte" || group === "brawl";
    return defenseDice > 0 || isBrawlGroup || i.name.toLowerCase().includes("poing");
  });
  return appendIntrinsicMeleeWeaponsForParry(actor, base);
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

function getDamageTypeLabel(damageType) {
  const type = String(damageType || "fleshwounds");
  if (type === "ego") return game.i18n.localize("DGNS.AutoDamageTypeEgo");
  if (type === "trauma") return game.i18n.localize("DGNS.AutoDamageTypeTrauma");
  return game.i18n.localize("DGNS.AutoDamageTypeFleshwounds");
}

async function promptDefenseChoice(attackerTokenName, weaponName, { allowParry = true } = {}) {
  const content = `
  <p>${game.i18n.format("DGNS.AutoDefensePrompt", { attackerTokenName, weaponName })}</p>
  <p>${game.i18n.localize("DGNS.AutoDefensePromptSub")}</p>
  `;
  return new Promise((resolve) => {
    const buttons = {
      dodge: { label: game.i18n.localize("DGNS.AutoDefenseDodge"), callback: () => resolve("dodge") },
      none: { label: game.i18n.localize("DGNS.AutoDefenseNone"), callback: () => resolve("none") },
    };
    if (allowParry) {
      buttons.parry = { label: game.i18n.localize("DGNS.AutoDefenseParry"), callback: () => resolve("parry") };
    }
    new Dialog({
      title: game.i18n.localize("DGNS.AutoDefenseChoiceTitle"),
      content,
      buttons,
      default: "dodge",
      close: () => resolve("none"),
    }).render(true);
  });
}

async function promptParryWeapon(options) {
  if (!options.length) return null;
  const choices = options
    .map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`)
    .join("");
  return new Promise((resolve) => {
    new Dialog({
      title: game.i18n.localize("DGNS.AutoParryWeaponTitle"),
      content: `<p>${game.i18n.localize("DGNS.AutoParryWeaponPrompt")}</p><select name="parry-weapon">${choices}</select>`,
      buttons: {
        confirm: {
          label: game.i18n.localize("DGNS.AutoConfirm"),
          callback: (html) => resolve(html.find('[name="parry-weapon"]').val() || null),
        },
        cancel: { label: game.i18n.localize("DGNS.AutoCancel"), callback: () => resolve(null) },
      },
      default: "confirm",
      close: () => resolve(null),
    }).render(true);
  });
}

async function promptCounterAttack() {
  return new Promise((resolve) => {
    new Dialog({
      title: game.i18n.localize("DGNS.AutoCounterTitle"),
      content: `<p>${game.i18n.localize("DGNS.AutoCounterPrompt")}</p>`,
      buttons: {
        yes: { label: game.i18n.localize("DGNS.AutoYes"), callback: () => resolve(true) },
        no: { label: game.i18n.localize("DGNS.AutoNo"), callback: () => resolve(false) },
      },
      default: "yes",
      close: () => resolve(false),
    }).render(true);
  });
}

async function renderResolutionCard(payload) {
  const html = await renderTemplate(
    "systems/degenesis/templates/chat/auto-combat-card.html",
    payload
  );
  const chatData = {
    user: game.user.id,
    speaker: ChatMessage.getSpeaker({ actor: payload.attackerActor }),
    content: html,
    flags: {
      degenesis: {
        autoCombatDamage: {
          targetActorId: payload.targetActor.id,
          targetTokenId: payload.targetToken.id,
          attackerActorId: payload.attackerActor.id,
          weaponItemId: payload.weapon?.id ?? null,
          weaponType: isFirearm(payload.weapon) ? "firearm" : "other",
          damageType: payload.weapon?.damageType ?? "fleshwounds",
          rawDamage: payload.damage,
        },
      },
    },
  };
  await ChatMessage.create(chatData);
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
    },
  });
  if (!rolled) return { handled: true };

  const { rollResults: attackRollResults, cardData: attackCardData } = rolled;
  const attackSuccessesRaw = Number(attackRollResults?.successes ?? 0);
  const attackPassedPassiveDefense =
    passiveDefenseDifficulty <= 0 || attackSuccessesRaw >= passiveDefenseDifficulty;
  if (!attackCardData.alreadyRendered) {
    DegenesisChat.renderRollCard(attackRollResults, attackCardData);
  }
  const parryOptions = getEquippedParryWeapons(targetActor).filter(
    (w) => getItemReach(w) >= distanceToTarget
  );
  const allowParry = parryOptions.length > 0;

  const targetOwnerActive = game.users.find((u) => u.active && !u.isGM && targetActor.testUserPermission(u, "OWNER"));
  const defenderOnline = Boolean(targetOwnerActive);
  const currentCanActForDefense = game.user.isGM || targetActor.isOwner;
  if (defenderOnline && !targetActor.isOwner) {
    return { handled: true };
  }
  if (!defenderOnline && !game.user.isGM) {
    return { handled: true };
  }

  let defenseChoice = "none";
  if (!defenderOnline && game.user.isGM) {
    defenseChoice = await promptDefenseChoice(attackerToken.name, item.name, { allowParry });
  } else if (currentCanActForDefense) {
    defenseChoice = await promptDefenseChoice(attackerToken.name, item.name, { allowParry });
  }
  let defenseResult = null;
  let defenseSucceeded = false;
  let defenseMode = defenseChoice;
  let parryWeapon = null;

  if (defenseChoice === "dodge") {
    const dodge = await targetActor.rollFightRoll("dodge", {
      skipDialog: false,
      spentEgo: 0,
      override: {
        contextNote: game.i18n.localize("DGNS.AutoDefenseDodgeContext"),
        prefilled: { difficulty: attackSuccessesRaw },
      },
    });
    defenseResult = dodge?.rollResults ?? null;
    defenseSucceeded = defenseResult?.result === "success";
    if (dodge?.cardData && !dodge.cardData.alreadyRendered) DegenesisChat.renderRollCard(dodge.rollResults, dodge.cardData);
  } else if (defenseChoice === "parry") {
    const selectedId = await promptParryWeapon(parryOptions);
    parryWeapon = parryOptions.find((w) => w.id === selectedId) ?? null;
    if (!parryWeapon) {
      defenseMode = "none";
    } else {
      const defenderReach = getItemReach(parryWeapon);
      const parryValid = defenderReach >= distanceToTarget;
      if (!parryValid) {
        ui.notifications.warn(game.i18n.localize("DGNS.AutoParryInvalidRange"));
        defenseMode = "none";
      } else {
        const parryRoll = await targetActor.rollWeapon(parryWeapon, {
          use: "defense",
          skipDialog: false,
          override: {
            contextNote: game.i18n.localize("DGNS.AutoDefenseParryContext"),
            prefilled: { difficulty: attackSuccessesRaw },
          },
        });
        defenseResult = parryRoll?.rollResults ?? null;
        defenseSucceeded = defenseResult?.result === "success";
        if (parryRoll?.cardData && !parryRoll.cardData.alreadyRendered) DegenesisChat.renderRollCard(parryRoll.rollResults, parryRoll.cardData);
      }
    }
  }

  const attackSuccesses = attackSuccessesRaw;
  const defenseSuccesses = Number(defenseResult?.successes ?? 0);
  const hits = attackPassedPassiveDefense && attackSuccesses > defenseSuccesses;
  const triggerDamageBonus = Number(attackRollResults?.triggers ?? 0);
  const baseDamage = Number(item.fullDamage(0, { modifier: actor.modifiers.damage })) || 0;
  const totalDamage = hits ? Math.max(0, baseDamage + triggerDamageBonus) : 0;
  const missReasons = [];
  if (!hits) {
    if (!attackPassedPassiveDefense) missReasons.push(game.i18n.localize("DGNS.AutoMissReasonPassive"));
    if (defenseSuccesses >= attackSuccesses) missReasons.push(game.i18n.localize("DGNS.AutoMissReasonDefense"));
  }

  await renderResolutionCard({
    attackerActor: actor,
    targetActor,
    targetToken,
    weapon: item,
    attackSuccesses,
    defenseSuccesses,
    defenseIsActive: defenseMode !== "none",
    passiveDefenseDifficulty,
    defenseMode: game.i18n.localize(
      defenseMode === "dodge"
        ? "DGNS.AutoDefenseDodge"
        : defenseMode === "parry"
        ? "DGNS.AutoDefenseParry"
        : "DGNS.AutoDefenseNone"
    ),
    damage: totalDamage,
    damageTypeLabel: getDamageTypeLabel(item?.damageType),
    triggerDamageBonus,
    didHit: hits,
    passiveSucceeded: attackPassedPassiveDefense,
    missReason: missReasons.join(" | "),
  });

  if (
    defenseMode === "parry" &&
    defenseSucceeded &&
    Number(defenseResult?.triggers ?? 0) >= 3 &&
    parryWeapon
  ) {
    const doCounter = await promptCounterAttack();
    if (doCounter) {
      const counterDamage = Math.max(
        0,
        Number(parryWeapon.fullDamage(0, { modifier: targetActor.modifiers.damage })) +
          Number(defenseResult.triggers ?? 0)
      );
      const counterHtml = `<h2>${game.i18n.localize("DGNS.AutoCounterTitle")}</h2>
      <p>${game.i18n.format("DGNS.AutoCounterDamageLine", { damage: counterDamage, weaponName: parryWeapon.name })}</p>
      <button type="button" class="degenesis-apply-damage-button">${game.i18n.localize(
        "DGNS.AutoApplyDamageButton"
      )}</button>`;
      await ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor: targetActor }),
        content: counterHtml,
        flags: {
          degenesis: {
            autoCombatDamage: {
              // Counter-attack targets the original attacker.
              targetActorId: actor.id,
              targetTokenId: attackerToken.id,
              attackerActorId: targetActor.id,
              weaponItemId: parryWeapon.id,
              weaponType: isFirearm(parryWeapon) ? "firearm" : "other",
              damageType: parryWeapon.damageType ?? "fleshwounds",
              rawDamage: counterDamage,
            },
          },
        },
      });
    }
  }

  return { handled: true };
}

export async function applyAutomatedDamageFromMessage(message) {
  const payload = message?.flags?.degenesis?.autoCombatDamage;
  if (!payload) return;
  if (!game.user.isGM) return;

  const targetActor = game.actors.get(payload.targetActorId);
  if (!targetActor) return;
  const rawDamage = Number(payload.rawDamage ?? 0);

  let mitigatedDamage = rawDamage;
  const armorItems = targetActor.items.filter((i) => i.type === "armor" && i.equipped);
  if (armorItems.length) {
    const confirmed = await Dialog.confirm({
      title: game.i18n.localize("DGNS.AutoArmorPromptTitle"),
      content: `<p>${game.i18n.localize("DGNS.AutoArmorPromptContent")}</p>`,
      yes: () => true,
      no: () => false,
      defaultYes: true,
    });
    if (confirmed) {
      const attackerActor = game.actors.get(payload.attackerActorId);
      const weapon = payload.weaponItemId ? attackerActor?.items?.get(payload.weaponItemId) : null;
      const reduction = getArmorMitigation(targetActor, weapon ?? { isRanged: payload.weaponType === "firearm" });
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
