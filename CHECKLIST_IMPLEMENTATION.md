# ✅ Checklist d'implémentation - Bonnes pratiques Carge

Cette checklist accompagne le document `AUDIT_BONNES_PRATIQUES.md` et permet de suivre l'implémentation progressive des améliorations.

---

## 🔴 SEMAINE 1 - URGENT (Priorité Critique)

### Jour 1-2: Tests
- [ ] **Corriger le test défaillant `proof-verifier.test.js`**
  - [ ] Vérifier les mocks de `@polkadot/util-crypto`
  - [ ] Corriger l'import de `blake2AsU8a`
  - [ ] Vérifier que tous les tests passent: `npm test`
  - [ ] Commit: `fix: resolve blake2AsU8a mock in proof-verifier tests`

### Jour 3: Logger centralisé
- [ ] **Créer le système de logger**
  - [ ] Créer `src/lib/logger.js`
  - [ ] Implémenter `logger.debug`, `logger.info`, `logger.warn`, `logger.error`
  - [ ] Ajouter `logger.blockchain` et `logger.ipfs` pour logs spécialisés
  - [ ] Tester avec quelques fichiers
  - [ ] Commit: `feat: add centralized logger system`

### Jour 4-5: Migration logs
- [ ] **Remplacer les console.log**
  - [ ] Identifier les 406 occurrences de console.*
  - [ ] Remplacer par logger approprié:
    - Développement → `logger.debug()`
    - Blockchain → `logger.blockchain()`
    - IPFS → `logger.ipfs()`
    - Erreurs → `logger.error()`
  - [ ] Vérifier que l'app fonctionne en dev
  - [ ] Vérifier que les logs sont supprimés en prod
  - [ ] Commit: `refactor: replace console.* with centralized logger`

---

## 🟠 SEMAINE 2 - PERFORMANCE (Haute Priorité)

### Jour 1-2: AppContext
- [ ] **Optimiser AppContext.jsx**
  - [ ] Importer `useMemo` et `useCallback`
  - [ ] Wrapper `connectWallet` avec `useCallback`
  - [ ] Wrapper `selectAccount` avec `useCallback`
  - [ ] Wrapper `disconnectWallet` avec `useCallback`
  - [ ] Wrapper `toggleWalletMenu` avec `useCallback`
  - [ ] Wrapper le `value` du Context avec `useMemo`
  - [ ] Tester les re-renders (React DevTools Profiler)
  - [ ] Commit: `perf: optimize AppContext with useMemo and useCallback`

### Jour 3: Home.jsx
- [ ] **Optimiser Home.jsx**
  - [ ] Memoize `workflowSteps` avec `useMemo`
  - [ ] Memoize les event handlers avec `useCallback`
  - [ ] Extraire `WorkflowStep` en sous-composant
  - [ ] Wrapper `WorkflowStep` avec `React.memo`
  - [ ] Tester performance (Lighthouse)
  - [ ] Commit: `perf: optimize Home component with memoization`

### Jour 4-5: Workflows.jsx
- [ ] **Optimiser Workflows.jsx**
  - [ ] Memoize les calculs lourds (`formatTokenAmount`, etc.)
  - [ ] Memoize les event handlers
  - [ ] Extraire sous-composants (`WorkflowCard`, `WorkflowForm`)
  - [ ] Wrapper avec `React.memo`
  - [ ] Tester performance (Lighthouse)
  - [ ] Commit: `perf: optimize Workflows page with memoization`

### Validation semaine 2
- [ ] **Tests de performance**
  - [ ] Exécuter Lighthouse avant/après
  - [ ] Vérifier amélioration Time to Interactive
  - [ ] Vérifier amélioration First Contentful Paint
  - [ ] Documenter les gains de performance

---

## 🟠 SEMAINE 3 - ACCESSIBILITÉ (Haute Priorité)

### Jour 1: Audit
- [ ] **Audit accessibilité initial**
  - [ ] Installer axe DevTools extension
  - [ ] Audit complet de chaque page
  - [ ] Lister toutes les issues trouvées
  - [ ] Prioriser par criticité

