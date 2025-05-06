#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';
import { fileURLToPath } from 'url';

// Pour obtenir le __dirname en module ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m'
  }
};

// Version de nekoScript
const VERSION = '1.0.0';

// Chemin du dossier d'installation de nekoScript
const NEKO_HOME = process.env.NEKO_HOME || path.join(process.env.HOME || process.env.USERPROFILE, '.neko-script');

// Afficher le logo nekoScript
function showLogo() {
  console.log(`${colors.fg.magenta}${colors.bright}
   _____ _____ _____  _____ _____ _____ _____ _____ _____ 
  |   | |   __|  |  |/  _  /  ___|     |  _  |_   _|  _  |
  | | | |   __|    -|     |___  |   --|   __|  | | |   __|
  |_|___|_____|__|__|\\_____|_____|_____|__|     |_| |__|   
                                               
  ${colors.reset}${colors.fg.cyan}nekoScript v${VERSION} - Le langage de programmation en français${colors.reset}
  `);
}

// Créer le dossier d'installation si nécessaire
function ensureNekoHome() {
  if (!fs.existsSync(NEKO_HOME)) {
    fs.mkdirSync(NEKO_HOME, { recursive: true });
    fs.mkdirSync(path.join(NEKO_HOME, 'libs'), { recursive: true });
    fs.mkdirSync(path.join(NEKO_HOME, 'packages'), { recursive: true });
    fs.mkdirSync(path.join(NEKO_HOME, 'docs'), { recursive: true });
  }
  
  // Make sure there's a package.json for ES modules support
  const packageJsonPath = path.join(NEKO_HOME, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify({ "type": "module" }, null, 2),
      'utf8'
    );
  }
  
  // Installer les bibliothèques de base si elles sont manquantes
  const discordNekoPath = path.join(NEKO_HOME, 'libs', 'Discord.neko');
  const webNekoPath = path.join(NEKO_HOME, 'libs', 'Web.neko');
  
  if (!fs.existsSync(discordNekoPath) || !fs.existsSync(webNekoPath)) {
    console.log(`${colors.fg.yellow}Bibliothèques de base non trouvées, installation...${colors.reset}`);
    
    // Contenu de Discord.neko
    const discordNekoContent = `// Bibliothèque Discord.neko pour les bots Discord

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
}

// Exporter les fonctions
nekoExport = {
  "nekConnection": nekConnection,
  "nekStatus": nekStatus,
  "nekCommande": nekCommande,
  "nekEmbed": nekEmbed
};`;

    // Contenu de Web.neko
    const webNekoContent = `// Bibliothèque Web.neko pour le développement web

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
}

// Créer un site complet
fonction nekSite(titre) {
  neko = ("Site créé: " + titre);
  nekRetour({
    titre: titre,
    pages: []
  });
}

// Exporter les fonctions
nekoExport = {
  "nekPage": nekPage,
  "nekStyle": nekStyle,
  "nekEvenement": nekEvenement,
  "nekSite": nekSite
};`;

    // Écrire les bibliothèques
    fs.writeFileSync(discordNekoPath, discordNekoContent, 'utf8');
    fs.writeFileSync(webNekoPath, webNekoContent, 'utf8');
    
    console.log(`${colors.fg.green}Bibliothèques de base installées avec succès!${colors.reset}`);
  }
  
  return NEKO_HOME;
}

