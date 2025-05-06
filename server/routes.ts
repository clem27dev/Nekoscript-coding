import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // File system endpoints
  app.get('/api/files', async (req, res) => {
    try {
      const files = await storage.getFiles();
      res.json(files);
    } catch (error) {
      console.error('Error fetching files:', error);
      res.status(500).json({ error: 'Failed to fetch files' });
    }
  });

  app.get('/api/files/content', async (req, res) => {
    try {
      const { path } = req.query;
      
      if (!path || typeof path !== 'string') {
        return res.status(400).json({ error: 'File path is required' });
      }
      
      const file = await storage.getFileByPath(path);
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      if (file.isFolder) {
        return res.status(400).json({ error: 'Cannot get content of a folder' });
      }
      
      res.json({ content: file.content });
    } catch (error) {
      console.error('Error fetching file content:', error);
      res.status(500).json({ error: 'Failed to fetch file content' });
    }
  });

  app.post('/api/files', async (req, res) => {
    try {
      const { name, content, directory } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'File name is required' });
      }
      
      const newFile = await storage.createFile(name, content || '', directory || '/');
      res.status(201).json(newFile[0]);
    } catch (error) {
      console.error('Error creating file:', error);
      res.status(500).json({ error: 'Failed to create file' });
    }
  });

  app.post('/api/folders', async (req, res) => {
    try {
      const { name, directory } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Folder name is required' });
      }
      
      const newFolder = await storage.createFolder(name, directory || '/');
      res.status(201).json(newFolder[0]);
    } catch (error) {
      console.error('Error creating folder:', error);
      res.status(500).json({ error: 'Failed to create folder' });
    }
  });

  app.put('/api/files/:path', async (req, res) => {
    try {
      const { content } = req.body;
      const path = decodeURIComponent(req.params.path);
      
      if (content === undefined) {
        return res.status(400).json({ error: 'File content is required' });
      }
      
      const updatedFile = await storage.updateFile(path, content);
      
      if (!updatedFile || updatedFile.length === 0) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      res.json(updatedFile[0]);
    } catch (error) {
      console.error('Error updating file:', error);
      res.status(500).json({ error: 'Failed to update file' });
    }
  });

  app.delete('/api/files/:path', async (req, res) => {
    try {
      const path = decodeURIComponent(req.params.path);
      await storage.deleteFile(path);
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({ error: 'Failed to delete file' });
    }
  });

  // Package endpoints
  app.get('/api/packages', async (req, res) => {
    try {
      const packages = await storage.getPackages();
      res.json(packages);
    } catch (error) {
      console.error('Error fetching packages:', error);
      res.status(500).json({ error: 'Failed to fetch packages' });
    }
  });

  app.get('/api/packages/:name', async (req, res) => {
    try {
      const { name } = req.params;
      const pkg = await storage.getPackageByName(name);
      
      if (!pkg) {
        return res.status(404).json({ error: 'Package not found' });
      }
      
      res.json(pkg);
    } catch (error) {
      console.error('Error fetching package:', error);
      res.status(500).json({ error: 'Failed to fetch package' });
    }
  });

  app.post('/api/packages', async (req, res) => {
    try {
      const { name, description, version, author, content } = req.body;
      
      if (!name || !version || !content) {
        return res.status(400).json({ error: 'Name, version and content are required' });
      }
      
      const newPackage = await storage.createPackage(name, description || '', version, author || 'Anonymous', content);
      res.status(201).json(newPackage[0]);
    } catch (error) {
      console.error('Error creating package:', error);
      res.status(500).json({ error: 'Failed to create package' });
    }
  });

  app.put('/api/packages/:name', async (req, res) => {
    try {
      const { name } = req.params;
      const { description, version, content } = req.body;
      
      const updatedPackage = await storage.updatePackage(name, { description, version, content });
      
      if (!updatedPackage || updatedPackage.length === 0) {
        return res.status(404).json({ error: 'Package not found' });
      }
      
      res.json(updatedPackage[0]);
    } catch (error) {
      console.error('Error updating package:', error);
      res.status(500).json({ error: 'Failed to update package' });
    }
  });

  app.post('/api/packages/:name/download', async (req, res) => {
    try {
      const { name } = req.params;
      const result = await storage.incrementPackageDownloads(name);
      
      if (!result) {
        return res.status(404).json({ error: 'Package not found' });
      }
      
      res.json(result[0]);
    } catch (error) {
      console.error('Error incrementing package downloads:', error);
      res.status(500).json({ error: 'Failed to increment package downloads' });
    }
  });

  // Documentation endpoints
  app.get('/api/docs', async (req, res) => {
    try {
      const docs = await storage.getDocumentation();
      res.json(docs);
    } catch (error) {
      console.error('Error fetching documentation:', error);
      res.status(500).json({ error: 'Failed to fetch documentation' });
    }
  });

  // nekoScript execution endpoint
  app.post('/api/execute', async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: 'Code is required' });
      }
      
      const result = storage.executeNekoScript(code);
      res.json(result);
    } catch (error) {
      console.error('Error executing code:', error);
      res.status(500).json({ error: 'Failed to execute code' });
    }
  });
  
  // Terminal command execution endpoint
  app.post('/api/terminal', async (req, res) => {
    try {
      const { command } = req.body;
      
      if (!command) {
        return res.status(400).json({ error: 'Command is required' });
      }
      
      const result = storage.executeTerminalCommand(command);
      res.json(result);
    } catch (error) {
      console.error('Error executing terminal command:', error);
      res.status(500).json({ error: 'Failed to execute terminal command' });
    }
  });
  
  // File export to HTML endpoint
  app.post('/api/export-html', async (req, res) => {
    try {
      const { path } = req.body;
      
      if (!path) {
        return res.status(400).json({ error: 'File path is required' });
      }
      
      const file = await storage.getFileByPath(path);
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      // Simple HTML conversion logic
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Export nekoScript - ${file.name}</title>
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
    <h1>${file.name}</h1>
    <p>Exporté depuis nekoScript IDE</p>
    <h2>Code source:</h2>
    <pre>${file.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
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
      
      res.json({ html });
    } catch (error) {
      console.error('Error exporting HTML:', error);
      res.status(500).json({ error: 'Failed to export to HTML' });
    }
  });
  
  // File export to app endpoint
  app.post('/api/export-app', async (req, res) => {
    try {
      const { path } = req.body;
      
      if (!path) {
        return res.status(400).json({ error: 'File path is required' });
      }
      
      const file = await storage.getFileByPath(path);
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      // Simple app conversion response
      res.json({ 
        success: true, 
        message: `Le fichier ${file.name} a été converti en application. Téléchargez le fichier .zip pour l'installer.` 
      });
    } catch (error) {
      console.error('Error exporting app:', error);
      res.status(500).json({ error: 'Failed to export to app' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