### Jour 2: Navigation clavier
- [ ] **Améliorer la navigation au clavier**
  - [ ] Ajouter `onKeyDown` sur tous les boutons interactifs
  - [ ] Gérer `Enter` et `Space` pour activation
  - [ ] Vérifier l'ordre de tabulation logique
  - [ ] Tester navigation complète sans souris
  - [ ] Commit: `a11y: improve keyboard navigation`

### Jour 3: ARIA attributes
- [ ] **Ajouter attributs ARIA**
  - [ ] Ajouter `aria-expanded` sur accordions
  - [ ] Ajouter `aria-controls` et `aria-labelledby`
  - [ ] Ajouter `aria-required` et `aria-invalid` sur formulaires
  - [ ] Ajouter `aria-describedby` pour messages d'erreur
  - [ ] Ajouter `role="alert"` pour notifications
  - [ ] Commit: `a11y: add ARIA attributes for better screen reader support`

### Jour 4: Landmarks
- [ ] **Structurer avec landmarks ARIA**
  - [ ] Ajouter `role="banner"` au header
  - [ ] Ajouter `role="navigation"` au menu
  - [ ] Ajouter `role="main"` au contenu principal
  - [ ] Ajouter `role="contentinfo"` au footer
  - [ ] Commit: `a11y: add ARIA landmarks for better structure`

### Jour 5: Focus et contrastes
- [ ] **Améliorer le focus visuel**
  - [ ] Ajouter styles `:focus-visible` dans `index.css`
  - [ ] Vérifier tous les contrastes (WebAIM Contrast Checker)
  - [ ] Ajuster couleurs si nécessaire
  - [ ] Tester avec simulateurs de daltonisme
  - [ ] Commit: `a11y: improve focus visibility and color contrast`

### Validation semaine 3
- [ ] **Validation accessibilité**
  - [ ] Audit axe DevTools (0 erreurs critiques)
  - [ ] Test Lighthouse Accessibility (score > 95)
  - [ ] Test navigation clavier complète
  - [ ] Test avec lecteur d'écran (NVDA/JAWS)

---

## 🟠 SEMAINE 4 - TESTS (Haute Priorité)

### Jour 1: Tests composants
- [ ] **Tester ErrorBoundary**
  - [ ] Créer `src/components/__tests__/ErrorBoundary.test.jsx`
  - [ ] Test: render children sans erreur
  - [ ] Test: catch errors et afficher fallback
  - [ ] Test: bouton reset fonctionne
  - [ ] Commit: `test: add ErrorBoundary component tests`

- [ ] **Tester Header**
  - [ ] Créer `src/components/__tests__/Header.test.jsx`
  - [ ] Test: affichage wallet connecté/déconnecté
  - [ ] Test: changement de langue
  - [ ] Test: affichage status blockchain/IPFS
  - [ ] Commit: `test: add Header component tests`

### Jour 2: Tests d'intégration
- [ ] **Tester AppContext**
  - [ ] Créer `src/contexts/__tests__/AppContext.integration.test.jsx`
  - [ ] Test: connexion wallet
  - [ ] Test: sélection compte
  - [ ] Test: déconnexion
  - [ ] Test: gestion état blockchain
  - [ ] Commit: `test: add AppContext integration tests`

### Jour 3: Configuration Playwright
- [ ] **Setup E2E tests**
  - [ ] Installer Playwright: `npm install -D @playwright/test`
  - [ ] Créer `playwright.config.js`
  - [ ] Créer dossier `e2e/`
  - [ ] Configurer scripts npm
  - [ ] Commit: `test: setup Playwright for E2E testing`

### Jour 4-5: Tests E2E
- [ ] **Tests workflow principal**
  - [ ] Créer `e2e/workflows.spec.js`
  - [ ] Test: navigation vers workflows
  - [ ] Test: sélection d'un workflow
  - [ ] Test: remplissage formulaire
  - [ ] Test: soumission (avec mock blockchain)
  - [ ] Commit: `test: add E2E tests for workflow creation`

