# 🐱 nekoScript

**nekoScript** est un langage de programmation inspiré du français conçu pour être simple à apprendre tout en étant puissant. Il permet de créer des sites web, des applications et des bots Discord sans avoir besoin de connaître JavaScript ou d'autres langages complexes.

## 🌟 Caractéristiques

- Syntaxe en français facile à comprendre
- Fonctions préfixées par "nek" (nekAfficher, nekBouger, etc.)
- Support intégré pour le développement web et Discord
- Système de packages pour partager et réutiliser du code
- Possibilité d'exporter en HTML ou en application autonome
- Utilisable depuis n'importe quel IDE après installation

## 🚀 Installation

Pour installer nekoScript globalement et l'utiliser depuis n'importe quel terminal ou IDE:

```bash
# Télécharger et installer nekoScript
$ ./install-neko-script.js

# Vérifier l'installation
$ neko-script version
```

Après l'installation, vous pouvez utiliser nekoScript dans n'importe quel IDE en créant des fichiers avec l'extension `.neko`.

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

## 🛠️ Fonctionnalités principales

### Développement Web

```
neksite.créer("Titre", "Contenu");
nekDefCouleur("element", "couleur");
nekDefTaille("element", "taille");
nekDefMarge("element", "marge");
nekDefPolice("element", "police");
nekDefContenu("element", "contenu");
```

### Intégration Discord

```
Discord.nekConnection("TOKEN");
Discord.nekStatus("statut");
Discord.nekCommande("nom", fonction);
Discord.nekEmbed("titre", "description", "couleur");
```

### Système de packages

Créez et partagez des bibliothèques de fonctions:

```bash
# Publier un package
$ neko-script publish MonPackage.neko

# Installer un package
$ neko-script librairie MonPackage
```

Dans votre code:
```
nekimporter MonPackage.neko;
```

## 📚 Documentation complète

Pour accéder à la documentation complète:

```bash
$ neko-script aide
```

## 🌐 Créer un nouveau projet

```bash
# Initialiser un projet
$ neko-script init mon-projet

# Exécuter le projet
$ cd mon-projet
$ neko-script run src/main.neko
```

## 📦 Exportation

```bash
# Exporter en HTML
$ neko-script export-html mon-fichier.neko

# Exporter en application
$ neko-script export-app mon-fichier.neko
```

## 🤝 Contribution

Les contributions au projet nekoScript sont les bienvenues! N'hésitez pas à améliorer le langage, ajouter des fonctionnalités ou corriger des bugs.

## 📄 Licence

nekoScript est distribué sous licence MIT.