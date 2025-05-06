# 🐱 nekoScript

**nekoScript** est un langage de programmation inspiré du français conçu pour être simple à apprendre tout en étant puissant. Il permet de créer des sites web, des applications et des bots Discord sans avoir besoin de connaître JavaScript ou d'autres langages complexes.

## 🚀 Installation

Pour installer nekoScript globalement via npm:

```bash
# Installation globale
npm install -g neko-script

# Vérification de l'installation
neko-script version
```

Une fois installé, vous pouvez utiliser nekoScript dans n'importe quel IDE en créant des fichiers avec l'extension `.neko`.

## 🛠️ Commandes principales

```bash
# Initialiser un nouveau projet
neko-script init mon-projet

# Exécuter un fichier nekoScript
neko-script run fichier.neko

# Afficher l'aide
neko-script aide
```

## 📝 Exemple de code

```
// Hello world en nekoScript
neko = ("Bonjour, monde!");

// Opérations mathématiques
compteneko = 5 plus 3;
compteneko = 10 moins 4;
compteneko = 5 multiplier 2;
compteneko = 20 diviser 4;

// Définition de fonction
fonction direBonjour(nom) {
  neko = ("Bonjour, " plus nom plus "!");
  nekRetour("Salutation envoyée");
}

// Appel de fonction
direBonjour("nekoScript");

// Importation d'une bibliothèque
nekimporter Web.neko;

// Création de site web
neksite.créer("Mon Site", "Bienvenue sur mon site!");
nekDefCouleur("body", "#f5f5f5");
nekDefPolice("h1", "Arial, 24px, bold");
```

## 🌟 Fonctionnalités

- Syntaxe en français facile à comprendre
- Fonctions préfixées par "nek" (nekAfficher, nekBouger, etc.)
- Support intégré pour le développement web et Discord
- Système de packages pour partager et réutiliser du code
- Possibilité d'exporter en HTML ou en application autonome
- Utilisable depuis n'importe quel IDE

## 📦 Système de packages

Créez et partagez des bibliothèques de fonctions:

```bash
# Publier un package
neko-script publish MonPackage.neko

# Installer un package
neko-script librairie MonPackage
```

## 🌐 Utilisation via API JavaScript

Si vous souhaitez intégrer nekoScript dans vos applications Node.js:

```javascript
import nekoScript from 'neko-script';

// Afficher le logo
nekoScript.showLogo();

// Exécuter du code nekoScript
const code = `
neko = ("Hello from API!");
compteneko = 5 multiplier 10;
`;

const output = await nekoScript.executeNekoCode(code);
console.log(output);

// Initialiser un projet
await nekoScript.initNekoProject('mon-nouveau-projet');
```

## 📄 Licence

nekoScript est distribué sous licence MIT.