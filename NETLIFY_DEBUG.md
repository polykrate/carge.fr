# 🔍 Débugger la page blanche sur Netlify

## ✅ Changements appliqués pour le debug

Les commits récents ont activé des outils de debug :
- ✅ Source maps activées
- ✅ `console.error` conservé en production
- ✅ ErrorBoundary affiche les détails d'erreur
- ✅ Composant LazyLoadError ajouté

## 🚀 Étapes pour identifier le problème

### 1. Déployer sur Netlify

```bash
git push origin master
```

Netlify va automatiquement construire et déployer.

### 2. Ouvrir la console du navigateur

Sur le site Netlify :
1. **Clic droit** → **Inspecter** (ou F12)
2. Aller dans l'onglet **Console**
3. Aller dans l'onglet **Network**
4. Recharger la page (Ctrl+Shift+R / Cmd+Shift+R)

### 3. Vérifier les erreurs

Cherchez ces types d'erreurs :

#### ❌ Erreur de chargement de chunk
```
Failed to fetch dynamically imported module: /assets/Home-xxx.js
```
**Solution** : Problème de cache Netlify ou chemins incorrects
```bash
# Sur Netlify UI: Site Settings → Build & Deploy → Clear cache and deploy site
```

#### ❌ Erreur d'import
```
SyntaxError: Unexpected token '<'
```
**Solution** : Les fichiers JS servent du HTML (problème de routing)
- Vérifier que `_redirects` existe dans `dist/`
- Vérifier `netlify.toml` (déjà OK normalement)

#### ❌ Erreur de module
```
Cannot find module './pages/Home'
```
**Solution** : Problème d'export/import
- Les exports sont corrects (déjà vérifié)

### 4. Vérifier les fichiers chargés

Dans l'onglet **Network** :
- Tous les `.js` doivent avoir le statut **200** (vert)
- Si un fichier a **404** (rouge) : note le nom du fichier
- Si un fichier retourne du HTML au lieu de JS : problème de routing SPA

### 5. Vérifier le build Netlify

Dans le dashboard Netlify :
1. **Deploys** → Cliquer sur le dernier deploy
2. Vérifier les logs de build
3. Chercher les erreurs ou warnings

## 🔧 Solutions communes

### Solution 1 : Clear cache Netlify
```
Netlify UI → Site settings → Build & Deploy → Clear cache and deploy site
```

### Solution 2 : Vérifier les variables d'environnement
Si vous avez des variables d'env :
```
Netlify UI → Site settings → Environment variables
```
Vérifier qu'elles sont définies.

### Solution 3 : Forcer le rebuild
```bash
git commit --allow-empty -m "Force rebuild"
git push origin master
```

### Solution 4 : Vérifier le base path Vite
Si les assets ne chargent pas, ajouter dans `vite.config.js` :
```javascript
export default defineConfig({
  base: '/', // ou base: 'https://votre-domaine.netlify.app/'
  // ...
})
```

## 📊 Debug rapide

### Tester en local avec le build de production

```bash
npm run build
npx serve dist -s
```

Ouvrir http://localhost:3000 et vérifier si ça fonctionne.

Si ça marche en local mais pas sur Netlify → problème Netlify spécifique (cache, routing)
Si ça ne marche pas en local → problème de build/code

## 🆘 Si rien ne fonctionne

Envoyer ces informations :
1. Screenshot de la console du navigateur (onglet Console)
2. Screenshot de l'onglet Network avec l'erreur
3. Les logs de build Netlify
4. L'URL du site Netlify

## 🔄 Une fois le problème résolu

Désactiver les outils de debug dans `vite.config.js` :
```javascript
// Remettre en production
sourcemap: false,
terserOptions: {
  compress: {
    drop_console: true, // Enlever TOUS les console.log
  }
}
```

Et dans `ErrorBoundary.jsx` :
```javascript
// Remettre la condition
{import.meta.env.MODE === 'development' && this.state.error && (
  // ... error details
)}
```

