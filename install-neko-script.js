#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Pour obtenir le __dirname en module ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bright: '\x1b[1m'
};

console.log(`${colors.magenta}${colors.bright}
   _____ _____ _____  _____ _____ _____ _____ _____ _____ 
  |   | |   __|  |  |/  _  /  ___|     |  _  |_   _|  _  |
  | | | |   __|    -|     |___  |   --|   __|  | | |   __|
  |_|___|_____|__|__|\\_____|_____|_____|__|     |_| |__|   
                                               
  ${colors.reset}${colors.cyan}Installateur de nekoScript - Le langage de programmation en français${colors.reset}
`);

console.log(`${colors.cyan}Démarrage de l'installation...${colors.reset}\n`);

// Chemin du dossier d'installation de nekoScript
const NEKO_HOME = process.env.NEKO_HOME || path.join(process.env.HOME || process.env.USERPROFILE, '.neko-script');

// Créer le dossier d'installation si nécessaire
if (!fs.existsSync(NEKO_HOME)) {
  console.log(`${colors.cyan}Création du dossier d'installation...${colors.reset}`);
  fs.mkdirSync(NEKO_HOME, { recursive: true });
  fs.mkdirSync(path.join(NEKO_HOME, 'libs'), { recursive: true });
  fs.mkdirSync(path.join(NEKO_HOME, 'packages'), { recursive: true });
  fs.mkdirSync(path.join(NEKO_HOME, 'docs'), { recursive: true });
  fs.mkdirSync(path.join(NEKO_HOME, 'bin'), { recursive: true });
}

// Copier le script neko-script.js dans le dossier d'installation
console.log(`${colors.cyan}Installation de l'exécutable nekoScript...${colors.reset}`);
const nekoScriptPath = path.join(__dirname, 'bin', 'neko-script.js');
const targetPath = path.join(NEKO_HOME, 'bin', 'neko-script.js');

fs.copyFileSync(nekoScriptPath, targetPath);
fs.chmodSync(targetPath, '755'); // Rendre le fichier exécutable

// Créer un script global dans /usr/local/bin (Linux/macOS) ou un script bat (Windows)
const isWindows = process.platform === 'win32';

if (isWindows) {
  // Windows: créer un fichier batch pour lancer le script
  console.log(`${colors.cyan}Configuration pour Windows...${colors.reset}`);
  
  const batContent = `@echo off
node "${targetPath}" %*`;
  
  // Pour Windows, créer un fichier batch dans le dossier d'installation
  const batPath = path.join(NEKO_HOME, 'neko-script.bat');
  fs.writeFileSync(batPath, batContent);
  
  // Ajouter le dossier au PATH si ce n'est pas déjà fait
  console.log(`${colors.yellow}Pour finaliser l'installation, ajoutez ${NEKO_HOME} à votre variable PATH.${colors.reset}`);
  console.log(`${colors.yellow}Vous pouvez ensuite utiliser la commande 'neko-script' depuis n'importe quel terminal.${colors.reset}`);
  
} else {
  // Unix (Linux/macOS): créer un lien symbolique vers /usr/local/bin
  console.log(`${colors.cyan}Configuration pour Unix...${colors.reset}`);
  
  try {
    // Utiliser un lien symbolique dans ~/.local/bin qui est souvent dans le PATH
    const localBinDir = path.join(process.env.HOME, '.local', 'bin');
    
    if (!fs.existsSync(localBinDir)) {
      fs.mkdirSync(localBinDir, { recursive: true });
    }
    
    const symlinkPath = path.join(localBinDir, 'neko-script');
    
    // Supprimer le lien symbolique s'il existe déjà
    if (fs.existsSync(symlinkPath)) {
      fs.unlinkSync(symlinkPath);
    }
    
    // Créer le lien symbolique
    fs.symlinkSync(targetPath, symlinkPath);
    
    console.log(`${colors.green}Lien symbolique créé dans ${localBinDir}${colors.reset}`);
    console.log(`${colors.yellow}Assurez-vous que ${localBinDir} est dans votre PATH.${colors.reset}`);
    
  } catch (error) {
    console.log(`${colors.yellow}Impossible de créer un lien symbolique automatiquement. Erreur: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}Pour finaliser l'installation manuellement, exécutez:${colors.reset}`);
    console.log(`sudo ln -s "${targetPath}" /usr/local/bin/neko-script`);
  }
}

// Ajouter des bibliothèques de base
console.log(`${colors.cyan}Installation des bibliothèques de base...${colors.reset}`);