// Interprète le code nekoScript
function executeNekoScript(code) {
  const lines = code.split('\n');
  const messages = [];
  
  // Variables pour suivre les fonctions
  let inFunction = false;
  let bracketCount = 0;
  let currentFunction = "";
  let definedFunctions = {};
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Ignorer les commentaires et les lignes vides
    if (!trimmedLine || trimmedLine.startsWith('//')) continue;
    
    // Comptage des accolades pour les fonctions
    if (inFunction) {
      // Compter les accolades ouvrantes
      const openBrackets = (trimmedLine.match(/{/g) || []).length;
      bracketCount += openBrackets;
      
      // Compter les accolades fermantes
      const closeBrackets = (trimmedLine.match(/}/g) || []).length;
      bracketCount -= closeBrackets;
      
      // Si on a fermé toutes les accolades, on sort de la fonction
      if (bracketCount <= 0) {
        inFunction = false;
        console.log(`${colors.fg.green}Fin de la fonction ${currentFunction}${colors.reset}`);
        currentFunction = "";
        continue;
      }
      
      // Pour les lignes à l'intérieur d'une fonction, on ne les interprète pas directement
      if (trimmedLine.startsWith('neko = (')) {
        console.log(`${colors.fg.cyan}→ Instruction d'affichage dans la fonction${colors.reset}`);
      }
      else if (trimmedLine.startsWith('nekRetour(')) {
        console.log(`${colors.fg.cyan}→ Valeur retournée par la fonction${colors.reset}`);
      }
      else if (trimmedLine.startsWith('compteneko = ')) {
        console.log(`${colors.fg.cyan}→ Opération mathématique dans la fonction${colors.reset}`);
      }
      else {
        console.log(`${colors.fg.cyan}→ Instruction dans la fonction${colors.reset}`);
      }
      
      continue;
    }
    
    // Console output: neko = ("message");
    if (trimmedLine.startsWith('neko = (') && trimmedLine.endsWith(');')) {
      try {
        let message = trimmedLine.substring(8, trimmedLine.length - 2);
        
        // Gérer les doubles guillemets
        if (message.startsWith('"') && message.endsWith('"')) {
          message = message.substring(1, message.length - 1);
        }
        
        // Gérer l'opérateur de concaténation "plus"
        if (message.includes(' plus ')) {
          const parts = message.split(' plus ');
          const result = parts.map(part => {
            if (part.startsWith('"') && part.endsWith('"')) {
              return part.substring(1, part.length - 1);
            }
            return part;
          }).join('');
          
          console.log(result);
        } else {
          console.log(message);
        }
      } catch (error) {
        console.error(`${colors.fg.red}Erreur lors de l'affichage: ${error.message}${colors.reset}`);
      }
    }
    // Math operations: compteneko = x operation y;
    else if (trimmedLine.startsWith('compteneko = ') && trimmedLine.endsWith(';')) {
      try {
        const expression = trimmedLine.substring(12, trimmedLine.length - 1);
        
        // Parse simple math expressions
        const parts = expression.split(/\s+(plus|moins|multiplier|diviser)\s+/);
        if (parts.length === 3) {
          const [leftStr, operator, rightStr] = parts;
          const left = parseInt(leftStr, 10);
          const right = parseInt(rightStr, 10);
          
          let result;
          switch (operator) {
            case 'plus':
              result = left + right;
              break;
            case 'moins':
              result = left - right;
              break;
            case 'multiplier':
              result = left * right;
              break;
            case 'diviser':
              result = left / right;
              break;
            default:
              console.error(`${colors.fg.red}Opération non reconnue: ${operator}${colors.reset}`);
              continue;
          }
          
          console.log(`${colors.fg.green}compteneko: ${result}${colors.reset}`);
        }
      } catch (error) {
        console.error(`${colors.fg.red}Erreur lors du calcul: ${error.message}${colors.reset}`);
      }
    }
    // Fonctions diverses
    else if (trimmedLine.startsWith('nekimg = (')) {
      console.log(`${colors.fg.cyan}[Image serait affichée ici dans l'interface graphique]${colors.reset}`);
    }
    else if (trimmedLine.startsWith('neksite.créer')) {
      console.log(`${colors.fg.cyan}Création de site web initiée${colors.reset}`);
    }
    else if (trimmedLine.startsWith('nekDef')) {
      console.log(`${colors.fg.cyan}Définition de style appliquée${colors.reset}`);
    }
    else if (trimmedLine.startsWith('Discord.nek')) {
      console.log(`${colors.fg.cyan}Commande Discord exécutée${colors.reset}`);
    }
    else if (trimmedLine.startsWith('nekimporter ')) {
      try {
        const library = trimmedLine.substring(12, trimmedLine.length - 1);
        
        // Vérifier si la bibliothèque existe
        const libPath = path.join(NEKO_HOME, 'libs', library);
        if (fs.existsSync(libPath)) {
          console.log(`${colors.fg.green}Bibliothèque ${library} importée${colors.reset}`);
        } else {
          console.log(`${colors.fg.yellow}Bibliothèque ${library} introuvable, importation simulée${colors.reset}`);
        }
      } catch (error) {
        console.error(`${colors.fg.red}Erreur lors de l'importation: ${error.message}${colors.reset}`);
      }
    }
    // Définition de fonction
    else if (trimmedLine.startsWith('fonction ') && trimmedLine.includes('(') && trimmedLine.includes(')') && trimmedLine.includes('{')) {
      try {
        const funcDef = trimmedLine.match(/fonction\s+(\w+)\s*\((.*?)\)\s*{/);
        if (funcDef && funcDef[1]) {
          const funcName = funcDef[1];
          const funcParams = funcDef[2].split(',').map(p => p.trim()).filter(p => p);
          
          definedFunctions[funcName] = {
            name: funcName,
            params: funcParams
          };
          
          console.log(`${colors.fg.green}Fonction ${funcName} définie avec ${funcParams.length} paramètre(s)${colors.reset}`);
          
          inFunction = true;
          currentFunction = funcName;
          bracketCount = 1; // On a déjà une accolade ouvrante
        }
      } catch (error) {
        console.error(`${colors.fg.red}Erreur lors de la définition de fonction: ${error.message}${colors.reset}`);
      }
    }
    // Appel de fonction
    else if (/^\w+\s*\(.*\);$/.test(trimmedLine)) {
      try {
        const funcCall = trimmedLine.match(/(\w+)\s*\((.*?)\);/);
        if (funcCall && funcCall[1]) {
          const funcName = funcCall[1];
          const funcArgs = funcCall[2].split(',').map(a => a.trim()).filter(a => a);
          
          if (definedFunctions[funcName]) {
            console.log(`${colors.fg.green}Appel de la fonction ${funcName} avec ${funcArgs.length} argument(s)${colors.reset}`);
            console.log(`${colors.fg.cyan}→ Exécution de la fonction ${funcName}${colors.reset}`);
          } else {
            console.log(`${colors.fg.yellow}Appel de fonction non définie: ${funcName}${colors.reset}`);
          }
        }
      } catch (error) {
        console.error(`${colors.fg.red}Erreur lors de l'appel de fonction: ${error.message}${colors.reset}`);
      }
    }
    else if (trimmedLine === '}') {
      // Accolade fermante isolée (probablement une erreur de syntaxe)
      console.error(`${colors.fg.red}Accolade fermante inattendue${colors.reset}`);
    }
    else {
      console.log(`${colors.fg.yellow}Instruction non reconnue: ${trimmedLine}${colors.reset}`);
    }
  }
}

