// Utilitaires pour la commande build de neko-script
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Couleurs pour les messages dans le terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
  }
};

// Compile un script nekoScript en JavaScript
export function compileNekoToJs(sourcePath, outputPath) {
  try {
    // Vérifier si le fichier source existe
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Le fichier source ${sourcePath} n'existe pas.`);
    }

    console.log(`${colors.fg.cyan}Compilation de ${sourcePath}...${colors.reset}`);
    
    // Lire le contenu du fichier nekoScript
    const nekoCode = fs.readFileSync(sourcePath, 'utf8');
    
    // Traduire le code nekoScript en JavaScript
    const jsCode = translateNekoToJs(nekoCode);
    
    // Créer le dossier de sortie s'il n'existe pas
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Écrire le code JavaScript compilé
    fs.writeFileSync(outputPath, jsCode, 'utf8');
    
    console.log(`${colors.fg.green}✅ Compilation réussie: ${outputPath}${colors.reset}`);
    
    return true;
  } catch (error) {
    console.error(`${colors.fg.red}❌ Erreur de compilation: ${error.message}${colors.reset}`);
    return false;
  }
}

// Traduire le code nekoScript en JavaScript
function translateNekoToJs(nekoCode) {
  // Diviser le code en lignes pour le traitement
  const lines = nekoCode.split('\\n');
  const jsLines = [];
  
  // Variables pour suivre l'état de la traduction
  let inFunction = false;
  let bracketCount = 0;
  let currentFunction = "";
  
  // Ajouter l'en-tête du fichier JavaScript
  jsLines.push('// Généré automatiquement par nekoScript');
  jsLines.push('// Ne pas modifier manuellement');
  jsLines.push('');
  jsLines.push('// Fonctions de base nekoScript');
  jsLines.push('function neko(message) { console.log(message); }');
  jsLines.push('function compteneko(a, op, b) {');
  jsLines.push('  if (op === "plus") return a + b;');
  jsLines.push('  if (op === "moins") return a - b;');
  jsLines.push('  if (op === "multiplier") return a * b;');
  jsLines.push('  if (op === "diviser") return a / b;');
  jsLines.push('  throw new Error("Opération non reconnue: " + op);');
  jsLines.push('}');
  jsLines.push('');
  
  // Traiter chaque ligne du code nekoScript
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Ignorer les commentaires et les lignes vides
    if (!trimmedLine || trimmedLine.startsWith('//')) {
      jsLines.push(line); // Conserver les commentaires et les lignes vides
      continue;
    }
    
    // Traduire les instructions nekoScript en JavaScript
    
    // Instruction neko = ("message")
    if (trimmedLine.startsWith('neko = (') && trimmedLine.endsWith(');')) {
      const message = trimmedLine.substring(8, trimmedLine.length - 2);
      
      // Gérer la concaténation avec 'plus'
      if (message.includes(' plus ')) {
        const parts = message.split(' plus ').map(part => {
          if (part.startsWith('"') && part.endsWith('"')) {
            return part; // Déjà une chaîne, laisser tel quel
          }
          return part; // Pourrait être une variable ou autre
        });
        
        jsLines.push(`console.log(${parts.join(' + ')});`);
      } else {
        jsLines.push(`console.log(${message});`);
      }
      continue;
    }
    
    // Opérations mathématiques: compteneko = x operation y
    if (trimmedLine.startsWith('compteneko = ') && trimmedLine.endsWith(';')) {
      const expression = trimmedLine.substring(12, trimmedLine.length - 1);
      
      const parts = expression.split(/\\s+(plus|moins|multiplier|diviser)\\s+/);
      if (parts.length === 3) {
        const [left, operator, right] = parts;
        jsLines.push(`const result = ${left} ${translateOperator(operator)} ${right};`);
      }
      continue;
    }
    
    // Définition de fonction
    if (trimmedLine.startsWith('fonction ') && trimmedLine.includes('(') && trimmedLine.includes(')') && trimmedLine.includes('{')) {
      const funcDef = trimmedLine.match(/fonction\\s+(\\w+)\\s*\\((.*?)\\)\\s*\\{/);
      if (funcDef && funcDef[1]) {
        const funcName = funcDef[1];
        const funcParams = funcDef[2];
        
        jsLines.push(`function ${funcName}(${funcParams}) {`);
        
        inFunction = true;
        currentFunction = funcName;
        bracketCount = 1; // Déjà une accolade ouvrante
      }
      continue;
    }
    
    // Instruction nekRetour
    if (trimmedLine.startsWith('nekRetour(') && trimmedLine.endsWith(');')) {
      const returnValue = trimmedLine.substring(10, trimmedLine.length - 2);
      jsLines.push(`  return ${returnValue};`);
      continue;
    }
    
    // Structures de contrôle: si/sinon
    if (trimmedLine.startsWith('si (') && trimmedLine.includes(')') && trimmedLine.endsWith('{')) {
      const condition = trimmedLine.substring(4, trimmedLine.lastIndexOf(')')).trim();
      jsLines.push(`if (${translateCondition(condition)}) {`);
      continue;
    }
    
    if (trimmedLine === 'sinon {') {
      jsLines.push('else {');
      continue;
    }
    
    // Boucles: pour
    if (trimmedLine.startsWith('pour (') && trimmedLine.includes(' de ') && trimmedLine.includes(' à ') && trimmedLine.endsWith('{')) {
      const loopMatch = trimmedLine.match(/pour\\s+\\(\\s*(\\w+)\\s+de\\s+(\\S+)\\s+à\\s+(\\S+)\\s*\\)\\s*\\{/);
      if (loopMatch) {
        const [_, variable, start, end] = loopMatch;
        jsLines.push(`for (let ${variable} = ${start}; ${variable} <= ${end}; ${variable}++) {`);
      }
      continue;
    }
    
    // Importation de bibliothèques
    if (trimmedLine.startsWith('nekimporter ') && trimmedLine.endsWith(';')) {
      const libName = trimmedLine.substring(12, trimmedLine.length - 1);
      const jsLibName = libName.replace('.neko', '');
      jsLines.push(`const ${jsLibName} = require('./${jsLibName}');`);
      continue;
    }
    
    // Export de fonctions
    if (trimmedLine.startsWith('nekoExport = {') && !trimmedLine.endsWith(';')) {
      jsLines.push('module.exports = {');
      continue;
    }
    
    // Si aucune règle spécifique ne s'applique, conserver la ligne telle quelle
    // (utile pour les accolades, etc.)
    jsLines.push(line);
  }
  
  return jsLines.join('\\n');
}

// Traduire un opérateur nekoScript en opérateur JavaScript
function translateOperator(nekoOperator) {
  switch (nekoOperator) {
    case 'plus': return '+';
    case 'moins': return '-';
    case 'multiplier': return '*';
    case 'diviser': return '/';
    default: return nekoOperator; // Laisser inchangé si non reconnu
  }
}

// Traduire une condition nekoScript en condition JavaScript
function translateCondition(nekoCondition) {
  // Remplacer les opérateurs de comparaison en français par leurs équivalents JavaScript
  return nekoCondition
    .replace(/est égal à/g, '===')
    .replace(/n'est pas égal à/g, '!==')
    .replace(/est plus grand que/g, '>')
    .replace(/est plus petit que/g, '<')
    .replace(/est plus grand ou égal à/g, '>=')
    .replace(/est plus petit ou égal à/g, '<=');
}

// Créer un package npm à partir d'un projet nekoScript
export function buildNpmPackage(projectDir) {
  try {
    console.log(`${colors.fg.cyan}Construction du package npm...${colors.reset}`);
    
    // Vérifier si le dossier du projet existe
    if (!fs.existsSync(projectDir)) {
      throw new Error(`Le dossier du projet ${projectDir} n'existe pas.`);
    }
    
    // Vérifier le fichier de configuration nekoScript
    const configPath = path.join(projectDir, 'neko.config.json');
    if (!fs.existsSync(configPath)) {
      throw new Error(`Fichier de configuration non trouvé: ${configPath}`);
    }
    
    // Lire la configuration
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Créer le dossier dist s'il n'existe pas
    const distDir = path.join(projectDir, 'dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }
    
    // Créer un dossier temporaire pour la construction
    const buildDir = path.join(projectDir, '.build');
    if (fs.existsSync(buildDir)) {
      // Nettoyer le dossier s'il existe déjà
      fs.rmSync(buildDir, { recursive: true, force: true });
    }
    fs.mkdirSync(buildDir, { recursive: true });
    
    // Créer le package.json pour npm
    const packageJson = {
      name: config.name || 'neko-package',
      version: config.version || '1.0.0',
      description: config.description || 'Un package nekoScript',
      main: 'index.js',
      scripts: {
        test: 'echo "Error: no test specified" && exit 1'
      },
      keywords: ['nekoScript', 'français', 'programmation'],
      author: config.author || '',
      license: config.license || 'MIT'
    };
    
    fs.writeFileSync(
      path.join(buildDir, 'package.json'),
      JSON.stringify(packageJson, null, 2),
      'utf8'
    );
    
    // Compiler tous les fichiers .neko dans le dossier src
    const srcDir = path.join(projectDir, 'src');
    if (fs.existsSync(srcDir)) {
      const nekoFiles = findNekoFiles(srcDir);
      
      for (const nekoFile of nekoFiles) {
        const relativePath = path.relative(srcDir, nekoFile);
        const outputPath = path.join(buildDir, relativePath.replace('.neko', '.js'));
        
        compileNekoToJs(nekoFile, outputPath);
      }
    }
    
    // Créer l'archive npm
    console.log(`${colors.fg.cyan}Création du package npm...${colors.reset}`);
    const packageName = `${config.name}-${config.version}.tgz`;
    const outputPath = path.join(distDir, packageName);
    
    // Créer un fichier README.md si nécessaire
    if (!fs.existsSync(path.join(buildDir, 'README.md'))) {
      fs.writeFileSync(
        path.join(buildDir, 'README.md'),
        `# ${config.name}\n\n${config.description || 'Un package nekoScript'}\n`,
        'utf8'
      );
    }
    
    // Création du package npm
    try {
      process.chdir(buildDir);
      execSync('npm pack', { stdio: 'inherit' });
      
      // Déplacer le package dans le dossier dist
      fs.renameSync(
        path.join(buildDir, packageName),
        outputPath
      );
      
      console.log(`${colors.fg.green}✅ Package npm créé avec succès: ${outputPath}${colors.reset}`);
    } catch (error) {
      throw new Error(`Erreur lors de la création du package npm: ${error.message}`);
    } finally {
      // Revenir au dossier de travail précédent
      process.chdir(projectDir);
    }
    
    // Nettoyer le dossier de construction
    fs.rmSync(buildDir, { recursive: true, force: true });
    
    return true;
  } catch (error) {
    console.error(`${colors.fg.red}❌ Erreur lors de la construction du package npm: ${error.message}${colors.reset}`);
    return false;
  }
}

// Trouver tous les fichiers .neko dans un dossier (récursivement)
function findNekoFiles(dir) {
  const results = [];
  const list = fs.readdirSync(dir);
  
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      results.push(...findNekoFiles(fullPath));
    } else if (file.endsWith('.neko')) {
      results.push(fullPath);
    }
  }
  
  return results;
}

// Fonction pour créer une application exécutable
export function buildExecutable(mainFile, outputPath) {
  try {
    console.log(`${colors.fg.cyan}Création d'une application exécutable...${colors.reset}`);
    
    // Vérifier si le fichier principal existe
    if (!fs.existsSync(mainFile)) {
      throw new Error(`Le fichier principal ${mainFile} n'existe pas.`);
    }
    
    // Créer le dossier de sortie s'il n'existe pas
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // D'abord, compiler le fichier nekoScript en JavaScript
    const tempJsFile = path.join(path.dirname(outputPath), '_temp.js');
    if (!compileNekoToJs(mainFile, tempJsFile)) {
      throw new Error('La compilation a échoué.');
    }
    
    console.log(`${colors.fg.cyan}Création de l'exécutable...${colors.reset}`);
    
    // Note: Dans une implémentation réelle, on utiliserait pkg, nexe ou une autre bibliothèque 
    // pour créer un véritable exécutable. Pour cette démonstration, nous allons créer un script shell/batch 
    // qui exécute le fichier JavaScript.
    
    const isWindows = process.platform === 'win32';
    const scriptExt = isWindows ? '.bat' : '.sh';
    const scriptPath = `${outputPath}${scriptExt}`;
    
    if (isWindows) {
      // Créer un fichier batch pour Windows
      const batchContent = `@echo off
title Application nekoScript
node "${tempJsFile}" %*
pause`;
      
      fs.writeFileSync(scriptPath, batchContent, 'utf8');
    } else {
      // Créer un script shell pour Unix/Linux/macOS
      const shContent = `#!/bin/bash
# Application nekoScript
node "${tempJsFile}" "$@"`;
      
      fs.writeFileSync(scriptPath, shContent, 'utf8');
      fs.chmodSync(scriptPath, 0o755); // Rendre le script exécutable
    }
    
    console.log(`${colors.fg.green}✅ Application créée avec succès: ${scriptPath}${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.fg.red}❌ Erreur lors de la création de l'application: ${error.message}${colors.reset}`);
    return false;
  }
}