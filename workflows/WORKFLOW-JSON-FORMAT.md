# 📋 Format JSON pour Créer un Workflow RAG

## 🎯 Structure Complète

Un workflow RAG complet nécessite **3 types de fichiers JSON** :

### 1️⃣ **Schemas JSON** (un par étape)
Définissent la structure des données pour chaque étape.

### 2️⃣ **RAG Steps** (un par étape)
Métadonnées pour chaque étape (name, description, instruction, resource, tags).

### 3️⃣ **RAG Master**
Métadonnées du workflow complet qui référence toutes les étapes.

---

## 📝 Format Détaillé

### **A. Schema JSON (par étape)**

**Fichier** : `schema-{stepKey}.json`

**Format** :
```json
{
  "type": "object",
  "required": ["{stepKey}"],
  "properties": {
    "{stepKey}": {
      "type": "object",
      "required": [
        "actorName",
        "field1",
        "field2"
      ],
      "properties": {
        "actorName": {
          "type": "string",
          "minLength": 1,
          "maxLength": 200,
          "description": "Name of the actor (FIRST FIELD - for identity display)"
        },
        "field1": {
          "type": "string",
          "description": "Your field description"
        },
        "field2": {
          "type": "integer",
          "minimum": 0,
          "description": "Your numeric field"
        }
      }
    }
  }
}
```

**✨ Règles importantes** :
- ✅ Le **premier champ** doit être le **nom de l'acteur** (`producerName`, `distributorName`, etc.)
- ✅ La clé racine (`stepKey`) encapsule toutes les propriétés
- ✅ Utiliser JSON Schema standard pour la validation

**Exemple réel** : `schema-production-v5.json`
```json
{
  "type": "object",
  "required": ["production"],
  "properties": {
    "production": {
      "type": "object",
      "required": [
        "producerName",
        "spiritType",
        "productName",
        "batchNumber"
      ],
      "properties": {
        "producerName": {
          "type": "string",
          "minLength": 1,
          "maxLength": 200,
          "description": "Name of the distillery (FIRST FIELD)"
        },
        "spiritType": {
          "type": "string",
          "enum": ["whisky", "cognac", "rum"],
          "description": "Type of spirit"
        }
      }
    }
  }
}
```

---

### **B. RAG Step JSON (par étape)**

**Fichier** : `rag-{stepKey}.json`

**Format** :
```json
{
  "name": "{stepKey}-{workflow-name}",
  "description": "Brief description of this step",
  "instruction": "Detailed instructions for filling this step.\n\nExplain what data to capture, why it matters, and any specific requirements.",
  "resource": "Example: Real-world example of this step with actual data to guide users.",
  "schema": "SEE schema-{stepKey}.json",
  "tags": ["industry", "stepKey", "step-N", "version"],
  "stepType": "{stepKey}"
}
```

**Exemple réel** : `rag-production-v5.json`
```json
{
  "name": "production-spirits-v5",
  "description": "Initial production step - Distillery creates premium spirits batch",
  "instruction": "Record the initial production of premium spirits at the distillery.\n\nKey information to capture:\n- Producer name (FIRST FIELD)\n- Spirit type and product name\n- Batch number and bottle range\n- Production dates and location",
  "resource": "Example: The Macallan Distillery produces batch B47 containing 2,400 bottles. Distilled in 1999, bottled in 2024. Age: 25 years.",
  "schema": "SEE schema-production-v5.json",
  "tags": ["spirits", "production", "step-1", "v5"],
  "stepType": "production"
}
```

---

### **C. RAG Master JSON (workflow complet)**

**Fichier** : `rag-master-{workflow}.json`

**Format** :
```json
{
  "name": "{workflow-name}",
  "description": "Complete workflow description - what it does, who it's for",
  "instruction": "MASTER WORKFLOW - {Workflow Title}\n\nComplete description of the workflow with all steps:\n\n1. STEP 1 - Description\n   Actor: Example actor\n   Key: step1\n\n2. STEP 2 - Description\n   Actor: Example actor\n   Key: step2\n\n...",
  "resource": "Real-world example of complete workflow execution with timeline, actors, and outcomes.",
  "schema": "SEE STEPS BELOW - Each step has its own schema",
  "tags": ["industry", "master", "workflow-type", "version"],
  "workflowType": "master",
  "version": "1.0",
  "steps": [
    {
      "stepNumber": 1,
      "stepKey": "step1",
      "stepName": "Step 1 Name",
      "actorExample": "Example Actor 1",
      "ragFile": "rag-step1.json",
      "schemaFile": "schema-step1.json",
      "required": true,
      "description": "What this step does"
    },
    {
      "stepNumber": 2,
      "stepKey": "step2",
      "stepName": "Step 2 Name",
      "actorExample": "Example Actor 2",
      "ragFile": "rag-step2.json",
      "schemaFile": "schema-step2.json",
      "required": true,
      "description": "What this step does"
    }
  ]
}
```

