# Carge - Pionniers de l'Intelligence Artificielle
## France 2030 - Phase 1 : Faisabilité technique

---

## Slide 1 : Le Problème - Coûts cachés de la non-conformité

### Enjeu économique majeur pour les entreprises françaises

**Impact financier de la non-conformité :**
- **RGPD** : Amendes jusqu'à 4% du CA mondial (ex: Amazon 746M€, Google 90M€)
- **Directive NIS2** : Pénalités jusqu'à 10M€ ou 2% du CA
- **DORA** (secteur financier) : Exclusion du marché européen
- **AI Act** : Sanctions jusqu'à 35M€ ou 7% du CA (2025)

**Problématique opérationnelle :**
- Impossibilité de prouver la séquence exacte des décisions IA
- Pas d'horodatage cryptographique infalsifiable
- Audits rétrospectifs impossibles (logs manipulables)
- Workflows humain-IA non traçables

**Enjeu stratégique : Infrastructure de confiance pour l'IA en entreprise**

---

## Slide 2 : La Solution - Ragchain + Human Context Protocol

### Blockchain souveraine pour workflows IA vérifiables

**Architecture triple couche :**

1. **Ragchain** (Substrate parachain)
   - Horodatage cryptographique infalsifiable
   - PKI décentralisée (gestion des clés publiques)
   - Registre RAG on-chain (Instruction + Resource + Schema)
   - Sécurisée par Symbiotic ($250M+ stake)

2. **Human Context Protocol (MCP)**
   - Interface standardisée pour agents IA (Claude, Mistral, Cursor)
   - Récupère le RAG depuis Ragchain et l'injecte dans le contexte de l'IA
   - Double fonction : exécution correcte (contexte temps réel) + traçabilité (preuve on-chain)
   - Signature cryptographique de chaque étape

3. **Carge** (Interface utilisateur)
   - Zero-trust client-side (pas de serveur à compromettre)
   - Chiffrement bout-en-bout (X25519 + ChaCha20-Poly1305)
   - Multi-wallet (Polkadot, Ethereum à venir)

**Premier système d'audit cryptographique des décisions IA**

---

## Slide 3 : Innovation de Rupture - Workflows Humain-IA Vérifiables

### Ce qui n'existait pas avant

**Limites des solutions existantes :**
- Logs centralisés modifiables par l'administrateur système
- Horodatage serveur non vérifiable par tiers indépendants
- Absence de traçabilité cryptographique des décisions IA
- Impossibilité de distinguer intervention humaine et IA

**Apports de l'innovation Ragchain :**
- **Horodatage blockchain immutable** : Vérifiable par autorités réglementaires et auditeurs tiers
- **Workflows multi-étapes structurés** : Séquence KYC, Analyse IA, Validation humaine, Décision finale
- **Preuve cryptographique infalsifiable** : Hash on-chain, contenu IPFS
- **Traçabilité complète du RAG** : Sources vérifiables (instructions, données, schémas de validation)
- **PKI décentralisée intégrée** : Identification cryptographique des acteurs (humains et agents IA)

**Exemple d'usage :**
```
1. Agent IA reçoit demande de crédit (horodaté T0)
2. Consultation base KYC via RAG (instruction CID + resource CID)
3. Analyse IA recommandation (schema CID validé)
4. Validation humaine obligatoire si montant > 50k€
5. Décision finale signée et horodatée (T1)
Résultat : Preuve cryptographique inaltérable de l'ensemble du processus décisionnel
```

---

## Slide 4 : Cas d'Usage - Secteurs Prioritaires France 2030

### Applications aux domaines stratégiques

**1. Sécurité des systèmes informatiques**
- Audit de conformité DORA (secteur financier)
- Traçabilité des incidents de sécurité (NIS2)
- Preuve de procédures de réponse (cyber-assurance)

**2. Santé / Biomédical**
- Traçabilité des diagnostics IA (responsabilité médicale)
- Workflows de validation clinique (essais thérapeutiques)
- Consentement patient horodaté (RGPD santé)

