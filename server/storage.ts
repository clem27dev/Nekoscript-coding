import { db } from '@db';
import { files, packages, documentation } from '@shared/schema';
import { eq, and, like, isNull } from 'drizzle-orm';
import { FileTreeItem, DocSection } from '@shared/types';

// File system operations
export const storage = {
  // File operations
  async getFiles(): Promise<FileTreeItem[]> {
    const allFiles = await db.query.files.findMany({
      with: {
        children: true
      }
    });
    
    // Convert to tree structure
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
    // First check if it's a folder with children
    const file = await db.query.files.findFirst({
      where: eq(files.path, path),
      with: {
        children: true
      }
    });
    
    if (file && file.isFolder && file.children && file.children.length > 0) {
      // Delete all children recursively
      for (const child of file.children) {
        await this.deleteFile(child.path);
      }
    }
    
    return db.delete(files).where(eq(files.path, path));
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
  }
};
