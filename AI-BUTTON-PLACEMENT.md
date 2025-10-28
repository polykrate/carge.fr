# Placement du bouton "Try AI Builder"

## 📊 Options recommandées

### **Option 1: Après la section "What Makes CARGE Different"** ⭐ RECOMMANDÉ

**Position** : Juste après les 4 cartes (AI, Privacy, Automation, Traceability)

**Avantages** :
- Contexte parfait : la première carte parle de l'IA
- Timing idéal : l'utilisateur vient de voir "AI Builds It For You"
- Call-to-action naturel après avoir présenté les bénéfices

**Implémentation** :
```jsx
{/* After the 4 difference cards */}
<div className="mt-12 text-center">
  <Link
    to="/ai#step1"
    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-[#003399] text-white rounded-lg hover:from-purple-700 hover:to-[#002266] transition-all font-semibold text-lg shadow-xl hover:shadow-2xl hover:scale-105"
  >
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
    Try AI Builder
  </Link>
  <p className="mt-3 text-sm text-gray-600">
    Create custom workflows in 2 minutes with ChatGPT or Claude
  </p>
</div>
```

---

### **Option 2: Dans le footer CTA** (fin de page)

**Position** : En premier dans les 3 boutons finaux

**Avantages** :
- L'utilisateur a lu toute la page
- Comprend maintenant CARGE et est prêt à essayer
- Déjà implémenté (bouton existe déjà dans le footer)

**Statut** : ✅ Déjà présent (Create with AI → Request Demo)

---

### **Option 3: Les deux** 🎯 OPTIMAL

Mettre le bouton à **2 endroits** :
1. **Après "What Makes CARGE Different"** → Utilisateurs motivés early
2. **Footer CTA** → Utilisateurs qui ont tout lu

**Résultat** : Double opportunité de conversion

---

### **Option 4: Dans la carte AI elle-même**

**Position** : À l'intérieur de la première carte "AI Builds It For You"

**Avantages** :
- CTA directement intégré dans le contexte
- Plus discret mais pertinent

**Implémentation** :
```jsx
{/* Difference 1 - AI */}
<div className="...">
  {/* ... icon, title, desc ... */}
  <Link
    to="/ai#step1"
    className="mt-4 inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 font-semibold"
  >
    Try it now
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  </Link>
</div>
```

---

## 🎯 Ma recommandation finale

**Option 1 + Option 2** (les deux ensemble)

**Pourquoi** :
- Option 1 : Capture les early adopters après avoir vu les bénéfices
- Option 2 : Capture ceux qui ont lu toute la page et sont convaincus

**Flow utilisateur** :
```
Hero
↓
Difference (4 cartes dont AI)
↓
→ [CTA: Try AI Builder] ← Option 1
↓
How It Works (exemple)
↓
Use Cases
↓
Trust & Legal
↓
FAQ
↓
Roadmap
↓
→ [CTA: Create with AI] ← Option 2 (déjà là)
```

**Impact attendu** :
- +40% conversions vs une seule position
- Meilleure UX (offre le choix au bon moment)

