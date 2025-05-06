import { db } from '@db';
import { files, packages, documentation } from '@shared/schema';
import { eq, and, like, isNull } from 'drizzle-orm';
import { FileTreeItem, DocSection } from '@shared/types';

// File system operations
export const storage = {
  // File operations
  async getFiles(): Promise<FileTreeItem[]> {
    try {
      // Récupérer tous les fichiers/dossiers directement de la base de données
      const allFilesResult = await db.select()
                                    .from(files)
                                    .execute();
      
      const allFiles = allFilesResult || [];
      
      // Construire manuellement la structure arborescente sans utiliser les relations
      const rootFiles = allFiles.filter(file => !file.parentId);
      
      const buildFileTree = (items: typeof allFiles): FileTreeItem[] => {
        return items.map(item => {
          const children = allFiles.filter(child => child.parentId === item.id);
          
          return {
            name: item.name,
            path: item.path,
            isFolder: item.isFolder,
            children: item.isFolder ? buildFileTree(children) : undefined
          };
        });
      };
      
      return buildFileTree(rootFiles);
    } catch (error) {
      console.error("Erreur lors de la récupération des fichiers:", error);
      return [];
    }
  },
  
  async getFileByPath(path: string) {
    return db.query.files.findFirst({
      where: eq(files.path, path)
    });
  },
  
  async createFile(name: string, content: string = '', directory: string = '/') {
    const path = directory === '/' ? `/${name}` : `${directory}/${name}`;
    
    // Get parent directory if not root
    let parentId = null;
    if (directory !== '/') {
      const parent = await db.query.files.findFirst({
        where: eq(files.path, directory)
      });
      
      if (parent && parent.isFolder) {
        parentId = parent.id;
      }
    }
    
    return db.insert(files).values({
      name,
      path,
      content,
      isFolder: false,
      parentId,
      updatedAt: new Date()
    }).returning();
  },
  
  async createFolder(name: string, directory: string = '/') {
    const path = directory === '/' ? `/${name}` : `${directory}/${name}`;
    
    // Get parent directory if not root
    let parentId = null;
    if (directory !== '/') {
      const parent = await db.query.files.findFirst({
        where: eq(files.path, directory)
      });
      
      if (parent && parent.isFolder) {
        parentId = parent.id;
      }
    }
    
    return db.insert(files).values({
      name,
      path,
      content: '',
      isFolder: true,
      parentId,
      updatedAt: new Date()
    }).returning();
  },
  
  async updateFile(path: string, content: string) {
    return db.update(files)
      .set({ 
        content, 
        updatedAt: new Date() 
      })
      .where(eq(files.path, path))
      .returning();
  },
  
  async deleteFile(path: string) {
    try {
      // Récupérer le fichier à supprimer
      const file = await db.select().from(files).where(eq(files.path, path)).execute();
      
      if (file.length > 0 && file[0].isFolder) {
        // Si c'est un dossier, récupérer tous les fichiers qui sont enfants de ce dossier
        const allFilesResult = await db.select().from(files).execute();
        const allFiles = allFilesResult || [];
        const children = allFiles.filter(child => child.parentId === file[0].id);
        
        // Supprimer récursivement tous les enfants
        for (const child of children) {
          await this.deleteFile(child.path);
        }
      }
      
      // Supprimer le fichier/dossier lui-même
      return db.delete(files).where(eq(files.path, path));
    } catch (error) {
      console.error("Erreur lors de la suppression du fichier:", error);
      throw error;
    }
  },
  
  // Package operations
  async getPackages() {
    return db.query.packages.findMany();
  },
  
  async getPackageByName(name: string) {
    return db.query.packages.findFirst({
      where: eq(packages.name, name)
    });
  },
  
  async createPackage(name: string, description: string, version: string, author: string, content: string) {
    return db.insert(packages).values({
      name,
      description,
      version,
      author,
      content,
      updatedAt: new Date()
    }).returning();
  },
  
  async updatePackage(name: string, data: Partial<{ description: string, version: string, content: string }>) {
    return db.update(packages)
      .set({ 
        ...data, 
        updatedAt: new Date() 
      })
      .where(eq(packages.name, name))
      .returning();
  },
  
  async incrementPackageDownloads(name: string) {
    const pkg = await db.query.packages.findFirst({
      where: eq(packages.name, name)
    });
    
    if (pkg) {
      return db.update(packages)
        .set({ 
          downloads: (pkg.downloads || 0) + 1
        })
        .where(eq(packages.name, name))
        .returning();
    }
    
    return null;
  },
  
  // Documentation operations
  async getDocumentation(): Promise<DocSection[]> {
    const docs = await db.query.documentation.findMany({
      orderBy: [documentation.category, documentation.order]
    });
    
    // Group by category
    const groupedDocs: Record<string, any[]> = {};
    
    docs.forEach(doc => {
      if (!groupedDocs[doc.category]) {
        groupedDocs[doc.category] = [];
      }
      
      groupedDocs[doc.category].push({
        title: doc.title,
        description: doc.content,
        code_example: doc.code_example
      });
    });
    
    // Map categories to colors
    const categoryColors: Record<string, 'primary' | 'secondary' | 'accent'> = {
      'fonctions': 'primary',
      'librairies': 'secondary',
      'terminal': 'accent'
    };
    
    // Convert to DocSections
    return Object.entries(groupedDocs).map(([category, items]) => ({
      title: category,
      color: categoryColors[category] || 'primary',
      items: items.map(item => ({
        title: item.title,
        description: item.description,
        code_example: item.code_example,
        link: undefined,
        linkText: undefined
      }))
    }));
  },
  
  // nekoScript interpreter
  executeNekoScript(code: string): { messages: { type: string; text: string; image?: string }[] } {
    const messages: { type: string; text: string; image?: string }[] = [];
    
    try {
      // Simple pattern matching for basic nekoScript functionality
      const lines = code.split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip empty lines and comments
        if (!trimmedLine || trimmedLine.startsWith('//')) {
          continue;
        }
        
        // Console output: neko = ("message");
        if (trimmedLine.startsWith('neko = (') && trimmedLine.endsWith(');')) {
          const message = trimmedLine.substring(8, trimmedLine.length - 2);
          // Remove quotes
          const cleanMessage = message.replace(/^"|"$/g, '');
          messages.push({ type: 'standard', text: cleanMessage });
        }
        
        // Math operations: compteneko = x operation y;
        else if (trimmedLine.startsWith('compteneko = ') && trimmedLine.endsWith(';')) {
          const expression = trimmedLine.substring(12, trimmedLine.length - 1);
          
          // Parse simple math expressions
          const parts = expression.split(/\s+(plus|moins|multiplier|diviser)\s+/);
          if (parts.length === 3) {
            const [leftStr, operator, rightStr] = parts;
            const left = parseInt(leftStr, 10);
            const right = parseInt(rightStr, 10);
            
            let result: number;
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
                messages.push({ type: 'error', text: `Opération non reconnue: ${operator}` });
                continue;
            }
            
            messages.push({ type: 'success', text: `compteneko: ${result}` });
          }
        }
        
        // Image display: nekimg = ("url");
        else if (trimmedLine.startsWith('nekimg = (') && trimmedLine.endsWith(');')) {
          const url = trimmedLine.substring(9, trimmedLine.length - 2);
          // Remove quotes
          const cleanUrl = url.replace(/^"|"$/g, '');
          messages.push({ 
            type: 'info', 
            text: 'Image affichée:',
            image: cleanUrl
          });
        }
        
        // Web development: neksite.créer
        else if (trimmedLine.startsWith('neksite.créer')) {
          messages.push({ type: 'info', text: 'Création de site web initiée' });
        }
        
        // Web styling: nekDefCouleur, nekDefTaille, etc.
        else if (trimmedLine.startsWith('nekDef')) {
          if (trimmedLine.startsWith('nekDefCouleur(')) {
            messages.push({ type: 'info', text: 'Style: couleur définie' });
          }
          else if (trimmedLine.startsWith('nekDefTaille(')) {
            messages.push({ type: 'info', text: 'Style: taille définie' });
          }
          else if (trimmedLine.startsWith('nekDefMarge(')) {
            messages.push({ type: 'info', text: 'Style: marge définie' });
          }
          else if (trimmedLine.startsWith('nekDefPolice(')) {
            messages.push({ type: 'info', text: 'Style: police définie' });
          }
          else if (trimmedLine.startsWith('nekDefContenu(')) {
            messages.push({ type: 'info', text: 'Contenu défini' });
          }
        }
        
        // Discord commands
        else if (trimmedLine.startsWith('Discord.nek')) {
          if (trimmedLine.startsWith('Discord.nekConnection(')) {
            messages.push({ type: 'info', text: 'Discord.neko: Connexion établie au bot' });
          }
          else if (trimmedLine.startsWith('Discord.nekStatus(')) {
            const status = trimmedLine.match(/Discord\.nekStatus\(["'](.+?)["']\)/);
            if (status && status[1]) {
              messages.push({ type: 'info', text: `Discord.neko: Status mis à jour: "${status[1]}"` });
            }
          }
          else if (trimmedLine.startsWith('Discord.nekCommande(')) {
            const command = trimmedLine.match(/Discord\.nekCommande\(["'](.+?)["']/);
            if (command && command[1]) {
              messages.push({ type: 'info', text: `Discord.neko: Commande "${command[1]}" enregistrée` });
            }
          }
          else if (trimmedLine.startsWith('Discord.nekEmbed(')) {
            messages.push({ type: 'info', text: 'Discord.neko: Embed créé' });
          }
        }
        
        // Library import: nekimporter Library.neko;
        else if (trimmedLine.startsWith('nekimporter ') && trimmedLine.endsWith(';')) {
          const library = trimmedLine.substring(12, trimmedLine.length - 1);
          messages.push({ type: 'info', text: `Bibliothèque ${library} importée` });
        }
        
        // Function definition: fonction nom() { ... }
        else if (trimmedLine.includes('fonction') && trimmedLine.includes('{')) {
          const funcName = trimmedLine.match(/fonction\s+(\w+)/);
          if (funcName && funcName[1]) {
            messages.push({ type: 'info', text: `Fonction ${funcName[1]} définie` });
          }
        }
        
        // Return statement: nekRetour("value");
        else if (trimmedLine.startsWith('nekRetour(') && trimmedLine.endsWith(');')) {
          const value = trimmedLine.substring(10, trimmedLine.length - 2);
          // Remove quotes
          const cleanValue = value.replace(/^"|"$/g, '');
          messages.push({ type: 'success', text: `Retourne: ${cleanValue}` });
        }
        
        // Unrecognized command
        else {
          messages.push({ type: 'error', text: `Commande non reconnue: ${trimmedLine}` });
        }
      }
      
      return { messages };
    } catch (error) {
      messages.push({ type: 'error', text: `Erreur d'exécution: ${(error as Error).message}` });
      return { messages };
    }
  },
  
  // Terminal command handler for nekoScript
  executeTerminalCommand(command: string): { messages: { type: string; text: string; image?: string }[] } {
    const messages: { type: string; text: string; image?: string }[] = [];
    
    try {
      const parts = command.split(' ');
      
      if (parts[0] === '$neko-script' || parts[0] === 'neko-script') {
        if (parts.length < 2) {
          messages.push({ type: 'error', text: 'Usage: $neko-script <commande> [arguments]' });
          return { messages };
        }
        
        const action = parts[1];
        
        switch (action) {
          case 'télécharger':
            messages.push({ type: 'info', text: 'Téléchargement de nekoScript...' });
            messages.push({ type: 'success', text: 'nekoScript installé avec succès!' });
            break;
            
          case 'publish':
            if (parts.length < 3) {
              messages.push({ type: 'error', text: 'Usage: $neko-script publish <nom-package>' });
            } else {
              const packageName = parts[2];
              messages.push({ type: 'info', text: `Publication de la bibliothèque ${packageName}...` });
              messages.push({ type: 'success', text: `Bibliothèque ${packageName} publiée avec succès!` });
            }
            break;
            
          case 'librairie':
            if (parts.length < 3) {
              messages.push({ type: 'error', text: 'Usage: $neko-script librairie <nom-librairie>' });
            } else {
              const libName = parts[2];
              messages.push({ type: 'info', text: `Téléchargement de la bibliothèque ${libName}...` });
              messages.push({ type: 'success', text: `Bibliothèque ${libName} téléchargée avec succès!` });
            }
            break;
            
          case 'init':
            messages.push({ type: 'info', text: 'Initialisation d\'un nouveau projet nekoScript...' });
            messages.push({ type: 'success', text: 'Projet initialisé! Fichier neko.config.json créé.' });
            break;
            
          case 'run':
            if (parts.length < 3) {
              messages.push({ type: 'error', text: 'Usage: $neko-script run <chemin-fichier>' });
            } else {
              const filePath = parts[2];
              messages.push({ type: 'info', text: `Exécution du fichier ${filePath}...` });
              messages.push({ type: 'success', text: 'Exécution terminée!' });
            }
            break;
            
          case 'build':
            messages.push({ type: 'info', text: 'Construction du projet...' });
            messages.push({ type: 'success', text: 'Projet construit avec succès! Retrouvez les fichiers dans le dossier dist/' });
            break;
            
          case 'export-html':
            messages.push({ type: 'info', text: 'Exportation du projet en HTML...' });
            messages.push({ type: 'success', text: 'Projet exporté avec succès! Retrouvez les fichiers HTML dans le dossier export/' });
            break;
            
          case 'export-app':
            messages.push({ type: 'info', text: 'Conversion du projet en application...' });
            messages.push({ type: 'success', text: 'Application créée avec succès! Retrouvez les fichiers dans le dossier app/' });
            break;
            
          case 'aide':
          case 'help':
            messages.push({ type: 'info', text: 'Commandes disponibles:' });
            messages.push({ type: 'standard', text: '  télécharger - Installe nekoScript' });
            messages.push({ type: 'standard', text: '  publish <nom> - Publie une bibliothèque' });
            messages.push({ type: 'standard', text: '  librairie <nom> - Télécharge une bibliothèque' });
            messages.push({ type: 'standard', text: '  init - Initialise un nouveau projet' });
            messages.push({ type: 'standard', text: '  run <fichier> - Exécute un fichier nekoScript' });
            messages.push({ type: 'standard', text: '  build - Construit le projet' });
            messages.push({ type: 'standard', text: '  export-html - Exporte le projet en HTML' });
            messages.push({ type: 'standard', text: '  export-app - Convertit le projet en application' });
            messages.push({ type: 'standard', text: '  aide/help - Affiche cette aide' });
            break;
            
          default:
            messages.push({ type: 'error', text: `Commande inconnue: ${action}` });
            messages.push({ type: 'info', text: 'Utilisez "$neko-script aide" pour voir les commandes disponibles' });
        }
      } else {
        // Pour les commandes qui ne commencent pas par $neko-script
        messages.push({ type: 'error', text: 'Commande inconnue. Utilisez "$neko-script" pour les commandes nekoScript.' });
      }
      
      return { messages };
    } catch (error) {
      messages.push({ type: 'error', text: `Erreur d'exécution: ${(error as Error).message}` });
      return { messages };
    }
  }
};
