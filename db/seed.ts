import { db } from "./index";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

async function seed() {
  try {
    // Seed default files
    const existingMainFile = await db.query.files.findFirst({
      where: eq(schema.files.path, "/src/main.neko")
    });

    if (!existingMainFile) {
      // Create src folder
      const srcFolder = await db.insert(schema.files).values({
        name: "src",
        path: "/src",
        isFolder: true,
        content: "",
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      // Create main.neko file
      await db.insert(schema.files).values({
        name: "main.neko",
        path: "/src/main.neko",
        isFolder: false,
        parentId: srcFolder[0].id,
        content: `// Exemple de code nekoScript
// Affichage d'un message dans la console
neko = ("Bienvenue dans nekoScript!");

// Calculs mathématiques
compteneko = 10 plus 5;
compteneko = 20 moins 7;
compteneko = 4 multiplier 3;
compteneko = 10 diviser 2;

// Affichage d'une image
nekimg = ("https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&h=350");

// Utilisation de la bibliothèque Discord
nekimporter Discord.neko;

Discord.nekConnection("TOKEN_BOT");
Discord.nekStatus("Joue à nekoScript");

Discord.nekCommande("salut", fonction() {
  nekRetour("Miaou ! 😺");
});`,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Create site.neko file
      await db.insert(schema.files).values({
        name: "site.neko",
        path: "/src/site.neko",
        isFolder: false,
        parentId: srcFolder[0].id,
        content: `// Exemple de création de site web avec nekoScript

neksite.créer, script {
  contenu: ("Mon Site nekoScript"),
  titre: "Mon site internet",
  lang: "fr",
  couleur-de-fond: "#1E1E2E",
  
  style {
    nekDefCouleur("#titre", "couleur", "#FF6B7A");
    nekDefTaille("#titre", "taille-texte", "32px");
    nekDefMarge("#titre", "marge-bas", "20px");
    
    nekDefCouleur("body", "couleur", "#FFFFFF");
    nekDefTaille("body", "taille-texte", "16px");
    nekDefPolice("body", "police", "Nunito, sans-serif");
  }
  
  script {
    nekFonction("afficherMessage", fonction() {
      neko = ("Bouton cliqué !");
      nekDefContenu("#message", "Miaou ! Vous avez cliqué sur le bouton !");
    });
  }
}`,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Create libs folder and Discord.neko file
    const existingLibsFolder = await db.query.files.findFirst({
      where: eq(schema.files.path, "/libs")
    });

    if (!existingLibsFolder) {
      const libsFolder = await db.insert(schema.files).values({
        name: "libs",
        path: "/libs",
        isFolder: true,
        content: "",
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      await db.insert(schema.files).values({
        name: "Discord.neko",
        path: "/libs/Discord.neko",
        isFolder: false,
        parentId: libsFolder[0].id,
        content: `// Bibliothèque Discord.neko pour les bots Discord

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
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Create README.md file
    const existingReadmeFile = await db.query.files.findFirst({
      where: eq(schema.files.path, "/README.md")
    });

    if (!existingReadmeFile) {
      await db.insert(schema.files).values({
        name: "README.md",
        path: "/README.md",
        isFolder: false,
        content: `# nekoScript 🐱

Un langage de programmation français inspiré pour créer des sites web, des jeux, et des bots Discord.

## Installation

\`\`\`
$neko-script télécharger
\`\`\`

## Exemples d'utilisation

### Afficher un message

\`\`\`
neko = ("Bonjour le monde !");
\`\`\`

### Calculs mathématiques

\`\`\`
compteneko = 5 plus 3;
compteneko = 10 moins 4;
compteneko = 3 multiplier 6;
compteneko = 8 diviser 2;
\`\`\`

### Créer un bot Discord

\`\`\`
nekimporter Discord.neko;

Discord.nekConnection("TOKEN_BOT");
Discord.nekStatus("Joue à nekoScript");

Discord.nekCommande("salut", fonction() {
  nekRetour("Miaou ! 😺");
});
\`\`\`

## Documentation

Consultez la documentation complète pour en savoir plus sur nekoScript.

## Licence

MIT
`,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Create neko.config.json file
    const existingConfigFile = await db.query.files.findFirst({
      where: eq(schema.files.path, "/neko.config.json")
    });

    if (!existingConfigFile) {
      await db.insert(schema.files).values({
        name: "neko.config.json",
        path: "/neko.config.json",
        isFolder: false,
        content: `{
  "name": "my-neko-project",
  "version": "1.0.0",
  "description": "Mon projet nekoScript",
  "author": "Votre Nom",
  "main": "src/main.neko",
  "scripts": {
    "start": "neko-script run src/main.neko",
    "build": "neko-script build"
  },
  "dependencies": {
    "Discord.neko": "^1.0.0",
    "Web.neko": "^1.2.0"
  }
}`,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Seed documentation
    const existingDocs = await db.query.documentation.findMany();
    
    if (existingDocs.length === 0) {
      // Base functions documentation
      await db.insert(schema.documentation).values([
        {
          title: 'neko = ("message");',
          category: 'fonctions',
          content: 'Affiche un message dans la console',
          order: 1
        },
        {
          title: 'compteneko = x opération y;',
          category: 'fonctions',
          content: 'Effectue des opérations mathématiques',
          order: 2
        },
        {
          title: 'nekimg = ("url");',
          category: 'fonctions',
          content: 'Affiche une image depuis une URL',
          order: 3
        },
        {
          title: 'Discord.neko',
          category: 'librairies',
          content: 'Gestion des bots Discord',
          order: 1
        },
        {
          title: 'Web.neko',
          category: 'librairies',
          content: 'Création de sites web',
          order: 2
        },
        {
          title: 'Jeu.neko',
          category: 'librairies',
          content: 'Développement de jeux',
          order: 3
        },
        {
          title: '$neko-script télécharger',
          category: 'terminal',
          content: 'Installe nekoScript',
          order: 1
        },
        {
          title: '$neko-script publish nom',
          category: 'terminal',
          content: 'Publie une bibliothèque',
          order: 2
        },
        {
          title: '$neko-script librairie nom',
          category: 'terminal',
          content: 'Télécharge une bibliothèque',
          order: 3
        }
      ]);
    }

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seed();