**Exemple réel** : `rag-master-v5.json`
```json
{
  "name": "spirits-trace-macallan-v5",
  "description": "Premium spirits supply chain - Macallan 25 Years Scotland to China (7 actors)",
  "instruction": "MASTER WORKFLOW - Premium Spirits Traceability v5\n\n7 mandatory steps:\n1. PRODUCTION - Distillery\n2. NATIONAL DISTRIBUTION - Official distributor\n3. IMPORT 1 - First international import\n...",
  "resource": "Real example: The Macallan 25 Year Old Sherry Oak, Batch B47, Bottle #92\n\nJourney: Feb-May 2024\n- Scotland → UK → Paris → Hong Kong → Shanghai → Retail → Consumer\n- 6 months, 3 continents, 7 signatures",
  "tags": ["spirits", "master", "macallan", "v5"],
  "workflowType": "master",
  "version": "5.0",
  "steps": [
    {
      "stepNumber": 1,
      "stepKey": "production",
      "stepName": "Production",
      "actorExample": "The Macallan Distillery",
      "ragFile": "rag-production-v5.json",
      "schemaFile": "schema-production-v5.json",
      "required": true,
      "description": "Distillery creates batch with QR codes"
    }
  ]
}
```

---

## 🚀 Processus de Déploiement

### **Étape 1 : Créer les fichiers JSON**
Pour un workflow avec N étapes, créer :
- ✅ N fichiers `schema-{stepKey}.json`
- ✅ N fichiers `rag-{stepKey}.json`  
- ✅ 1 fichier `rag-master-{workflow}.json`

### **Étape 2 : Upload sur IPFS + Blockchain**