- [ ] **Tests vérification**
  - [ ] Créer `e2e/verify.spec.js`
  - [ ] Test: upload fichier proof
  - [ ] Test: verification on-chain
  - [ ] Test: affichage résultats
  - [ ] Commit: `test: add E2E tests for proof verification`

### Validation semaine 4
- [ ] **Couverture de tests**
  - [ ] Exécuter `npm run test:coverage`
  - [ ] Vérifier couverture > 70%
  - [ ] Identifier gaps de couverture
  - [ ] Ajouter tests manquants si nécessaire

---

## 🟡 MOIS 2 - CONSOLIDATION (Moyenne Priorité)

### Semaine 5: Error monitoring

#### Intégration Sentry
- [ ] Créer compte Sentry (ou alternative)
- [ ] Installer: `npm install @sentry/react`
- [ ] Configurer dans `src/main.jsx`
- [ ] Configurer variables d'environnement
- [ ] Intégrer dans ErrorBoundary
- [ ] Tester capture d'erreurs
- [ ] Commit: `feat: integrate Sentry for error monitoring`

#### Retry logic
- [ ] Créer `src/lib/utils/retry.js`
- [ ] Implémenter `retryAsync` avec backoff
- [ ] Intégrer dans `ipfs-client.js`
- [ ] Intégrer dans `substrate-client.js`
- [ ] Tester avec timeouts simulés
- [ ] Commit: `feat: add retry logic for network requests`

### Semaine 6: Optimisation bundles

#### Vite configuration
- [ ] Installer visualizer: `npm install -D rollup-plugin-visualizer`
- [ ] Configurer manual chunks dans `vite.config.js`
- [ ] Activer drop_console en production
- [ ] Désactiver sourcemap en production
- [ ] Analyser bundles avec visualizer
- [ ] Commit: `perf: optimize Vite build configuration`

#### Analyse et optimisation
- [ ] Générer rapport bundle size
- [ ] Identifier les plus gros chunks
- [ ] Optimiser imports (tree-shaking)
- [ ] Vérifier compression (gzip/brotli)
- [ ] Documenter les améliorations

### Semaine 7-8: Documentation et TypeScript (optionnel)

#### Documentation JSDoc
- [ ] Installer: `npm install -D jsdoc jsdoc-to-markdown`
- [ ] Ajouter script `docs` dans package.json
- [ ] Documenter tous les fichiers `src/lib/core/*.js`
- [ ] Documenter composants principaux
- [ ] Générer `docs/API.md`
- [ ] Commit: `docs: add comprehensive JSDoc documentation`

#### Migration TypeScript (si décidé)
- [ ] Installer TypeScript: `npm install -D typescript @types/react @types/react-dom`
- [ ] Créer `tsconfig.json`
- [ ] Renommer `config.js` → `config.ts`
- [ ] Renommer `encryption-utils.js` → `encryption-utils.ts`
- [ ] Ajouter types progressivement
- [ ] Vérifier compilation: `tsc --noEmit`
- [ ] Commit: `feat: start TypeScript migration`

---

## 🟢 BACKLOG - Nice to Have (Basse Priorité)

### Dark mode
- [ ] Créer `src/contexts/ThemeContext.jsx`
- [ ] Implémenter toggle dark/light
- [ ] Configurer Tailwind dark mode
- [ ] Ajouter bouton dans Header
- [ ] Tester tous les composants
- [ ] Commit: `feat: add dark mode support`

### PWA
- [ ] Installer: `npm install -D vite-plugin-pwa`
- [ ] Configurer dans `vite.config.js`
- [ ] Créer manifest.json
- [ ] Configurer service worker
- [ ] Tester installation
- [ ] Commit: `feat: add PWA support`

### Internationalisation étendue
- [ ] Ajouter langue ZH (Chinois)
- [ ] Ajouter langue ES (Espagnol)
- [ ] Ajouter langue DE (Allemand)
- [ ] Ajouter langue JA (Japonais)
- [ ] Tester toutes les langues
- [ ] Commit: `feat: add Chinese, Spanish, German, Japanese translations`

---

## 🔧 Outils et Setup Initial (À faire une fois)