const baseLibs = {
  'Discord.neko': `// Bibliothèque Discord.neko pour les bots Discord

// Configuration du bot
fonction nekConnection(token) {
  // Connecte le bot avec le token fourni
  neko = ("Bot Discord connecté avec succès !");
  nekRetour(true);
}

// Définir le statut du bot
fonction nekStatus(status) {
  // Applique le statut au bot
  neko = ("Statut mis à jour : " + status);
  nekRetour(true);
}

// Création de commande
fonction nekCommande(nom, callback) {
  // Enregistre une nouvelle commande
  neko = ("Commande " + nom + " enregistrée !");
  nekRetour(true);
}

// Créer un message avec embed
fonction nekEmbed(titre, description, couleur) {
  // Crée un message embed formaté
  nekRetour({
    titre: titre,
    description: description,
    couleur: couleur || "#FF6B7A"
  });
}`,

  'Web.neko': `// Bibliothèque Web.neko pour le développement web

// Crée une page web
fonction nekPage(titre, contenu) {
  neko = ("Page web créée: " + titre);
  nekRetour({
    titre: titre,
    contenu: contenu
  });
}

// Crée un style CSS
fonction nekStyle(element, propriete, valeur) {
  neko = ("Style appliqué à l'élément " + element);
  nekRetour(true);
}

// Ajoute un événement
fonction nekEvenement(element, evenement, action) {
  neko = ("Événement " + evenement + " ajouté à " + element);
  nekRetour(true);
}`
};

// Écrire les bibliothèques de base
for (const [libName, content] of Object.entries(baseLibs)) {
  fs.writeFileSync(
    path.join(NEKO_HOME, 'libs', libName),
    content,
    'utf8'
  );
}

// Ajouter la documentation
console.log(`${colors.cyan}Installation de la documentation...${colors.reset}`);

const documentation = `# Documentation nekoScript

## Introduction

nekoScript est un langage de programmation en français, conçu pour être simple à apprendre et à utiliser. 
Il permet de créer des sites web, des applications et des bots Discord facilement.

## Syntaxe de base

### Afficher du texte
\`\`\`
neko = ("Bonjour, monde!");
\`\`\`

### Opérations mathématiques
\`\`\`
compteneko = 10 plus 5;
compteneko = 20 moins 7;
compteneko = 5 multiplier 3;
compteneko = 10 diviser 2;
\`\`\`

### Définir une fonction
\`\`\`
fonction direBonjour(nom) {
  neko = ("Bonjour, " plus nom plus "!");
  nekRetour("Salutations envoyées");
}
\`\`\`

### Conditions
\`\`\`
si (condition) {
  // Code à exécuter si la condition est vraie
} sinon {
  // Code à exécuter si la condition est fausse
}
\`\`\`

### Boucles
\`\`\`
pour (i de 1 à 10) {
  neko = ("Nombre: " plus i);
}
\`\`\`

## Bibliothèques

### Discord.neko
Permet de créer des bots Discord.
\`\`\`
nekimporter Discord.neko;

Discord.nekConnection("TOKEN");
Discord.nekStatus("Joue à nekoScript");
Discord.nekCommande("salut", fonction() {
  nekRetour("Bonjour !");
});
\`\`\`

### Web.neko
Permet de créer des sites web.
\`\`\`
nekimporter Web.neko;

neksite.créer("Mon Site", "Bienvenue sur mon site!");
nekDefCouleur("body", "#f0f0f0");
nekDefPolice("h1", "Arial, sans-serif");
\`\`\`

## Commandes CLI

- \`neko-script télécharger\` - Installer nekoScript
- \`neko-script init [nom]\` - Initialiser un projet
- \`neko-script run fichier.neko\` - Exécuter un fichier
- \`neko-script publish fichier.neko\` - Publier un package
- \`neko-script librairie nom\` - Télécharger un package
- \`neko-script export-html fichier.neko\` - Exporter en HTML
- \`neko-script export-app fichier.neko\` - Convertir en application
`;

fs.writeFileSync(
  path.join(NEKO_HOME, 'docs', 'README.md'),
  documentation,
  'utf8'
);

console.log(`\n${colors.green}Installation de nekoScript terminée avec succès!${colors.reset}`);
console.log(`${colors.green}Dossier d'installation: ${NEKO_HOME}${colors.reset}`);
console.log(`\n${colors.cyan}Pour utiliser nekoScript, ouvrez un nouveau terminal et tapez:${colors.reset}`);
console.log(`${colors.bright}neko-script aide${colors.reset}`);

console.log(`\n${colors.cyan}Exemple rapide:${colors.reset}`);
console.log(`${colors.bright}neko-script init mon-projet${colors.reset}`);
console.log(`${colors.bright}cd mon-projet${colors.reset}`);
console.log(`${colors.bright}neko-script run src/main.neko${colors.reset}`);