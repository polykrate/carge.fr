# Workflow: Café Artisanal de Daloa (Côte d'Ivoire)

Traçabilité complète du café Robusta produit par les petits producteurs de la région de Daloa.

## JSON Workflow (Copier/Coller dans l'AI Builder)

```json
{
  "master": {
    "name": "cafe-daloa-v1",
    "description": "Traçabilité du café artisanal de la région de Daloa, Côte d'Ivoire. Workflow pour petits producteurs indépendants valorisant leur production locale de café Robusta.",
    "instruction": "MASTER WORKFLOW - Traçabilité Café Artisanal Daloa\n\nCe workflow permet aux petits producteurs de café de la région de Daloa (Côte d'Ivoire) de tracer leur production du champ jusqu'à la vente, valorisant ainsi leur travail et justifiant un meilleur prix.\n\nWorkflow Steps:\n1. [PRODUCTION] - Enregistrement de la récolte\n   Actor: Producteur\n   Key: production\n   \n2. [TRAITEMENT] - Transformation post-récolte\n   Actor: Producteur\n   Key: traitement\n   \n3. [STOCKAGE] - Conservation et préparation\n   Actor: Producteur/Coopérative\n   Key: stockage\n   \n4. [VENTE] - Transaction finale\n   Actor: Acheteur\n   Key: vente",
    "resource": "Exemple : Kouassi Jean-Baptiste, producteur à Digba près de Daloa, cultive 3 hectares de café Robusta. En novembre 2024, il récolte 1,5 tonne de cerises de café. Après traitement nature et séchage de 15 jours, il obtient 300kg de café parche. Il stocke sa production dans son entrepôt familial avant de la vendre à un exportateur local au prix de 450 FCFA/kg, bénéficiant d'une prime de qualité grâce à la traçabilité blockchain.",
    "tags": ["cafe", "daloa", "master", "v1"],
    "workflowType": "master",
    "version": "1.0"
  },
  "steps": [
    {
      "stepKey": "production",
      "stepName": "Production - Récolte du Café",
      "description": "Enregistrement des informations de production : identité du producteur, localisation, superficie cultivée, variété de café, quantité récoltée et pratiques agricoles utilisées.",
      "instruction": "Remplissez les informations sur votre production de café.\n\nExemple :\n- Nom : Kouassi Jean-Baptiste\n- Village : Digba\n- Superficie : 3 hectares\n- Variété : Robusta\n- Quantité récoltée : 1500 kg (cerises)\n- Date récolte : 15/11/2024\n- Pratiques : Agroforesterie traditionnelle\n- Altitude : 250m",
      "resource": "Kouassi Jean-Baptiste exploite 3 hectares de café Robusta à Digba. Sa plantation en agroforesterie traditionnelle produit des cerises de qualité. Le 15 novembre 2024, il récolte 1,5 tonne de cerises rouges à maturité optimale.",
      "tags": ["cafe", "production", "step-1", "v1"],
      "schema": {
        "type": "object",
        "required": ["production"],
        "properties": {
          "production": {
            "type": "object",
            "required": ["producteurNom", "village", "superficieHa", "varieteCafe", "quantiteRecolteeKg", "dateRecolte"],
            "properties": {
              "producteurNom": {
                "type": "string",
                "minLength": 2,
                "maxLength": 100,
                "description": "Nom complet du producteur de café (PREMIER CHAMP - OBLIGATOIRE)"
              },
              "village": {
                "type": "string",
                "minLength": 2,
                "maxLength": 100,
                "description": "Nom du village (ex: Digba, Daloa)"
              },
              "superficieHa": {
                "type": "number",
                "minimum": 0.1,
                "maximum": 100,
                "description": "Superficie cultivée en hectares"
              },
              "varieteCafe": {
                "type": "string",
                "enum": ["Robusta", "Arabusta", "Arabica", "Autre"],
                "description": "Variété de café cultivée"
              },
              "quantiteRecolteeKg": {
                "type": "number",
                "minimum": 1,
                "description": "Quantité de cerises de café récoltées en kg"
              },
              "dateRecolte": {
                "type": "string",
                "format": "date",
                "description": "Date de la récolte (format: YYYY-MM-DD)"
              },
              "pratiquesAgricoles": {
                "type": "string",
                "maxLength": 200,
                "description": "Description des pratiques (bio, agroforesterie, traditionnel, etc.)"
              },
              "altitudeM": {
                "type": "number",
                "minimum": 0,
                "maximum": 2000,
                "description": "Altitude de la plantation en mètres"
              }
            }
          }
        }
      }
    },
    {
      "stepKey": "traitement",
      "stepName": "Traitement Post-Récolte",
      "description": "Enregistrement du processus de transformation : méthode de traitement, durée de fermentation et séchage, taux d'humidité final, qualité des grains obtenus.",
      "instruction": "Décrivez comment vous avez traité votre café après la récolte.\n\nExemple :\n- Nom producteur : Kouassi Jean-Baptiste\n- Méthode : Nature (séchage direct)\n- Durée séchage : 15 jours\n- Taux humidité : 12%\n- Date fin traitement : 30/11/2024\n- Quantité café parche : 300 kg\n- Qualité : Grade 1 (grains homogènes)",
      "resource": "Après la récolte, Kouassi traite son café par méthode nature : les cerises sont étalées sur des claies de séchage pendant 15 jours. Le séchage au soleil permet d'atteindre 12% d'humidité. Il obtient 300kg de café parche de grade 1, avec des grains homogènes et sans défauts.",
      "tags": ["cafe", "traitement", "step-2", "v1"],
      "schema": {
        "type": "object",
        "required": ["traitement"],
        "properties": {
          "traitement": {
            "type": "object",
            "required": ["producteurNom", "methodeTraitement", "dureeSechageJours", "tauxHumidite", "dateFinTraitement", "quantiteCafeKg"],
            "properties": {
              "producteurNom": {
                "type": "string",
                "minLength": 2,
                "maxLength": 100,
                "description": "Nom du producteur effectuant le traitement (PREMIER CHAMP - OBLIGATOIRE)"
              },
              "methodeTraitement": {
                "type": "string",
                "enum": ["Nature", "Lavé", "Honey", "Semi-lavé"],
                "description": "Méthode de traitement utilisée"
              },
              "dureeSechageJours": {
                "type": "number",
                "minimum": 1,
                "maximum": 60,
                "description": "Durée du séchage en jours"
              },
              "tauxHumidite": {
                "type": "number",
                "minimum": 8,
                "maximum": 15,
                "description": "Taux d'humidité final en pourcentage (optimal: 11-12%)"
              },
              "dateFinTraitement": {
                "type": "string",
                "format": "date",
                "description": "Date de fin du traitement (format: YYYY-MM-DD)"
              },
              "quantiteCafeKg": {
                "type": "number",
                "minimum": 1,
                "description": "Quantité de café parche obtenue en kg"
              },
              "qualiteGrade": {
                "type": "string",
                "maxLength": 50,
                "description": "Grade de qualité (Grade 1, 2, 3, etc.)"
              },
              "observations": {
                "type": "string",
                "maxLength": 200,
                "description": "Observations sur la qualité, défauts, etc."
              }
            }
          }
        }
      }
    },
    {
      "stepKey": "stockage",
      "stepName": "Stockage et Conservation",
      "description": "Enregistrement des conditions de stockage : lieu, durée, conditions de conservation, contrôles qualité effectués avant la vente.",
      "instruction": "Indiquez où et comment vous stockez votre café.\n\nExemple :\n- Nom responsable : Kouassi Jean-Baptiste\n- Lieu stockage : Entrepôt familial Digba\n- Date début : 01/12/2024\n- Conditions : Sacs jute, ventilation naturelle\n- Température : Ambiante (20-25°C)\n- Contrôles : Vérification hebdomadaire humidité\n- Quantité : 300 kg",
      "resource": "Kouassi stocke ses 300kg de café parche dans l'entrepôt familial à Digba, dans des sacs de jute sur palettes. L'entrepôt est ventilé naturellement. Il vérifie chaque semaine le taux d'humidité pour éviter les moisissures. Le café est prêt pour la vente.",
      "tags": ["cafe", "stockage", "step-3", "v1"],
      "schema": {
        "type": "object",
        "required": ["stockage"],
        "properties": {
          "stockage": {
            "type": "object",
            "required": ["responsableNom", "lieuStockage", "dateDebut", "quantiteStockeeKg"],
            "properties": {
              "responsableNom": {
                "type": "string",
                "minLength": 2,
                "maxLength": 100,
                "description": "Nom du responsable du stockage (PREMIER CHAMP - OBLIGATOIRE)"
              },
              "lieuStockage": {
                "type": "string",
                "minLength": 2,
                "maxLength": 150,
                "description": "Lieu précis du stockage (entrepôt, coopérative, etc.)"
              },
              "dateDebut": {
                "type": "string",
                "format": "date",
                "description": "Date de mise en stockage (format: YYYY-MM-DD)"
              },
              "quantiteStockeeKg": {
                "type": "number",
                "minimum": 1,
                "description": "Quantité de café stockée en kg"
              },
              "conditionsStockage": {
                "type": "string",
                "maxLength": 200,
                "description": "Description des conditions (sacs, température, ventilation)"
              },
              "controlesQualite": {
                "type": "string",
                "maxLength": 200,
                "description": "Contrôles effectués pendant le stockage"
              },
              "typeConditionnement": {
                "type": "string",
                "enum": ["Sacs jute", "Sacs plastique", "Sacs toile", "Vrac", "Autre"],
                "description": "Type de conditionnement utilisé"
              }
            }
          }
        }
      }
    },
    {
      "stepKey": "vente",
      "stepName": "Vente Finale",
      "description": "Enregistrement de la transaction commerciale : identité de l'acheteur, quantité vendue, prix unitaire et total, date de vente, destination finale du café.",
      "instruction": "Enregistrez les informations de vente de votre café.\n\nExemple :\n- Nom vendeur : Kouassi Jean-Baptiste\n- Nom acheteur : SARL Export Café Ivoire\n- Quantité vendue : 300 kg\n- Prix unitaire : 450 FCFA/kg\n- Prix total : 135 000 FCFA\n- Date vente : 15/12/2024\n- Destination : Export Europe\n- Prime qualité : 50 FCFA/kg (traçabilité)",
      "resource": "Le 15 décembre 2024, Kouassi vend ses 300kg de café à la SARL Export Café Ivoire au prix de 450 FCFA/kg, soit 135 000 FCFA. Grâce à la traçabilité blockchain prouvant l'origine et la qualité, il obtient une prime de 50 FCFA/kg. Le café sera exporté vers l'Europe.",
      "tags": ["cafe", "vente", "step-4", "v1"],
      "schema": {
        "type": "object",
        "required": ["vente"],
        "properties": {
          "vente": {
            "type": "object",
            "required": ["vendeurNom", "acheteurNom", "quantiteVendueKg", "prixUnitaireFCFA", "prixTotalFCFA", "dateVente"],
            "properties": {
              "vendeurNom": {
                "type": "string",
                "minLength": 2,
                "maxLength": 100,
                "description": "Nom du producteur vendeur (PREMIER CHAMP - OBLIGATOIRE)"
              },
              "acheteurNom": {
                "type": "string",
                "minLength": 2,
                "maxLength": 150,
                "description": "Nom de l'acheteur (société, coopérative, exportateur)"
              },
              "quantiteVendueKg": {
                "type": "number",
                "minimum": 1,
                "description": "Quantité de café vendue en kg"
              },
              "prixUnitaireFCFA": {
                "type": "number",
                "minimum": 1,
                "description": "Prix unitaire en Francs CFA par kg"
              },
              "prixTotalFCFA": {
                "type": "number",
                "minimum": 1,
                "description": "Prix total de la transaction en Francs CFA"
              },
              "dateVente": {
                "type": "string",
                "format": "date",
                "description": "Date de la vente (format: YYYY-MM-DD)"
              },
              "destinationFinale": {
                "type": "string",
                "maxLength": 100,
                "description": "Destination du café (Export Europe, Marché local, etc.)"
              },
              "primeQualiteFCFA": {
                "type": "number",
                "minimum": 0,
                "description": "Prime de qualité obtenue grâce à la traçabilité (FCFA/kg)"
              },
              "numeroTransaction": {
                "type": "string",
                "maxLength": 50,
                "description": "Numéro de reçu ou de transaction"
              }
            }
          }
        }
      }
    }
  ]
}
```