**Pour chaque step** (dans l'ordre) :
```javascript
// 1. Upload schema sur IPFS
const schemaCid = await ipfsClient.addJson(schemaJson);

// 2. Upload instruction (optionnel)
const instructionCid = await ipfsClient.addText(ragStep.instruction);

// 3. Upload resource (optionnel)
const resourceCid = await ipfsClient.addText(ragStep.resource);

// 4. Créer RAG step sur blockchain
const stepHash = await ragClient.storeRagMetadata(
  selectedAccount,
  ragStep.name,
  ragStep.description,
  ragStep.instruction,
  ragStep.resource,
  schemaCid,
  instructionCid,
  resourceCid,
  ragStep.tags
);
```

**Pour le master** :
```javascript
// 1. Upload instruction master
const masterInstructionCid = await ipfsClient.addText(ragMaster.instruction);

// 2. Upload resource master
const masterResourceCid = await ipfsClient.addText(ragMaster.resource);

// 3. Créer RAG master avec références aux steps
const masterHash = await ragClient.storeRagMetadata(
  selectedAccount,
  ragMaster.name,
  ragMaster.description,
  ragMaster.instruction,
  ragMaster.resource,
  null, // Pas de schema pour le master
  masterInstructionCid,
  masterResourceCid,
  ragMaster.tags
);
```

---

## 📦 Structure de Dossiers Recommandée

```
workflows/
  your-workflow-v1/
    ├── rag-master-v1.json          # Master workflow
    ├── rag-step1-v1.json            # RAG metadata step 1
    ├── rag-step2-v1.json            # RAG metadata step 2
    ├── schema-step1-v1.json         # JSON Schema step 1
    ├── schema-step2-v1.json         # JSON Schema step 2
    ├── CIDs.md                      # Documentation des CIDs
    └── README.md                    # Documentation du workflow
```

---

## ✅ Checklist de Validation

Avant de déployer, vérifier :

### **Schemas JSON** :
- [ ] Le premier champ de chaque schema est le nom de l'acteur
- [ ] La clé racine correspond au `stepKey`
- [ ] Tous les champs requis sont bien marqués `required`
- [ ] Les types de données sont cohérents (string, integer, boolean, etc.)
- [ ] Les validations sont pertinentes (minLength, enum, pattern, etc.)

### **RAG Steps** :
- [ ] `name` est unique et descriptif (`{stepKey}-{workflow}`)
- [ ] `description` est claire et concise
- [ ] `instruction` explique comment remplir le formulaire
- [ ] `resource` donne un exemple concret
- [ ] `tags` incluent : industry, stepKey, step-N, version
- [ ] `stepType` correspond au `stepKey`

### **RAG Master** :
- [ ] `name` est unique (`{workflow-name}-v{version}`)
- [ ] `instruction` liste TOUTES les étapes avec acteurs et clés
- [ ] `resource` donne un exemple complet du workflow
- [ ] `steps` array contient TOUTES les étapes dans l'ordre
- [ ] Chaque step dans `steps` a : stepNumber, stepKey, stepName, actorExample, ragFile, schemaFile
- [ ] `tags` incluent : master, industry, workflow-type, version
- [ ] `workflowType` = "master"

---

## 🎓 Exemple Complet Minimal

Pour un workflow simple à 2 étapes "création → livraison" :

### `schema-creation.json`
```json
{
  "type": "object",
  "required": ["creation"],
  "properties": {
    "creation": {
      "type": "object",
      "required": ["creatorName", "productName"],
      "properties": {
        "creatorName": { "type": "string", "description": "Nom du créateur (FIRST FIELD)" },
        "productName": { "type": "string", "description": "Nom du produit" },
        "creationDate": { "type": "string", "format": "date" }
      }
    }
  }
}
```

### `rag-creation.json`
```json
{
  "name": "creation-simple-workflow",
  "description": "Étape de création du produit",
  "instruction": "Enregistrez les infos de création : créateur, produit, date.",
  "resource": "Exemple : Artisan Jean crée une chaise en chêne le 2024-01-15",
  "schema": "SEE schema-creation.json",
  "tags": ["furniture", "creation", "step-1", "v1"],
  "stepType": "creation"
}
```

### `schema-delivery.json`
```json
{
  "type": "object",
  "required": ["delivery"],
  "properties": {
    "delivery": {
      "type": "object",
      "required": ["deliveryCompany", "recipient"],
      "properties": {
        "deliveryCompany": { "type": "string", "description": "Société de livraison (FIRST FIELD)" },
        "recipient": { "type": "string", "description": "Destinataire" },
        "deliveryDate": { "type": "string", "format": "date" }
      }
    }
  }
}
```

### `rag-delivery.json`
```json
{
  "name": "delivery-simple-workflow",
  "description": "Étape de livraison au client",
  "instruction": "Enregistrez les infos de livraison : société, destinataire, date.",
  "resource": "Exemple : Chronopost livre à M. Dupont le 2024-01-20",
  "schema": "SEE schema-delivery.json",
  "tags": ["furniture", "delivery", "step-2", "v1"],
  "stepType": "delivery"
}
```

### `rag-master-simple.json`
```json
{
  "name": "simple-furniture-workflow",
  "description": "Traçabilité simple de meubles artisanaux",
  "instruction": "MASTER WORKFLOW - Meubles Artisanaux\n\n1. CREATION - Artisan crée le produit\n   Key: creation\n\n2. DELIVERY - Livraison au client\n   Key: delivery",
  "resource": "Exemple : Chaise en chêne créée par Jean le 15/01, livrée par Chronopost à M. Dupont le 20/01",
  "schema": "SEE STEPS BELOW",
  "tags": ["furniture", "master", "simple", "v1"],
  "workflowType": "master",
  "version": "1.0",
  "steps": [
    {
      "stepNumber": 1,
      "stepKey": "creation",
      "stepName": "Création",
      "actorExample": "Artisan Jean",
      "ragFile": "rag-creation.json",
      "schemaFile": "schema-creation.json",
      "required": true,
      "description": "Création du produit par l'artisan"
    },
    {
      "stepNumber": 2,
      "stepKey": "delivery",
      "stepName": "Livraison",
      "actorExample": "Chronopost",
      "ragFile": "rag-delivery.json",
      "schemaFile": "schema-delivery.json",
      "required": true,
      "description": "Livraison au client final"
    }
  ]
}
```

---

## 🎯 Résumé Ultra-Simple

**Pour créer un workflow RAG, il faut :**

1. **Schemas** : Structure des données de chaque étape (JSON Schema)
2. **RAG Steps** : Métadonnées de chaque étape (name, description, instruction, resource, tags)
3. **RAG Master** : Métadonnées du workflow complet + liste des steps

**Le tout uploadé sur IPFS + blockchain dans cet ordre :**
1. Upload schemas → CIDs
2. Create RAG steps avec CIDs → hashes
3. Create RAG master → master hash

✅ **C'est tout !**

