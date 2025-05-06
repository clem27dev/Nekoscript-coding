import express from 'express';
import path from 'path';
import fs from 'fs'; // Using standard fs module
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class WebBridge {
  constructor() {
    this.app = null;
    this.port = 5000; // Using port 5000 as in edited code
  }

  init() {
    this.app = express();
    this.app.use(express.json());
    this.app.use(express.static('public'));

    return this.app;
  }

  createPage(route, content) {
    if (!this.app) return false;

    this.app.get(route, (req, res) => {
      res.send(content);
    });

    return true;
  }

  addStyle(styles) {
    if (!this.app) return false;

    const cssPath = path.join(process.cwd(), 'public', 'styles.css');
    try {
      fs.appendFileSync(cssPath, styles);
      return true;
    } catch (error) {
      console.error('Erreur d\'ajout de styles:', error);
      return false;
    }
  }

  start() {
    if (!this.app) return false;

    this.app.listen(this.port, '0.0.0.0', () => {
      console.log(`Serveur web démarré sur le port ${this.port}`);
    });

    return true;
  }
}

export default new WebBridge();