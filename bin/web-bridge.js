// web-bridge.js
// Ce fichier sert de pont entre nekoScript et les technologies web

import express from 'express';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

// Obtenir __dirname en module ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Classe singleton pour gérer la création de sites web
class WebBridge {
  constructor() {
    if (WebBridge.instance) {
      return WebBridge.instance;
    }
    
    this.app = null;
    this.server = null;
    this.port = 3000;
    this.projectPath = null;
    this.siteName = null;
    this.pages = [];
    this.styles = {};
    this.scripts = {};
    this.isRunning = false;
    
    WebBridge.instance = this;
  }
  
  // Initialiser le projet web
  init(options = {}) {
    // Configurer le chemin du projet
    this.projectPath = options.path || path.join(process.cwd(), 'site-neko');
    
    // Configurer le nom du site
    this.siteName = options.name || 'Site NekoScript';
    
    // Configurer le port
    if (options.port && !isNaN(options.port)) {
      this.port = parseInt(options.port, 10);
    }
    
    // Créer le dossier du projet s'il n'existe pas
    fs.ensureDirSync(this.projectPath);
    fs.ensureDirSync(path.join(this.projectPath, 'public'));
    fs.ensureDirSync(path.join(this.projectPath, 'views'));
    
    // Initialiser Express
    this.app = express();
    
    // Configurer le moteur de template EJS
    this.app.set('view engine', 'ejs');
    this.app.set('views', path.join(this.projectPath, 'views'));
    
    // Configurer les fichiers statiques
    this.app.use(express.static(path.join(this.projectPath, 'public')));
    
    // Créer un fichier CSS par défaut
    const defaultCss = `
      /* Styles par défaut */
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 20px;
        line-height: 1.6;
      }
      header {
        margin-bottom: 20px;
      }
      nav {
        margin-bottom: 20px;
      }
      nav ul {
        list-style: none;
        padding: 0;
        display: flex;
      }
      nav ul li {
        margin-right: 15px;
      }
      nav ul li a {
        text-decoration: none;
      }
      footer {
        margin-top: 30px;
        text-align: center;
        font-size: 0.9em;
        color: #777;
      }
    `;
    
    fs.writeFileSync(
      path.join(this.projectPath, 'public', 'styles.css'),
      defaultCss,
      'utf8'
    );
    
    console.log(`Projet web initialisé: ${this.siteName}`);
    console.log(`Dossier du projet: ${this.projectPath}`);
    
    return true;
  }
  
  // Créer une page
  createPage(title, content, options = {}) {
    if (!this.app) {
      console.error('Projet web non initialisé. Utilisez init() d\'abord.');
      return false;
    }
    
    // Configurer les options de la page
    const pageOptions = {
      route: options.route || `/${title.toLowerCase().replace(/\s+/g, '-')}`,
      template: options.template || 'page'
    };
    
    // Ajouter la page à la liste
    this.pages.push({
      title,
      route: pageOptions.route,
      content,
      template: pageOptions.template
    });
    
    // Créer le template EJS s'il n'existe pas
    const templatePath = path.join(this.projectPath, 'views', `${pageOptions.template}.ejs`);
    if (!fs.existsSync(templatePath)) {
      const templateContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= title %> - <%= siteName %></title>
  <link rel="stylesheet" href="/styles.css">
  <% if (customStyles) { %>
  <style>
    <%= customStyles %>
  </style>
  <% } %>
</head>
<body>
  <header>
    <h1><%= title %></h1>
    <nav>
      <ul>
        <% pages.forEach(function(page) { %>
        <li><a href="<%= page.route %>"><%= page.title %></a></li>
        <% }); %>
      </ul>
    </nav>
  </header>
  
  <main>
    <%- content %>
  </main>
  
  <footer>
    <p>&copy; <%= new Date().getFullYear() %> <%= siteName %> - Créé avec NekoScript</p>
  </footer>
  
  <% if (customScripts) { %>
  <script>
    <%= customScripts %>
  </script>
  <% } %>
</body>
</html>`;
      
      fs.writeFileSync(templatePath, templateContent, 'utf8');
    }
    
    // Configurer la route pour cette page
    this.app.get(pageOptions.route, (req, res) => {
      res.render(pageOptions.template, {
        title,
        content,
        siteName: this.siteName,
        pages: this.pages,
        customStyles: this.styles[pageOptions.route] || '',
        customScripts: this.scripts[pageOptions.route] || ''
      });
    });
    
    console.log(`Page créée: ${title} (${pageOptions.route})`);
    return pageOptions.route;
  }
  
  // Ajouter une page d'accueil
  createHomePage(title, content) {
    if (!this.app) {
      console.error('Projet web non initialisé. Utilisez init() d\'abord.');
      return false;
    }
    
    // Créer la page
    this.createPage(title, content, { route: '/' });
    
    console.log('Page d\'accueil créée');
    return true;
  }
  
  // Ajouter des styles à une page
  addStyle(route, element, property, value) {
    if (!this.styles[route]) {
      this.styles[route] = '';
    }
    
    this.styles[route] += `${element} { ${property}: ${value}; }\n`;
    
    console.log(`Style ajouté pour ${route}: ${element} { ${property}: ${value}; }`);
    return true;
  }
  
  // Ajouter un script à une page
  addScript(route, script) {
    if (!this.scripts[route]) {
      this.scripts[route] = '';
    }
    
    this.scripts[route] += script + '\n';
    
    console.log(`Script ajouté pour ${route}`);
    return true;
  }
  
  // Démarrer le serveur web
  start() {
    if (!this.app) {
      console.error('Projet web non initialisé. Utilisez init() d\'abord.');
      return false;
    }
    
    if (this.isRunning) {
      console.log('Le serveur est déjà en cours d\'exécution.');
      return true;
    }
    
    // Ajouter une page 404 par défaut
    this.app.use((req, res) => {
      res.status(404).render('page', {
        title: 'Page non trouvée',
        content: '<p>La page que vous cherchez n\'existe pas.</p>',
        siteName: this.siteName,
        pages: this.pages,
        customStyles: '',
        customScripts: ''
      });
    });
    
    // Démarrer le serveur
    this.server = this.app.listen(this.port, () => {
      console.log(`Serveur web démarré: http://localhost:${this.port}`);
      this.isRunning = true;
    });
    
    return true;
  }
  
  // Arrêter le serveur web
  stop() {
    if (!this.server || !this.isRunning) {
      console.log('Le serveur n\'est pas en cours d\'exécution.');
      return false;
    }
    
    this.server.close(() => {
      console.log('Serveur web arrêté.');
      this.isRunning = false;
    });
    
    return true;
  }
  
  // Exporter le site en HTML statique
  exportToStatic(outputPath) {
    if (!this.app) {
      console.error('Projet web non initialisé. Utilisez init() d\'abord.');
      return false;
    }
    
    const exportPath = outputPath || path.join(process.cwd(), 'site-export');
    
    // Créer le dossier d'exportation
    fs.ensureDirSync(exportPath);
    
    // Copier les fichiers statiques
    fs.copySync(
      path.join(this.projectPath, 'public'),
      path.join(exportPath),
      { overwrite: true }
    );
    
    console.log(`Site exporté: ${exportPath}`);
    return true;
  }
}

// Exporter une instance unique du pont Web
export default new WebBridge();