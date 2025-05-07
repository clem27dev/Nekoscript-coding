// Point d'entrée du module nekoScript
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Obtenir le chemin du dossier du module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Version de nekoScript
export const VERSION = '1.0.4';

// Chemin du dossier d'installation de nekoScript
export const NEKO_HOME = process.env.NEKO_HOME || path.join(process.env.HOME || process.env.USERPROFILE, '.neko-script');

// Fonction pour afficher le logo nekoScript
export function showLogo() {
  const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    fg: {
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
    }
  };

  console.log(`${colors.fg.magenta}${colors.bright}
   _____ _____ _____  _____ _____ _____ _____ _____ _____ 
  |   | |   __|  |  |/  _  /  ___|     |  _  |_   _|  _  |
  | | | |   __|    -|     |___  |   --|   __|  | | |   __|
  |_|___|_____|__|__|\\_____|_____|_____|__|     |_| |__|   
                                               
  ${colors.reset}${colors.fg.cyan}nekoScript v${VERSION} - Le langage de programmation en français${colors.reset}
  `);
}

// Fonction pour interagir avec l'API nekoScript depuis d'autres modules JavaScript
export function executeNekoCode(code) {
  const nekoScriptPath = path.join(__dirname, '..', 'bin', 'neko-script.js');
  if (!fs.existsSync(nekoScriptPath)) {
    throw new Error(`Impossible de trouver l'exécutable nekoScript à ${nekoScriptPath}`);
  }

  // Créer un fichier temporaire
  const tempDir = path.join(NEKO_HOME, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempFile = path.join(tempDir, `exec_${Date.now()}.neko`);
  fs.writeFileSync(tempFile, code, 'utf8');

  try {
    // Exécuter le fichier temporaire
    const { execSync } = await import('child_process');
    const output = execSync(`node ${nekoScriptPath} run ${tempFile}`, { encoding: 'utf8' });
    return output;
  } catch (error) {
    throw new Error(`Erreur lors de l'exécution du code nekoScript: ${error.message}`);
  } finally {
    // Supprimer le fichier temporaire
    fs.unlinkSync(tempFile);
  }
}

// Fonction pour initialiser un projet nekoScript par programmation
export async function initNekoProject(projectName, options = {}) {
  const nekoScriptPath = path.join(__dirname, '..', 'bin', 'neko-script.js');
  if (!fs.existsSync(nekoScriptPath)) {
    throw new Error(`Impossible de trouver l'exécutable nekoScript à ${nekoScriptPath}`);
  }

  try {
    const { execSync } = await import('child_process');
    const output = execSync(`node ${nekoScriptPath} init ${projectName}`, { encoding: 'utf8' });
    return output;
  } catch (error) {
    throw new Error(`Erreur lors de l'initialisation du projet nekoScript: ${error.message}`);
  }
}

// Exposer les fonctions principales
export default {
  VERSION,
  NEKO_HOME,
  showLogo,
  executeNekoCode,
  initNekoProject
};