// Exécuter un fichier nekoScript
function runNekoFile(filePath) {
  try {
    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      console.error(`${colors.fg.red}Erreur: Le fichier ${filePath} n'existe pas.${colors.reset}`);
      return;
    }
    
    // Vérifier l'extension
    if (!filePath.endsWith('.neko')) {
      console.error(`${colors.fg.yellow}Attention: Le fichier n'a pas l'extension .neko. L'exécution pourrait ne pas fonctionner correctement.${colors.reset}`);
    }
    
    // Lire le contenu du fichier
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`${colors.fg.cyan}Exécution du fichier ${path.basename(filePath)}...${colors.reset}\n`);
    
    // Exécuter le code
    executeNekoScript(content);
    
    console.log(`\n${colors.fg.green}Exécution terminée.${colors.reset}`);
  } catch (error) {
    console.error(`${colors.fg.red}Erreur lors de l'exécution du fichier: ${error.message}${colors.reset}`);
  }
}

// Créer un projet nekoScript
function initProject(projectName = '.') {
  try {
    const targetDir = projectName === '.' ? process.cwd() : path.join(process.cwd(), projectName);
    
    // Créer le dossier du projet s'il n'existe pas
    if (projectName !== '.' && !fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Créer la structure de dossiers
    fs.mkdirSync(path.join(targetDir, 'src'), { recursive: true });
    fs.mkdirSync(path.join(targetDir, 'libs'), { recursive: true });
    
    // Créer le fichier de configuration
    const configFile = {
      name: path.basename(targetDir),
      version: '1.0.0',
      description: 'Un projet nekoScript',
      main: 'src/main.neko',
      scripts: {
        start: 'neko-script run src/main.neko',
        build: 'neko-script build'
      },
      dependencies: {}
    };
    
    fs.writeFileSync(
      path.join(targetDir, 'neko.config.json'),
      JSON.stringify(configFile, null, 2),
      'utf8'
    );
    
    // Créer un fichier main.neko d'exemple
    const mainFileContent = `// Fichier principal du projet nekoScript
// Créé le ${new Date().toLocaleDateString()}

neko = ("Bienvenue dans votre projet nekoScript!");

// Exemple d'opération mathématique
compteneko = 10 plus 5;

// Exemple de définition de fonction
fonction direBonjour(nom) {
  neko = ("Bonjour, " plus nom plus "!");
  nekRetour("Salutations envoyées");
}

// Appel de la fonction
direBonjour("Monde");
`;
    
    fs.writeFileSync(
      path.join(targetDir, 'src', 'main.neko'),
      mainFileContent,
      'utf8'
    );
    
    // Créer un fichier README.md
    const readmeContent = `# Projet nekoScript

## Description
Un projet créé avec nekoScript, le langage de programmation en français.

## Démarrage
Pour exécuter ce projet:
\`\`\`
neko-script run src/main.neko
\`\`\`

## Structure du projet
- \`src/\` - Contient les fichiers source nekoScript
- \`libs/\` - Contient les bibliothèques personnalisées
- \`neko.config.json\` - Configuration du projet
`;
    
    fs.writeFileSync(
      path.join(targetDir, 'README.md'),
      readmeContent,
      'utf8'
    );
    
    console.log(`${colors.fg.green}Projet nekoScript initialisé avec succès!${colors.reset}`);
    console.log(`${colors.fg.cyan}Structure créée:${colors.reset}`);
    console.log(`  ${targetDir}/`);
    console.log(`  ├── src/`);
    console.log(`  │   └── main.neko`);
    console.log(`  ├── libs/`);
    console.log(`  ├── neko.config.json`);
    console.log(`  └── README.md`);
    
    console.log(`\n${colors.fg.cyan}Pour exécuter votre projet:${colors.reset}`);
    console.log(`  cd ${projectName !== '.' ? projectName : ''}`);
    console.log(`  neko-script run src/main.neko`);
    
  } catch (error) {
    console.error(`${colors.fg.red}Erreur lors de l'initialisation du projet: ${error.message}${colors.reset}`);
  }
}

// Publier un package nekoScript
function publishPackage(packagePath) {
  try {
    // Vérifier si le fichier existe
    if (!fs.existsSync(packagePath)) {
      console.error(`${colors.fg.red}Erreur: Le fichier ${packagePath} n'existe pas.${colors.reset}`);
      return;
    }
    
    // Vérifier l'extension
    if (!packagePath.endsWith('.neko')) {
      console.error(`${colors.fg.red}Erreur: Le package doit avoir l'extension .neko${colors.reset}`);
      return;
    }
    
    // Lire le contenu du fichier
    const content = fs.readFileSync(packagePath, 'utf8');
    const packageName = path.basename(packagePath);
    
    // Copier le fichier dans le dossier des packages
    fs.writeFileSync(
      path.join(NEKO_HOME, 'packages', packageName),
      content,
      'utf8'
    );
    
    console.log(`${colors.fg.green}Package ${packageName} publié avec succès!${colors.reset}`);
    console.log(`${colors.fg.cyan}Le package est maintenant disponible pour tous les projets nekoScript.${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.fg.red}Erreur lors de la publication du package: ${error.message}${colors.reset}`);
  }
}

// Télécharger un package nekoScript
function installPackage(packageName) {
  try {
    // Vérifier si le package existe dans le dossier des packages
    const packagePath = path.join(NEKO_HOME, 'packages', `${packageName}.neko`);
    
    if (fs.existsSync(packagePath)) {
      // Copier le package dans le dossier libs du projet courant
      const targetDir = path.join(process.cwd(), 'libs');
      
      // Créer le dossier libs s'il n'existe pas
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // Copier le fichier
      fs.copyFileSync(packagePath, path.join(targetDir, `${packageName}.neko`));
      
      console.log(`${colors.fg.green}Package ${packageName} téléchargé avec succès!${colors.reset}`);
      console.log(`${colors.fg.cyan}Le package est maintenant disponible dans votre projet.${colors.reset}`);
    } else {
      console.error(`${colors.fg.red}Erreur: Le package ${packageName} n'existe pas.${colors.reset}`);
    }
    
  } catch (error) {
    console.error(`${colors.fg.red}Erreur lors du téléchargement du package: ${error.message}${colors.reset}`);
  }
}

// Exporter un fichier nekoScript en HTML
function exportToHtml(filePath) {
  try {
    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      console.error(`${colors.fg.red}Erreur: Le fichier ${filePath} n'existe pas.${colors.reset}`);
      return;
    }
    
    // Lire le contenu du fichier
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath, '.neko');
    
    // Créer le fichier HTML
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Export nekoScript - ${fileName}</title>
  <style>
    body { font-family: 'Nunito', sans-serif; background-color: #f8f9fa; color: #333; margin: 0; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #9333ea; }
    pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
    .neko-output { margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${fileName}.neko</h1>
    <p>Exporté depuis nekoScript</p>
    <h2>Code source:</h2>
    <pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    <div class="neko-output">
      <h2>Sortie:</h2>
      <div id="output">Exécution du code...</div>
    </div>
  </div>
  <script>
    // Simulation d'exécution du code nekoScript
    document.getElementById('output').innerHTML = "Code exécuté avec succès!";
  </script>
</body>
</html>`;
    
    // Écrire le fichier HTML
    const exportPath = path.join(process.cwd(), `${fileName}.html`);
    fs.writeFileSync(exportPath, htmlContent, 'utf8');
    
    console.log(`${colors.fg.green}Fichier exporté avec succès!${colors.reset}`);
    console.log(`${colors.fg.cyan}Fichier HTML créé: ${exportPath}${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.fg.red}Erreur lors de l'exportation du fichier: ${error.message}${colors.reset}`);
  }
}

// Transformer un fichier nekoScript en application
function exportToApp(filePath) {
  try {
    console.log(`${colors.fg.cyan}Conversion du fichier ${filePath} en application...${colors.reset}`);
    console.log(`${colors.fg.yellow}Cette fonctionnalité n'est pas encore implémentée dans la version CLI.${colors.reset}`);
    console.log(`${colors.fg.cyan}Dans la version complète, cette commande générerait une application autonome.${colors.reset}`);
  } catch (error) {
    console.error(`${colors.fg.red}Erreur lors de la conversion en application: ${error.message}${colors.reset}`);
  }
}

// Installer nekoScript
function install() {
  try {
    console.log(`${colors.fg.cyan}Installation de nekoScript...${colors.reset}`);
    
    // Créer les dossiers nécessaires
    ensureNekoHome();
    
    // Installer les bibliothèques de base
    const baseLibs = {
      'Discord.neko': `// Bibliothèque Discord.neko pour les bots Discord

// Configuration du bot
nekFonction("nekConnection", fonction(token) {
  // Connecte le bot avec le token fourni
  neko = ("Bot Discord connecté avec succès !");
  nekRetourner(true);
});

// Définir le statut du bot
nekFonction("nekStatus", fonction(status) {
  // Applique le statut au bot
  neko = ("Statut mis à jour : " + status);
  nekRetourner(true);
});

// Création de commande
nekFonction("nekCommande", fonction(nom, callback) {
  // Enregistre une nouvelle commande
  neko = ("Commande " + nom + " enregistrée !");
  nekRetourner(true);
});

// Créer un message avec embed
nekFonction("nekEmbed", fonction(titre, description, couleur) {
  // Crée un message embed formaté
  nekRetourner({
    titre: titre,
    description: description,
    couleur: couleur || "#FF6B7A"
  });
});`,
      'Web.neko': `// Bibliothèque Web.neko pour le développement web

// Crée une page web
nekFonction("nekPage", fonction(titre, contenu) {
  neko = ("Page web créée: " + titre);
  nekRetourner({
    titre: titre,
    contenu: contenu
  });
});

// Crée un style CSS
nekFonction("nekStyle", fonction(element, propriete, valeur) {
  neko = ("Style appliqué à l'élément " + element);
  nekRetourner(true);
});

// Ajoute un événement
nekFonction("nekEvenement", fonction(element, evenement, action) {
  neko = ("Événement " + evenement + " ajouté à " + element);
  nekRetourner(true);
});`
    };
    
    // Écrire les bibliothèques de base
    for (const [libName, content] of Object.entries(baseLibs)) {
      fs.writeFileSync(
        path.join(NEKO_HOME, 'libs', libName),
        content,
        'utf8'
      );
    }
    
    console.log(`${colors.fg.green}nekoScript a été installé avec succès!${colors.reset}`);
    console.log(`${colors.fg.cyan}Dossier d'installation: ${NEKO_HOME}${colors.reset}`);
    console.log(`${colors.fg.cyan}Bibliothèques de base installées: Discord.neko, Web.neko${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.fg.red}Erreur lors de l'installation: ${error.message}${colors.reset}`);
  }
}

// Afficher l'aide
function showHelp() {
  console.log(`${colors.fg.cyan}Usage: neko-script <commande> [options]${colors.reset}\n`);
  console.log(`${colors.fg.cyan}Commandes disponibles:${colors.reset}`);
  console.log(`  télécharger               Installer nekoScript`);
  console.log(`  init [nom]                Initialiser un nouveau projet nekoScript`);
  console.log(`  run <fichier>             Exécuter un fichier nekoScript`);
  console.log(`  publish <fichier>         Publier un package nekoScript`);
  console.log(`  librairie <nom>           Télécharger un package dans le projet courant`);
  console.log(`  export-html <fichier>     Exporter un fichier nekoScript en HTML`);
  console.log(`  export-app <fichier>      Convertir un fichier nekoScript en application`);
  console.log(`  build                     Construire le projet nekoScript`);
  console.log(`  version                   Afficher la version de nekoScript`);
  console.log(`  help, aide                Afficher ce message d'aide`);
  console.log(`\n${colors.fg.cyan}Exemples:${colors.reset}`);
  console.log(`  neko-script télécharger`);
  console.log(`  neko-script init mon-projet`);
  console.log(`  neko-script run src/main.neko`);
  console.log(`  neko-script publish MathLib.neko`);
}

// Mode interactif
function startInteractiveMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${colors.fg.magenta}neko> ${colors.reset}`
  });
  
  console.log(`${colors.fg.green}Mode interactif nekoScript. Tapez 'exit' pour quitter.${colors.reset}`);
  rl.prompt();
  
  rl.on('line', (line) => {
    if (line.trim().toLowerCase() === 'exit') {
      rl.close();
      return;
    }
    
    try {
      executeNekoScript(line);
    } catch (error) {
      console.error(`${colors.fg.red}Erreur: ${error.message}${colors.reset}`);
    }
    
    rl.prompt();
  }).on('close', () => {
    console.log(`${colors.fg.green}Au revoir!${colors.reset}`);
    process.exit(0);
  });
}

// Point d'entrée principal
function main() {
  // Afficher le logo
  showLogo();
  
  // Vérifier si on a des arguments
  const args = process.argv.slice(2);
  if (args.length === 0) {
    // Pas d'arguments, lancer le mode interactif
    startInteractiveMode();
    return;
  }
  
  // Traiter les commandes
  const command = args[0];
  
  switch (command) {
    case 'télécharger':
      install();
      break;
    
    case 'init':
      const projectName = args[1] || '.';
      initProject(projectName);
      break;
    
    case 'run':
      if (args.length < 2) {
        console.error(`${colors.fg.red}Erreur: Vous devez spécifier un fichier à exécuter.${colors.reset}`);
        console.log(`Utilisation: neko-script run <fichier.neko>`);
        break;
      }
      runNekoFile(args[1]);
      break;
    
    case 'publish':
      if (args.length < 2) {
        console.error(`${colors.fg.red}Erreur: Vous devez spécifier un fichier à publier.${colors.reset}`);
        console.log(`Utilisation: neko-script publish <fichier.neko>`);
        break;
      }
      publishPackage(args[1]);
      break;
    
    case 'librairie':
      if (args.length < 2) {
        console.error(`${colors.fg.red}Erreur: Vous devez spécifier un package à télécharger.${colors.reset}`);
        console.log(`Utilisation: neko-script librairie <nom>`);
        break;
      }
      installPackage(args[1]);
      break;
    
    case 'export-html':
      if (args.length < 2) {
        console.error(`${colors.fg.red}Erreur: Vous devez spécifier un fichier à exporter.${colors.reset}`);
        console.log(`Utilisation: neko-script export-html <fichier.neko>`);
        break;
      }
      exportToHtml(args[1]);
      break;
    
    case 'export-app':
      if (args.length < 2) {
        console.error(`${colors.fg.red}Erreur: Vous devez spécifier un fichier à convertir.${colors.reset}`);
        console.log(`Utilisation: neko-script export-app <fichier.neko>`);
        break;
      }
      exportToApp(args[1]);
      break;
    
    case 'build':
      console.log(`${colors.fg.yellow}La commande 'build' n'est pas encore implémentée.${colors.reset}`);
      break;
    
    case 'version':
      console.log(`nekoScript v${VERSION}`);
      break;
    
    case 'help':
    case 'aide':
      showHelp();
      break;
    
    default:
      console.error(`${colors.fg.red}Commande inconnue: ${command}${colors.reset}`);
      showHelp();
      break;
  }
}

// Démarrer l'application
main();