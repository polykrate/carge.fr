# 🥃 Spirits Trace v5 - Macallan 25 Years Scotland → China

## ✅ Workflow Complet Déployé sur Blockchain

### Master Workflow Hash
**`0x8a8874f71768ad02a5d2ce15af202135becfd9aa455a2c41a22e0214bc5c36e8`**

Utilisez ce hash pour démarrer le workflow avec Claude Desktop (MCP) ou via l'interface React.

### Structure v5 (7 étapes obligatoires)

| Step | Clé | Acteur | Hash |
|------|-----|--------|------|
| 1 | `production` | The Macallan Distillery | `0xa2f7bedfba1482ab9f8d0012f4051289b48b4a1e11ee686e2a2616553b03a7b0` |
| 2 | `nationalDistribution` | Edrington UK - Official Guardian | `0x06f3090b0a4f97497169025d509a7b742921a3fd8c1b8761edc86f5b97106e0b` |
| 3 | `import1` | La Maison du Whisky, Paris | `0x787d33339e6357d5e4ffc83af1e12d103e3df116e7e76803aad0b6aacf929c0c` |
| 4 | `export` | Golden Dragon Spirits, Hong Kong | `0xbdfa42dc2eb6494f65d193eff9a1b989d276f51032c4963e1eb11eecdf2a7b4b` |
| 5 | `import2` | Shanghai Premium Imports | `0xc3ab234cdc8b867e16c01aa8154cf5b8cb6c7f9db9e0b6786f2d32d0b8203a07` |
| 6 | `retail` | Emperor's Cellar - Ultra-Premium Specialist | `0x2409a55343b255e786b1167ac6abb005ddd145c940d124ec3eafa215e510b3e0` |
| 7 | `consumer` | Mr. Wei Chen (Collector) | `0xaef9ea84831037c3e7f78f10cee4a6fb21ecb5261ecfffc8042e9afe201f7d6c` |

## Nouveautés v5

### 1. Nom de l'acteur en PREMIER CHAMP
Chaque schéma commence par le nom de l'acteur pour un affichage optimal dans Verify :
- `producerName` (production)
- `distributorName` (nationalDistribution)
- `importerName` (import1 & import2)
- `exporterName` (export)
- `retailerName` (retail)
- `consumerName` (consumer)

### 2. Clés cohérentes et explicites
- ✅ `production` (au lieu de "distillation")
- ✅ `nationalDistribution` (au lieu de "transfer1")
- ✅ `import1` (premier import)
- ✅ `export` (fret international)
- ✅ `import2` (import final avec douanes locales)
- ✅ `retail` (caviste premium)
- ✅ `consumer` (consommateur final)

### 3. CIDs pour documents d'audit
Les documents importants ont des champs CID pour traçabilité :
- Import/Export licenses → `importLicenseCid`, `exportLicenseCid`
- Customs declarations → `customsDeclarationCid`
- Health certificates → `healthCertificateCid`, `gaccCertificateCid`
- Transport documents → `airWaybillCid`

## Histoire du Whisky

**Batch B47, Bouteille #92**
- Distillé : 1999
- Embouteillé : 2024
- Âge : 25 ans
- Production : 2,400 bouteilles

**Voyage (6 mois, 3 continents) :**
```
Fév 2024 : Macallan, Écosse (2,400 bottles)
    ↓
Fév 2024 : Edrington UK (2,400 bottles)
    ↓
Mars 2024 : La Maison du Whisky, Paris (500 bottles selected)
    ↓
Avril 2024 : Golden Dragon, Hong Kong (150 bottles, €180K insurance)
    ↓
Avril 2024 : Shanghai Premium Imports (150 bottles, GACC certified)
    ↓
Mai 2024 : Emperor's Cellar (Bottle #92, ¥28,800)
    ↓
Mai 2024 : Mr. Wei Chen (5/5 rating)
```

## Vérification

**QR Code sur la bouteille** → Hash de production → Chaîne complète vérifiée

M. Wei Chen peut prouver :
- ✅ 7 acteurs ont signé cryptographiquement
- ✅ Parcours complet Écosse → Shanghai vérifié
- ✅ 6 mois de voyage, €180K assurance
- ✅ Tous les documents douaniers archivés sur IPFS
- ✅ "Chaque gorgée raconte toute l'histoire"

## Fichiers du Projet

```
workflows/spirits-trace-v5/
├── schema-production-v5.json
├── schema-nationalDistribution-v5.json
├── schema-import1-v5.json
├── schema-export-v5.json
├── schema-import2-v5.json
├── schema-retail-v5.json
├── schema-consumer-v5.json
├── rag-*.json (7 fichiers RAG)
├── rag-master-v5.json
├── example-complete-workflow-v5.json
├── CIDs-v5.md
└── README-v5.md (ce fichier)
```

## Code Frontend Adapté

### Verify.jsx
```javascript
const identityFields = [
  'producerName',      // production
  'distributorName',   // nationalDistribution
  'importerName',      // import1, import2
  'exporterName',      // export
  'retailerName',      // retail
  'consumerName',      // consumer
  // ... legacy compatibility
];
```

### Home.jsx
L'exemple narratif a été mis à jour avec les 7 acteurs v5 en français et anglais.

## Déploiement Blockchain

Tous les RAG metadata sont déployés sur la blockchain Substrate avec :
- Instructions sur IPFS
- Resources (exemples) sur IPFS
- Schémas JSON sur IPFS
- Step hashes référencés dans le master workflow

**Statut : ✅ COMPLET**

---

*"Knowing exactly where this came from, who crafted it... it just tastes better. Every sip tells the whole story."* 
— Mr. Wei Chen, Shanghai

