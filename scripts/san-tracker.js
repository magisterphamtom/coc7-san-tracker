/**
 * CoC7 – Suivi de Santé Mentale du groupe
 * Ajoute un bouton dans les contrôles de scène (barre gauche) qui ouvre
 * une fenêtre listant la Santé Mentale de tous les investigateurs joueurs,
 * regroupés par époque (1933 / 2025-2026), avec repérage du seuil de
 * folie indéfinie et de l'investigateur le plus fragile.
 */

const MODULE_ID = "coc7-san-tracker";

/* L'affectation d'époque est stockée sous le namespace du module Chance
 * afin que les deux modules compagnons partagent la même configuration
 * (pas besoin de ressaisir 1933 / 2025-2026 deux fois). Fonctionne même
 * si ce module Chance n'est pas installé. */
const ERA_FLAG_MODULE = "coc7-luck-tracker";
const ERA_FLAG_KEY = "era";

const ERA_DEFS = [
  { key: "1933", label: "COC7SAN.Era1933", sub: "MCMXXXIII" },
  { key: "modern", label: "COC7SAN.EraModern", sub: "MMXXV \u2013 MMXXVI" },
  { key: "unassigned", label: "COC7SAN.EraUnassigned", sub: null }
];

/* ------------------------------------------------------------------ */
/*  Lecture de la Santé Mentale sur une fiche d'acteur                 */
/* ------------------------------------------------------------------ */
function getSanValue(actor) {
  const sys = actor?.system ?? {};
  const candidates = [
    sys?.attribs?.san?.value,
    sys?.attribs?.sanity?.value,
    sys?.characteristics?.san?.value
  ];
  const value = candidates.find((v) => typeof v === "number" && !Number.isNaN(v));
  return typeof value === "number" ? value : null;
}

function getSanMax(actor) {
  const sys = actor?.system ?? {};
  const candidates = [
    sys?.attribs?.san?.max,
    sys?.attribs?.sanity?.max,
    sys?.characteristics?.san?.max
  ];
  const value = candidates.find((v) => typeof v === "number" && !Number.isNaN(v));
  return typeof value === "number" ? value : null;
}

/**
 * Récupère les personnages joueurs (type "character" possédé par un joueur),
 * avec leur époque assignée (flag partagée, "unassigned" par défaut).
 */
function getTrackedActors() {
  return game.actors
    .filter((docActor) => docActor.type === "character" && docActor.hasPlayerOwner)
    .map((docActor) => {
      const san = getSanValue(docActor);
      const max = getSanMax(docActor);
      const era = docActor.getFlag(ERA_FLAG_MODULE, ERA_FLAG_KEY) ?? "unassigned";
      const breakpoint = typeof max === "number" ? Math.floor(max / 5) : null;
      const isCritical = san !== null && breakpoint !== null && san <= breakpoint;

      return {
        id: docActor.id,
        name: docActor.name,
        img: docActor.img || "icons/svg/mystery-man.svg",
        san,
        max,
        sanDisplay: san === null ? "—" : String(san),
        maxDisplay: max === null ? "—" : String(max),
        isCritical,
        era: ERA_DEFS.some((d) => d.key === era) ? era : "unassigned"
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

/* ------------------------------------------------------------------ */
/*  Fenêtre d'affichage (ApplicationV2)                                */
/* ------------------------------------------------------------------ */
class SanTrackerApp extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  static DEFAULT_OPTIONS = {
    id: "coc7-san-tracker-app",
    tag: "div",
    window: {
      title: "COC7SAN.WindowTitle",
      icon: "fa-solid fa-brain",
      resizable: true
    },
    position: { width: 400, height: "auto" },
    actions: {
      refresh: SanTrackerApp.onRefresh
    }
  };

  static PARTS = {
    content: { template: `modules/${MODULE_ID}/templates/san-tracker.hbs` }
  };

  /** @override */
  async _prepareContext(_options) {
    const rawActors = getTrackedActors();

    const groupsMap = new Map(ERA_DEFS.map((d) => [d.key, []]));
    for (const a of rawActors) {
      groupsMap.get(a.era).push(a);
    }

    const groups = ERA_DEFS.map((def) => {
      const actors = groupsMap.get(def.key) ?? [];
      const numeric = actors.map((a) => a.san).filter((v) => typeof v === "number");
      const lowest = numeric.length ? Math.min(...numeric) : null;

      return {
        key: def.key,
        cssKey: `era-${def.key}`,
        label: def.label,
        sub: def.sub,
        lowestDisplay: lowest === null ? "—" : String(lowest),
        actors: actors.map((a) => {
          const isLowest = a.san !== null && a.san === lowest;
          let rowClass = "";
          if (a.isCritical) rowClass = "coc7-san-critical";
          else if (isLowest) rowClass = "coc7-san-lowest";
          return {
            ...a,
            isLowest,
            rowClass,
            eraOptions: ERA_DEFS.map((d) => ({
              key: d.key,
              label: d.label,
              selected: d.key === a.era
            }))
          };
        })
      };
    }).filter((g) => g.actors.length > 0);

    return {
      groups,
      hasActors: rawActors.length > 0
    };
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    this.element.querySelectorAll(".coc7-era-select").forEach((select) => {
      select.addEventListener("change", async (event) => {
        const target = event.currentTarget;
        const actorId = target.dataset.actorId;
        const era = target.value;
        const docActor = game.actors.get(actorId);
        if (!docActor) return;
        if (era === "unassigned") await docActor.unsetFlag(ERA_FLAG_MODULE, ERA_FLAG_KEY);
        else await docActor.setFlag(ERA_FLAG_MODULE, ERA_FLAG_KEY, era);
        // Le hook updateActor rafraîchit automatiquement la fenêtre.
      });
    });
  }

  static onRefresh(_event, _target) {
    this.render();
  }
}

/* ------------------------------------------------------------------ */
/*  Instance unique + bascule ouverture/fermeture                      */
/* ------------------------------------------------------------------ */
let appInstance = null;

function toggleSanTracker() {
  if (appInstance?.rendered) {
    appInstance.close();
    return;
  }
  appInstance = new SanTrackerApp();
  appInstance.render({ force: true });
}

/* ------------------------------------------------------------------ */
/*  Rafraîchissement automatique quand une fiche change                */
/* ------------------------------------------------------------------ */
Hooks.on("updateActor", (actor) => {
  if (appInstance?.rendered && actor.type === "character") appInstance.render();
});
Hooks.on("createActor", (actor) => {
  if (appInstance?.rendered && actor.type === "character") appInstance.render();
});
Hooks.on("deleteActor", (actor) => {
  if (appInstance?.rendered && actor.type === "character") appInstance.render();
});

/* ------------------------------------------------------------------ */
/*  Bouton dans la barre de contrôles de scène (barre latérale gauche) */
/* ------------------------------------------------------------------ */
Hooks.on("getSceneControlButtons", (controls) => {
  const tokenControl = controls.tokens;
  if (!tokenControl?.tools) return;

  tokenControl.tools.sanTracker = {
    name: "sanTracker",
    title: "COC7SAN.ButtonTitle",
    icon: "fa-solid fa-brain",
    order: Object.keys(tokenControl.tools).length,
    button: true,
    visible: game.user.isGM,
    onChange: () => toggleSanTracker()
  };
});
