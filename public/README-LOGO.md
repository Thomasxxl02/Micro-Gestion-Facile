# Logo Micro-Gestion-Facile

## Fichiers disponibles

- **`logo.svg`** - Logo vectoriel source (512x512px)

## Conversion en PNG pour GitHub OAuth

### Option 1 : Service en ligne (Recommandé)

1. Allez sur https://svgtopng.com
2. Uploadez `logo.svg`
3. Sélectionnez **512x512 pixels**
4. Téléchargez le PNG

### Option 2 : Avec Inkscape (si installé)

```bash
inkscape logo.svg --export-type=png --export-width=512 --export-height=512 -o logo.png
```

### Option 3 : Avec un navigateur

1. Ouvrez `logo.svg` dans Chrome/Firefox
2. Clic droit → "Inspecter"
3. Dans la console, tapez :

```javascript
const canvas = document.createElement("canvas");
canvas.width = 512;
canvas.height = 512;
const ctx = canvas.getContext("2d");
const img = new Image();
img.onload = () => {
  ctx.drawImage(img, 0, 0, 512, 512);
  const link = document.createElement("a");
  link.download = "logo.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
};
img.src = "logo.svg";
```

## Caractéristiques du logo

- **Dimensions :** 512x512 pixels
- **Format :** SVG (vectoriel, redimensionnable)
- **Couleurs :**
  - Fond gradient : Bleu (#2563eb → #1e40af)
  - Facture : Blanc avec opacité
  - Badge "MICRO" : Vert (#059669)
  - Symbole € : Blanc
- **Éléments :**
  - Icône de facture stylisée
  - Symbole Euro en grand
  - Badge "MICRO" (coin supérieur droit)
  - Petite calculatrice (coin supérieur gauche)

## Usage

### Pour GitHub OAuth App

Upload du PNG 512x512px dans les paramètres de l'application OAuth.

### Pour PWA Manifest

```json
{
  "icons": [
    {
      "src": "/logo.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### Pour HTML

```html
<link rel="icon" type="image/svg+xml" href="/logo.svg" />
<link rel="apple-touch-icon" href="/logo.png" />
```

## Personnalisation

Si vous souhaitez modifier les couleurs, éditez le fichier `logo.svg` :

- **Ligne 5** : Gradient principal (fond)
- **Ligne 7-8** : Couleurs du gradient
- **Ligne 49** : Badge "MICRO" (couleur de fond)

---

**Créé le :** 19 avril 2026  
**Auteur :** GitHub Copilot  
**License :** Propriété de Micro-Gestion-Facile