## 📋 Vue d'ensemble

| **Étape** | **Acteur** | **Description** |
|-----------|-----------|-----------------|
| 1. Production | Producteur | Enregistrement de la récolte (superficie, variété, quantité) |
| 2. Traitement | Producteur | Transformation post-récolte (séchage, qualité) |
| 3. Stockage | Producteur/Coopérative | Conservation et conditions de stockage |
| 4. Vente | Acheteur | Transaction finale avec prime de qualité |

## 🎯 Cas d'Usage

**Producteur** : Kouassi Jean-Baptiste, Digba (Daloa)
- **Superficie** : 3 hectares de café Robusta
- **Production** : 1,5 tonne de cerises → 300kg de café parche
- **Méthode** : Agroforesterie traditionnelle, séchage nature
- **Prix de vente** : 450 FCFA/kg (+ 50 FCFA/kg de prime traçabilité)
- **Destination** : Export Europe

## 💰 Valorisation par la Traçabilité

La traçabilité blockchain permet à Kouassi de :
1. **Prouver l'origine** : Certification du terroir de Daloa
2. **Justifier la qualité** : Méthodes traditionnelles documentées
3. **Obtenir une prime** : +11% de prix grâce à la transparence
4. **Accéder aux marchés** : Export vers l'Europe avec garantie d'authenticité

## 🔧 Déploiement

1. Aller sur [carge.fr/ai](https://carge.fr/ai)
2. Copier le JSON ci-dessus
3. Coller dans l'AI Builder
4. Cliquer sur "Deploy Workflow"
5. Signer une seule fois avec votre wallet Polkadot
6. Le workflow sera déployé sur la blockchain en <2 minutes

## 📊 Limites Blockchain Respectées

| **Limite** | **Valeur** | **Statut** |
|-----------|-----------|-----------|
| Nom master | 16 chars | ✅ `cafe-daloa-v1` |
| Description master | 158 chars | ✅ <300 |
| Tags master | 4 tags | ✅ <10 |
| Nombre d'étapes | 4 steps | ✅ <64 |
| Nom step (stepKey-master) | Max 32 chars | ✅ OK |

## 🌍 Impact Social

Ce workflow blockchain permet aux **petits producteurs africains** de :
- Valoriser leur travail avec une preuve cryptographique
- Obtenir des prix justes grâce à la transparence
- Accéder aux marchés internationaux premium
- Construire une réputation vérifiable on-chain

**La blockchain au service de l'économie réelle africaine** 🇨🇮☕