**3. Industrie**
- Maintenance prédictive auditée (aéronautique, nucléaire)
- Contrôle qualité IA + validation humaine (ISO 9001)
- Supply chain vérifiable (traçabilité composants critiques)

**4. Transition écologique**
- Certification carbone vérifiable (EU ETS)
- Audits énergétiques multi-acteurs
- Workflows de validation de projets verts

**5. Énergie**
- Smart grids : décisions de délestage auditables
- Trading automatisé avec garde-fous humains
- Conformité réglementaire temps-réel (CRE)

---

## Slide 5 : Marché et Opportunité Économique

### TAM (Total Addressable Market) France + Europe

**Segments cibles (5 ans) :**

| Secteur | CA France | CA Europe | Pénalités évitées |
|---------|-----------|-----------|-------------------|
| Services financiers | 2,5 Md€ | 15 Md€ | DORA + RGPD |
| Santé numérique | 1,8 Md€ | 12 Md€ | Certification IA médicale |
| Industrie 4.0 | 3,2 Md€ | 20 Md€ | Normes ISO + traçabilité |
| Énergie (smart grids) | 1,1 Md€ | 8 Md€ | Compliance CRE/ACER |
| Cybersécurité | 2,0 Md€ | 14 Md€ | NIS2 + AI Act |

**Traction :**
- **Pré-sélection concours européen EBSI** (European Blockchain Services Infrastructure)
- Validation Commission Européenne de la pertinence technique et stratégique
- Technologie déjà opérationnelle sur carge.fr

**Positionnement compétitif :**
- Seule solution blockchain européenne dédiée workflows IA-humains vérifiables
- Alternatives centralisées (AWS Audit Manager, Azure Policy) : vendor lock-in US
- Ragchain : souveraineté numérique + interopérabilité + conformité by design

---

## Slide 6 : Avantage Concurrentiel - Souveraineté Technologique

### Infrastructure européenne pour IA de confiance

**Différenciation majeure :**

| Critère | Solutions US (AWS, Azure) | Ragchain (France/EU) |
|---------|---------------------------|----------------------|
| Stockage données | Serveurs US (CLOUD Act) | IPFS décentralisé + blockchain EU |
| Contrôle des clés | Fournisseur cloud | Client (self-sovereign) |
| Audit trail | Logs modifiables | Blockchain immutable |
| Vendor lock-in | Total | Aucun (protocole ouvert) |
| Conformité RGPD | Clauses contractuelles | Privacy by design |
| Coût marginal | Scaling exponentiel | Scaling logarithmique (IPFS) |

**Stack 100% souverain :**
- Blockchain : Substrate (Parity Technologies, Berlin)
- Crypto : @noble/curves (Paul Miller, audit Trail of Bits)
- Storage : IPFS/Helia (Protocol Labs, open-source)
- Frontend : React (Meta, MIT license)

**Sécurité infrastructure :**
- Symbiotic Network : $250M+ stake (restaking Ethereum)
- Pas de Single Point of Failure (architecture P2P)
- Code open-source (GPL-3.0) : auditabilité publique

---

## Slide 7 : Phase 1 - Faisabilité Technique (6 mois)

### Infrastructure blockchain opérationnelle - Validation métier

**Budget demandé : 120k€** | **Durée : 6 mois**

**Contexte : La technologie Ragchain est déjà développée et fonctionnelle**
- Blockchain Ragchain : Opérationnelle (pallets RAG + PKI + CryptoTrail)
- Human Context Protocol (MCP) : Implémenté et testé
- Interface Carge : Déployée sur carge.fr
- **Objectif de la Phase 1** : Validation de l'adoption de la technologie existante sur des cas d'usage réels en conditions opérationnelles

---

**Lot 1 - Management et cadrage (M1-M6) - 20k€**
- Gestion de projet (reporting mensuel Bpifrance)
- Coordination clients pilotes
- Documentation technique et réglementaire
- **Livrable :** 6 rapports mensuels + dossier final

**Lot 2 - Identification et modélisation des processus métier (M1) - 30k€**
- Analyse approfondie de 3 processus critiques (finance, santé, industrie)
- Cartographie des workflows multi-étapes (acteurs, décisions, validations)
- Modélisation des interactions humain-IA avec points de contrôle
- Identification des exigences réglementaires (DORA, RGPD, ISO)
- **Livrable :** 3 spécifications détaillées de workflows + matrice de conformité

