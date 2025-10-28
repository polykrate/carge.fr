# Analyse UX du site CARGE

## 📊 Audit de cohérence UX

### ✅ Pages secondaires (About, Verify, Workflows, QuickSign, Agent)
**Pattern cohérent** :
```
- Titre simple : text-4xl font-light
- Sous-titre : text-gray-600
- Bouton "How it works?" en haut à droite
- Contenu épuré, focalisé sur l'action
```

### ⚠️ Page Home (Landing) - **SURCHARGÉE**

#### Problèmes identifiés :

**1. Hero Section trop dense**
- ✅ Badge "Blockchain-Certified..."
- ✅ Titre H1 énorme (text-7xl)
- ✅ Sous-titre (text-3xl)
- ✅ 3 points avec icônes (heroPoint1, 2, 3)
- ✅ Paragraphe descriptif
- ✅ **3 boutons CTA** ("See How It Works", "Verify", "Request Demo")
- ✅ **Encart Agent** (grand bloc violet avec badge "NEW")
- ⚠️ Métriques (4 cartes)

**Total** : 9 éléments visuels avant le fold → **Trop !**

**2. Manque de hiérarchie visuelle**
- L'encart Agent a autant d'importance que le CTA principal
- Les 3 boutons CTA se concurrencent
- Badge "NEW" sur l'Agent crée de la confusion sur ce qui est important

**3. Incohérence avec le reste du site**
- Pages secondaires : épurées, sobres
- Landing : surchargée, marketing agressif

---

## 🎯 Public visé

D'après le contenu :
- **B2B** : Marques premium, PME, entreprises
- **Industries** : Spiritueux, automobile, agriculture, luxe
- **Besoins** : Anti-contrefaçon, traçabilité, conformité légale
- **Niveau technique** : Non-techniques à techniques (dual audience)

**Message actuel** : "Blockchain pour tout le monde"
**Problème** : Trop de friction, pas assez de focus

---

## 💡 Recommandations

### Option 1 : Simplification radicale (recommandé)

**Hero épuré** :
```
1. Badge "Blockchain-Certified"
2. Titre H1 : "Stop Counterfeiting with Blockchain"
3. Sous-titre : "Automation + Privacy + Traceability"
4. 1 CTA principal : "Verify a Proof" 
5. 1 CTA secondaire : "See How It Works" (scroll)
6. Métriques (garder)
```

**Déplacer** :
- Encart Agent → Section dédiée plus bas
- "Request Demo" → Footer ou section "Contact"
- 3 points avec icônes → Fusionner dans subtitle

### Option 2 : Prioriser l'Agent (si c'est la feature phare)

**Si Agent = killer feature** :
```
1. Titre : "Create Blockchain Workflows with AI"
2. Sous-titre : "No code required"
3. CTA 1 : "Create with AI" (Agent)
4. CTA 2 : "Verify a Proof"
5. Supprimer l'encart Agent redondant
```

### Option 3 : A/B Testing

Tester 2 versions :
- **A** : Focus "Verify" (public B2C/consommateurs)
- **B** : Focus "Agent" (public B2B/créateurs)

---

## 🔧 Quick wins immédiats

1. **Supprimer l'encart Agent du hero**
   - Le mettre dans une section dédiée après "What Makes the Difference"
   - Ou garder juste le bouton CTA violet

2. **Réduire les CTA de 3 à 2**
   - Garder : "See How It Works" + "Verify"
   - Déplacer "Request Demo" dans footer

3. **Simplifier les 3 points**
   - Les fusionner dans le subtitle : "Automation + Privacy + Traceability"
   - Supprimer les icônes redondantes

4. **Badge "NEW"**
   - Supprimer ou garder seulement sur le bouton CTA Agent

---

## 📐 Structure proposée (Option 1 - recommandée)

```
HERO
├─ Badge "Blockchain-Certified"
├─ H1: "Stop Counterfeiting with Blockchain"
├─ Subtitle: "Automation + Privacy + Traceability"
├─ CTA Principal: "Verify a Proof" (bleu CARGE)
├─ CTA Secondaire: "See How It Works" (outline)
└─ Métriques (4 cartes)

WHAT MAKES THE DIFFERENCE
└─ (existant - OK)

HOW IT WORKS: REAL STORY
└─ (existant - OK)

🆕 AI-POWERED WORKFLOW BUILDER (nouvelle section)
├─ Titre: "Create Custom Workflows with AI"
├─ Description: "Use ChatGPT or Claude..."
├─ Screenshot/Demo
└─ CTA: "Try AI Builder" (violet → bleu)

USE CASES
└─ (existant - OK)

TRUST & LEGAL
└─ (existant - OK)

FAQ
└─ (existant - OK)

ROADMAP
└─ (existant - OK)

CTA FOOTER
├─ CTA 1: "Explore Workflows"
├─ CTA 2: "Create with AI"
└─ CTA 3: "Request Demo" (email)
```

---

## 📊 Comparaison avant/après

| Élément | Avant | Après (Option 1) |
|---------|-------|------------------|
| CTA dans hero | 3 + 1 encart | 2 CTA simples |
| Texte/Icônes | 6 blocs | 3 blocs |
| Focus principal | Confus | Clair : Verify |
| Agent visibility | Hero (concurrent) | Section dédiée |
| Cohérence UX | ❌ | ✅ |
| Mobile-friendly | ⚠️ | ✅ |

---

## 🎨 Principes de design à respecter

1. **One hero, one action**
   - Le hero doit avoir 1 CTA principal clair
   - Les autres actions sont secondaires

2. **Progressive disclosure**
   - Introduire les concepts progressivement
   - Hero = hook, sections = détails

3. **Cohérence**
   - Même pattern entre landing et pages secondaires
   - Même tonalité (sobre, professionnelle)

4. **Mobile-first**
   - Hero actuel = trop dense sur mobile
   - Simplifier pour la lisibilité

---

## ✅ Actions recommandées

### Priorité 1 (immédiat)
- [ ] Supprimer l'encart Agent du hero
- [ ] Réduire à 2 CTA max dans le hero
- [ ] Créer section dédiée "AI Builder" après "Use Cases"

### Priorité 2 (court terme)
- [ ] Simplifier les 3 points → 1 subtitle
- [ ] Tester A/B : Focus Verify vs Focus Agent
- [ ] Optimiser pour mobile

### Priorité 3 (moyen terme)
- [ ] Analytics pour mesurer les conversions par CTA
- [ ] Heatmap pour voir où les users cliquent
- [ ] User testing avec le public cible

---

**Conclusion** : La landing actuelle est trop dense. Il faut choisir 1 message principal et structurer le reste en sections dédiées.

