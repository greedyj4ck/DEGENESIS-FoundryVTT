import { isLogsEnabled } from "./chat.js";

// Store previous system values before update
const previousSystemData = new Map();

const getPathValue = (obj, path) => {
  return path.split(".").reduce((val, key) => val?.[key], obj);
};

const getChangedPaths = (changed) => {
  const paths = [];

  const walk = (obj, prefix = "") => {
    for (const key in obj) {
      const newPrefix = prefix ? `${prefix}.${key}` : key;
      if (obj[key] !== null && typeof obj[key] === "object" && !Array.isArray(obj[key])) {
        walk(obj[key], newPrefix);
      } else {
        paths.push(newPrefix);
      }
    }
  };

  walk(changed);
  return paths;
};

const formatValue = (value) => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const sendLogMessage = async (actor, changes) => {
  if (!game.user.isGM) return;

  const now = new Date().toLocaleString();
  const userName = game.user.name;
  const actorName = actor.name;

  let logContent = `<strong>${now}</strong> | <strong>${userName}</strong> modified <strong>${actorName}</strong>:\n<hr/>`;

  const lines = [];

  for (const { path, oldValue, newValue, category } of changes) {
    lines.push(`<strong>${category}</strong> - <em>${path}</em>: <code>${formatValue(oldValue)}</code> → <code>${formatValue(newValue)}</code>`);
  }

  logContent += lines.join("<br/>");

  await ChatMessage.create({
    content: logContent,
    flags: {
      degenesis: {
        isSystemLog: true,
      },
    },
    blind: true,
  });
};

export default function () {
  // Capture system data BEFORE update
  Hooks.on("preUpdateActor", (actor, changed, options, userId) => {
    if (isLogsEnabled()) {
      previousSystemData.set(actor.id, foundry.utils.deepClone(actor.system));
    }
  });

  const motionIdCandidates = [
    "running",
    "rush",
    "inMotion",
    "in-motion",
    "se-precipite",
  ];
  const motionLabelMatchers = [
    "se precipite",
    "se précipite",
    "in motion",
    "in bewegung",
    "en movimiento",
    "in movimento",
    "rush",
    "running",
    "sprint",
  ];

  const normalize = (v) =>
    String(v ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const getMotionStatusEffect = () => {
    const effects = CONFIG.statusEffects ?? [];
    for (const e of effects) {
      const id = normalize(e.id);
      if (motionIdCandidates.includes(id)) return e;
    }
    for (const e of effects) {
      const label = normalize(game.i18n.localize(e.name ?? e.label ?? ""));
      if (motionLabelMatchers.some((m) => label.includes(normalize(m)))) return e;
    }
    return null;
  };

  const tokenHasStatus = (tokenDoc, statusId) => {
    if (!tokenDoc || !statusId) return false;
    if (typeof tokenDoc.hasStatusEffect === "function") {
      return tokenDoc.hasStatusEffect(statusId);
    }
    if (tokenDoc.statuses instanceof Set) return tokenDoc.statuses.has(statusId);
    return false;
  };

  const setTokenMotionStatus = async (token, status, desired) => {
    const doc = token?.document ?? token;

    // Foundry API variants: prefer placeable token toggleEffect when available.
    if (typeof token?.toggleEffect === "function") {
      await token.toggleEffect(status, { active: desired, overlay: false });
      return;
    }

    if (typeof doc?.toggleStatusEffect === "function") {
      await doc.toggleStatusEffect(status, { active: desired, overlay: false });
      return;
    }

    if (typeof doc?.toggleActiveEffect === "function") {
      await doc.toggleActiveEffect(status, { active: desired, overlay: false });
      return;
    }
  };

  Hooks.on("combatRound", function () {
    const encounter = game.combats.combats.find((e) => e.active === true);

    encounter.combatants.forEach(function (combatant, index) {
      const itemIds = combatant.actor.items
        .filter((e) => e.name === "Spent Ego Bonus")
        .map(function (value, index) {
          return value._id;
        });

      combatant.actor.deleteEmbeddedDocuments("Item", itemIds);
    });
  });

  // Forward sync: actor.state.motion -> token status effect.
  Hooks.on("updateActor", async (actor, changed) => {
    // Handle logs if enabled
    if (isLogsEnabled()) {
      const changes = [];

      // Check if system changes exist
      if (Object.hasOwn(changed, "system") && changed.system) {
        const previousSystem = previousSystemData.get(actor.id) || actor.system;
        previousSystemData.delete(actor.id);

        const paths = getChangedPaths(changed.system);

        for (const path of paths) {
          const newValue = getPathValue(actor.system, path);
          const oldValue = getPathValue(previousSystem, path);

          // Skip if no actual change
          if (JSON.stringify(oldValue) === JSON.stringify(newValue)) continue;

          let category = "Other";
          if (path.startsWith("attributes.")) category = "Attribute";
          else if (path.startsWith("skills.")) category = "Skill";
          else if (path.startsWith("condition.")) category = "Condition";
          else if (path.startsWith("modifiers.")) category = "Modifier";

          changes.push({
            path,
            oldValue,
            newValue,
            category,
          });
        }
      }

      if (changes.length > 0) {
        await sendLogMessage(actor, changes);
      }
    }

    const hasMotionChange = Object.hasOwn(changed, "system") && changed.system?.state?.motion !== undefined;
    if (!hasMotionChange) return;
    const status = getMotionStatusEffect();
    if (!status?.id) return;

    const desired = Boolean(actor.system?.state?.motion);
    const tokens = actor.getActiveTokens(true) ?? [];
    for (const token of tokens) {
      const doc = token.document ?? token;
      const currently = tokenHasStatus(doc, status.id);
      if (currently === desired) continue;
      await setTokenMotionStatus(token, status, desired);
    }
  });

  // Reverse sync: token status effect -> actor.state.motion.
  Hooks.on("updateToken", async (tokenDoc, changed) => {
    if (!tokenDoc?.actor) return;
    // Avoid unnecessary work when token update is unrelated.
    if (!("effects" in changed) && !("statuses" in changed) && !("_source" in changed)) return;

    const status = getMotionStatusEffect();
    if (!status?.id) return;

    const hasStatus = tokenHasStatus(tokenDoc, status.id);
    const actorMotion = Boolean(tokenDoc.actor.system?.state?.motion);
    if (hasStatus === actorMotion) return;

    await tokenDoc.actor.update({
      "system.state.motion": hasStatus,
    });
  });
}