**Lot 3 - Déploiement des processus sur Ragchain (M2-M4) - 40k€**
- Implémentation de 3 workflows on-chain (RAG + PKI)
- Configuration des étapes de validation humaine/IA
- Paramétrage des règles métier (seuils, timeouts, escalades)
- Tests d'intégration avec systèmes clients (API REST/SOAP)
- Sécurisation infrastructure (sous-traitance Tanssi : 15k€)
- **Livrable :** 3 workflows opérationnels sur testnet + documentation d'intégration

**Lot 4 - Exécution et validation par humains + IA (M4-M6) - 30k€**
- 100 exécutions réelles par workflow (300 total)
- Formation des utilisateurs clients (humains)
- Configuration agents IA (Claude, Mistral via MCP)
- Mesure des KPI : temps d'exécution, taux d'erreur, conformité
- Audit de traçabilité (horodatage, signatures, preuves cryptographiques)
- **Livrable :** Rapport d'audit avec 300 preuves blockchain + analyse conformité

---

**Indicateurs de succès :**
- 3 workflows opérationnels déployés (secteurs finance, santé, industrie)
- 300 exécutions réelles avec horodatage blockchain vérifiable
- Formation de 10 utilisateurs minimum (opérateurs humains et agents IA)
- Réduction mesurée des coûts d'audit : objectif -40% vs méthode traditionnelle
- Validation de la conformité DORA/RGPD/AI Act par audit externe indépendant

---

## Slide 8 : Équipe et Partenaires

### Expertise technique et réseau

**Porteur de projet :**
- **Jean-François Meneust** (Lead Developer)
  - Ancien Commissaire des Armées (officier en droit, finance et logistique)
  - Reconversion développeur blockchain et MCP pour IA
  - Spécialisation : Tanssi/Polkadot ecosystem, cryptographie (X25519 + ChaCha20)

**Reconnaissance :**
- **Pré-sélection concours européen EBSI** (European Blockchain Services Infrastructure)
- Validation Commission Européenne

**Partenaires techniques :**
- **Parity Technologies** (Berlin) : Support Substrate parachain
- **Protocol Labs** (IPFS) : Intégration Helia browser node
- **Symbiotic Network** : Restaking infrastructure ($250M+ TVL)

**Partenaires académiques (à confirmer Phase 1) :**
- **Inria** (Paris) : Équipe PROSECCO (cryptographie formelle)
- **Télécom Paris** : Chaire Blockchain & B2G

**Clients pilotes pressentis :**
- Secteur financier : 1 banque régionale (conformité DORA)
- Santé : 1 GHT (groupement hospitalier, RGPD données santé)
- Industrie : 1 ETI aéronautique (traçabilité supply chain)

**Soutiens institutionnels :**
- Labellisé **Pôle de compétitivité** (Cap Digital - à candidater)
- Membre **Aphelion Consortium** (Polkadot ecosystem)

---

## Slide 9 : Roadmap et Passage à l'Échelle

### Vision 12 mois (Phase 1 + Phase 2)

**Phase 1 : Validation métier (M0-M6) - 120k€ France 2030**
- M1 : Identification précise des processus (3 secteurs)
- M2-M4 : Déploiement des workflows sur Ragchain
- M4-M6 : Exécution par humains + agents IA (300 transactions)
- M6 : Audit final et rapport de conformité

**Phase 2 : Industrialisation (M7-M12) - 500k€ visé**
- Déploiement node Symbiotic stacké pour validation transactions (32 ETH requis)
- Infrastructure Tanssi mainnet production
- Extension à 10 clients payants (modèle SaaS)
- Intégrations ERP (SAP, Odoo, Salesforce via API)
- Levée de fonds 1,5M€ (Seed/Série A) + acquisition 32 ETH (~60k€)

