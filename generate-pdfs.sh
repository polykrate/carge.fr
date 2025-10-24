#!/bin/bash
# Script de génération des PDFs pour le projet Carge

echo "🚀 Génération des PDFs pour Carge..."

# Options PDF communes
PDF_OPTIONS='{"format": "A4", "margin": {"top": "20mm", "right": "20mm", "bottom": "20mm", "left": "20mm"}, "printBackground": true}'

# Présentation détaillée
echo "📄 Génération: PRESENTATION_DETAILLEE_PROJET.pdf"
npx --yes md-to-pdf PRESENTATION_DETAILLEE_PROJET.md \
  --stylesheet pdf-style.css \
  --pdf-options "$PDF_OPTIONS"

# Présentation France 2030 (10 slides)
echo "📄 Génération: presentation-france2030.pdf"
npx --yes md-to-pdf presentation-france2030.md \
  --stylesheet pdf-style.css \
  --pdf-options "$PDF_OPTIONS"

# Slides BPI détaillés
echo "📄 Génération: SLIDES_BPI_FRANCE2030.pdf"
npx --yes md-to-pdf SLIDES_BPI_FRANCE2030.md \
  --stylesheet pdf-style.css \
  --pdf-options "$PDF_OPTIONS"

echo "✅ Tous les PDFs ont été générés avec succès!"
echo ""
echo "📂 Fichiers créés:"
ls -lh *.pdf | grep -E "(PRESENTATION|presentation|SLIDES)" | awk '{print "   - " $9 " (" $5 ")"}'


