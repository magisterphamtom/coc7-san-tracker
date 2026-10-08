# CoC7 – Suivi de Santé Mentale du groupe

Module compagnon de **CoC7 – Suivi de Chance du groupe**, même style Art
Déco, pour Foundry VTT (V13/V14) + système **CoC7**.

## Ce qu'il fait

Ajoute un bouton (icône cerveau 🧠) dans la barre de contrôles à gauche
de l'écran, dans le groupe **Jeton**. Un clic ouvre/ferme une fenêtre qui
liste tous les personnages joueurs avec leur **Santé Mentale**
(actuelle / maximum), regroupés par époque (1933 / 2025-2026).

Deux repères visuels automatiques :

- **Losange doré** : l'investigateur avec la Santé Mentale la plus basse
  du groupe (dans son époque).
- **Crâne cramoisi** : l'investigateur a atteint le **seuil de folie
  indéfinie** (SAN actuelle ≤ 1/5 de sa SAN maximum, règle p. 165 du
  Manuel du Gardien). Cet indicateur prend le pas sur le losange doré.

La fenêtre se rafraîchit automatiquement dès qu'une fiche change.

## Affectation d'époque partagée

Ce module lit et écrit l'affectation d'époque (1933 / 2025-2026) sous le
même espace de données que **CoC7 – Suivi de Chance du groupe**. Si tu as
déjà assigné les époques dans ce dernier, elles apparaissent
automatiquement ici — pas besoin de les ressaisir. Ça fonctionne aussi
si seul ce module Santé Mentale est installé (l'assignation se fait alors
directement dans sa propre fenêtre).

## Installation

1. Décompressez le dossier `coc7-san-tracker` dans
   `[DonnéesFoundry]/Data/modules/coc7-san-tracker`
2. Activez-le dans **Configuration du monde → Gérer les modules**.
3. Le bouton cerveau apparaît dans le groupe d'outils "Jeton", à côté du
   bouton trèfle (Chance) si ce dernier est aussi installé.

## Personnalisation rapide

- **Rendre le bouton visible aux joueurs** : dans
  `scripts/san-tracker.js`, ligne `visible: game.user.isGM,` → remplacez
  par `visible: true,`.
- **Couleurs** : `styles/san-tracker.css`, variables `--coc-crimson` (seuil
  critique), `--coc-gold` (le plus fragile), `--coc-teal` (accent
  2025-2026).
- Si la Santé Mentale ne s'affiche pas, ouvrez la console (F12) et
  inspectez `game.actors.contents.find(a => a.type === "character").system`
  pour repérer le bon chemin, puis ajustez `getSanValue` / `getSanMax`
  dans `scripts/san-tracker.js`.