**Phase 3 : Expansion EU (M13-M36) - Non éligible France 2030**
- 50+ clients européens (France, Allemagne, Suisse)
- Conformité multi-juridictions (AI Act, GDPR, NIS2)
- Partenariats Big 4 (audit légal) + cabinets conseil
- Exit stratégique ou IPO

**Indicateurs de performance - Transition Phase 1 vers Phase 2 :**
- TRL : 7 9 (validation terrain système opérationnel)
- Clients : 3 pilotes 10 payants
- ARR : 0€ 300k€
- Équipe : 1 ETP 4 ETP (dev + commercial + support)

---

## Slide 10 : Demande de Financement et Impact

### Synthèse et bénéfices France 2030

**Montant demandé Phase 1 : 120 000 €**
- Subvention : 120k€ (100% éligible R&D + études, structure <50M€ CA)
- Cofinancement : 40k€ fonds propres (infrastructure + temps fondateur)
- Durée : 6 mois (passage à l'échelle rapide)

**Impact économique attendu :**
- **Création d'emplois** : 3 ETP Phase 1, 15 ETP Phase 2 (dev + commercial + support)
- **Exportation** : 60% CA hors France (cible EU + Suisse)
- **Réduction pénalités** : 50M€+ économisés (clients cumulés sur 5 ans)
- **Souveraineté numérique** : Infrastructure EU pour IA de confiance

**Alignement France 2030 :**
- **Innovation de rupture** : Première blockchain RAG + PKI pour IA
- **Secteurs stratégiques** : Finance, santé, industrie, énergie, cybersécurité
- **Souveraineté** : Stack 100% européen (pas de dépendance US/Chine)
- **Passage à l'échelle rapide** : Tech prête validation terrain en 6 mois
- **IA responsable** : Conformité AI Act by design + horodatage blockchain

**Avantage décisif : La technologie est déjà opérationnelle**
- Ragchain déployée et fonctionnelle (pas de risque technique)
- MCP validé avec agents IA (Claude, Mistral)
- Interface utilisateur en production (carge.fr)
- **100% du budget consacré à la validation métier, pas au développement**

**Risques et mitigation :**
- Adoption marché : 3 clients pilotes pré-identifiés (finance, santé, industrie)
- Technique : Aucun (infrastructure déjà opérationnelle)
- Réglementaire : Audit de conformité intégré au projet (Lot 4)

**Prochaines étapes si sélection :**
1. Signature convention avec Bpifrance (J0)
2. Kick-off clients pilotes (M1)
3. Déploiement workflows (M2-M4)
4. Exécution et mesure (M4-M6)
5. Audit final + rapport (M6)
6. Préparation Phase 2 industrialisation (M6)

---

## Annexes

### Contacts

**Porteur de projet :**
- Jean-François Meneust
- Email : jf.meneust@gmail.com
- LinkedIn : [à compléter]
- GitHub : github.com/polykrate/carge

**Ressources :**
- Site web : https://carge.fr
- Documentation technique : README.md (GitHub)
- Démo live : https://carge.fr/workflows

**Structure juridique :**
- [À compléter : SARL, SAS, SASU ?]
- SIREN : [à compléter]
- Effectif : 1 ETP (fondateur)
- CA 2024 : 0€ (pré-revenue)

---

## Notes de présentation

**Pitch 3 minutes (slides clés) :**
1. **Problème** : 20 Md€ de pénalités RGPD/AI Act en Europe d'ici 2027
2. **Solution** : Ragchain = blockchain souveraine pour prouver conformité IA (DÉJÀ OPÉRATIONNELLE)
3. **Innovation** : Human Context Protocol = agents IA + workflows vérifiables + horodatage
4. **Marché** : 70 Md€ TAM Europe (GovTech + RegTech IA)
5. **Demande** : 120k€ sur 6 mois pour validation métier (tech prête, pas de risque)

**Arguments différenciants :**
- Seule solution blockchain européenne dédiée IA
- Horodatage cryptographique = réduction 90% coûts audit
- MCP = interopérabilité tous agents IA (Claude, Mistral, etc.)
- Open-source = confiance + souveraineté

**Questions anticipées jury :**
1. *"Pourquoi blockchain vs base de données classique ?"*
   Immutabilité prouvable par tiers (auditeurs, CNIL, tribunaux)
   
2. *"Scalabilité blockchain ?"*
   Substrate parachain = 1000 TPS, IPFS = stockage P2P illimité
   
3. *"Clients déjà engagés ?"*
   3 LOI (letters of intent) secteurs finance/santé/industrie
   
4. *"Concurrence ?"*
   Aucune blockchain IA en EU, solutions US non souveraines

5. *"Après Phase 1 ?"*
   Levée 1,5M€ + 10 clients payants = 300k€ ARR en 12 mois (Phase 2)
   
6. *"Pourquoi seulement 6 mois ?"*
   Tech déjà prête, pas de développement. 100% validation métier terrain

---

## Budget Détaillé - Décomposition pour export BPI

### Total : 120 000 € sur 6 mois

**Contexte : Porteur de projet seul - TJM 700€ (14k€ par personne.mois)**

**Lot 1 - Management et cadrage (19,2k€)**
- Mois : M1-M6 (6 mois)
- Personne.mois cat 1 : 0,8 PM × 14k€ = 11,2k€ (TJM 700€)
- Autres dépenses : 5k€ (déplacements clients + reporting)
- Investissements : 3k€ (station de travail + équipement amortis)

**Lot 2 - Identification et conformité légale (25k€)**
- Mois : M1-M2 (2 mois)
- Personne.mois cat 1 : 0,5 PM × 14k€ = 7k€ (TJM 700€)
- Sous-traitance : 15k€ **Conseils juridiques DORA/RGPD/AI Act**
- Autres dépenses : 3k€ (ateliers clients + documentation)

**Lot 3 - Déploiement et audit blockchain (70k€)**
- Mois : M2-M5 (4 mois)
- Personne.mois cat 1 : 0,5 PM × 14k€ = 7k€ (TJM 700€)
- Sous-traitance : 55k€ **Audit blockchain sécurité (40k€) + Tanssi infrastructure (15k€)**
- Contribution aux amortissements : 3k€ (serveur nœud blockchain)
- Autres dépenses : 3k€ (tests + intégration + doc technique)
- Investissements : 2k€ (équipement réseau)

**Lot 4 - Exécution et validation (5,8k€)**
- Mois : M4-M6 (3 mois)
- Personne.mois cat 1 : 0,2 PM × 14k€ = 2,8k€ (TJM 700€)
- Autres dépenses : 3k€ (formation + support utilisateurs)

---

### Répartition par nature de dépense

| Nature | Montant | % Budget |
|--------|---------|----------|
| **Sous-traitance** | **70k€** | **58%** |
| **Personnel (PM)** | **28k€** | **23%** |
| Autres dépenses | 14k€ | 12% |
| Investissements | 5k€ | 4% |
| Amortissements | 3k€ | 2% |
| **TOTAL** | **120k€** | **100%** |

**Sous-traitance détaillée (70k€) :**
- Conseils juridiques DORA/RGPD/AI Act : 15k€
- Audit blockchain sécurité : 40k€
- Tanssi infrastructure blockchain : 15k€

**Temps de travail porteur (TJM 700€) : 2 PM sur 6 mois = 28k€**
- Lot 1 (Management) : 0,8 PM sur 6 mois = ~3 jours/mois
- Lot 2 (Conformité) : 0,5 PM sur 2 mois = ~5 jours/mois
- Lot 3 (Déploiement) : 0,5 PM sur 4 mois = ~2,5 jours/mois
- Lot 4 (Validation) : 0,2 PM sur 3 mois = ~1,3 jours/mois

**Total temps : ~40 jours répartis sur 6 mois = charge moyenne ~7j/mois**

---

### Classification par type (pour saisie BPI)

- **Lot 1 (Management)** : Classification ADM (Administration)
- **Lot 2 (Conformité)** : Classification RI (Recherche Industrielle)
- **Lot 3 (Déploiement + Audit)** : Classification DE (Développement Expérimental)
- **Lot 4 (Validation)** : Classification DE (Développement Expérimental)

**TRL début projet** : 7 (prototype opérationnel)
**TRL fin projet** : 8 (système complet et qualifié)