### Linting et formatting
- [ ] Configurer Prettier
  ```bash
  npm install -D prettier eslint-config-prettier
  ```
- [ ] Créer `.prettierrc`
- [ ] Ajouter plugin a11y: `npm install -D eslint-plugin-jsx-a11y`
- [ ] Mettre à jour `eslint.config.js`
- [ ] Commit: `chore: configure Prettier and a11y linting`

### Git hooks
- [ ] Installer Husky: `npm install -D husky lint-staged`
- [ ] Configurer pre-commit hook
- [ ] Configurer commit-msg hook (commitlint)
- [ ] Tester les hooks
- [ ] Commit: `chore: setup Husky pre-commit hooks`

### CI/CD
- [ ] Créer `.github/workflows/quality.yml`
- [ ] Configurer tests automatiques
- [ ] Configurer Lighthouse CI
- [ ] Configurer deploy preview
- [ ] Tester pipeline
- [ ] Commit: `ci: setup GitHub Actions for quality checks`

---

## 📊 Métriques à suivre

### Après chaque semaine, vérifier:

#### Performance
- [ ] Lighthouse Performance Score
  - Actuel: ~75
  - Cible: >90
- [ ] First Contentful Paint
  - Actuel: ~1.5s
  - Cible: <1.0s
- [ ] Time to Interactive
  - Actuel: ~3.5s
  - Cible: <2.5s

#### Qualité
- [ ] Couverture de tests
  - Actuel: ~15-20%
  - Cible: >70%
- [ ] Issues ESLint
  - Cible: 0

#### Accessibilité
- [ ] Lighthouse Accessibility Score
  - Actuel: ~70
  - Cible: >95
- [ ] axe DevTools issues
  - Cible: 0 critiques, <5 mineures

#### Bundle Size
- [ ] Total bundle size
  - Surveiller évolution
  - Alert si augmentation >10%

---

## 🎯 Validation finale (Après 8 semaines)

### Checklist de production-ready
- [ ] ✅ Tous les tests passent (unitaires + E2E)
- [ ] ✅ Couverture > 70%
- [ ] ✅ Lighthouse Performance > 90
- [ ] ✅ Lighthouse Accessibility > 95
- [ ] ✅ Lighthouse Best Practices > 90
- [ ] ✅ Lighthouse SEO > 90
- [ ] ✅ 0 erreurs ESLint
- [ ] ✅ 0 erreurs axe DevTools (critiques)
- [ ] ✅ Navigation clavier complète fonctionnelle
- [ ] ✅ Test lecteur d'écran passé
- [ ] ✅ Error monitoring configuré (Sentry)
- [ ] ✅ Documentation à jour
- [ ] ✅ README avec instructions complètes
- [ ] ✅ CHANGELOG maintenu
- [ ] ✅ CI/CD fonctionnel

### Documentation finale
- [ ] Mettre à jour README.md
- [ ] Créer CHANGELOG.md si absent
- [ ] Documenter architecture dans docs/
- [ ] Créer guide de contribution détaillé
- [ ] Documenter processus de deployment

---

## 💡 Tips d'implémentation

### Pour chaque tâche
1. **Créer une branche:** `git checkout -b task/descriptive-name`
2. **Implémenter les changements**
3. **Tester localement:** `npm test && npm run build`
4. **Vérifier linter:** `npm run lint`
5. **Commit avec message conventionnel**
6. **Push et créer PR**
7. **Review et merge**

### En cas de blocage
- Consulter `AUDIT_BONNES_PRATIQUES.md` pour détails
- Chercher exemples dans documentation officielle
- Demander review au reste de l'équipe
- Ne pas hésiter à découper une tâche si trop grosse

### Priorisation
- **URGENT** bloque le reste → à faire immédiatement
- **HAUTE** améliore significativement → à faire cette semaine/mois
- **MOYENNE** consolide la qualité → à faire ce mois
- **BASSE** nice to have → backlog

---

**Code is law. Les bugs sont l'ennemi commun.** 🛡️

*Checklist créée le 26 Octobre 2025*

