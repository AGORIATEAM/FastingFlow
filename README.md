# FastLife

Application iOS native de jeûne intermittent — Expo SDK 54 / React Native 0.81 / expo-router 6.

Timer de jeûne avec phases métaboliques, statistiques (streaks, heatmap), contenu scientifique (timeline biochimique, lexique), profil et protocoles (16:8 → 96h). Données 100 % locales (SQLite), mode invité par défaut.

## Stack

- **UI** : React Native + expo-router (typed routes), design system maison (`lib/theme.ts` + `components/ui/`), react-native-svg, reanimated 4
- **Données** : schémas Zod (`lib/schemas/`) → migrations SQLite (`lib/db/`) → repositories (`lib/repositories/`) → stores Zustand (`lib/stores/`)
- **Domaine** : `lib/domain/fasting/` (phases, progression, streaks) — logique pure testée
- **Contenu** : `content/*.json` générés depuis `docs-source/` par `npm run generate-content` (committés ; régénérer après modification des sources markdown)

## Développement

```bash
npm ci
npm run ios           # simulateur
npx expo run:ios --device   # iPhone réel (compte Apple gratuit : app valable 7 jours)
```

> Pas d'EAS/TestFlight pour l'instant (compte Apple Developer gratuit). `eas.json` sera ajouté avec le passage au compte payant.

## Scripts

| Script                     | Rôle                                                                  |
| -------------------------- | --------------------------------------------------------------------- |
| `npm run type-check`       | TypeScript strict (`tsc --noEmit`)                                    |
| `npm run lint`             | ESLint                                                                |
| `npm test`                 | Jest (domaine)                                                        |
| `npm run generate-content` | Régénère `content/phases.json` + `lexicon.json` depuis `docs-source/` |

Convention de commits : `feat(bloc-x): …` — un bloc = un incrément fonctionnel vérifié (type-check + lint + test verts).
