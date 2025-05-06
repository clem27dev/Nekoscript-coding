import React, { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { FileExplorer } from '@/components/file-explorer';
import { EditorTabs } from '@/components/editor-tabs';
import { CodeEditor } from '@/components/code-editor';
import { Console } from '@/components/console';
import { DocumentationPanel } from '@/components/documentation-panel';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { FileTreeItem, FileTab, ConsoleMessage, DocSection } from '@shared/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

export default function Home() {
  // State
  const [activeTab, setActiveTab] = useState<'files' | 'packages' | 'docs' | 'run'>('files');
  const [openTabs, setOpenTabs] = useState<FileTab[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const [terminalMessages, setTerminalMessages] = useState<ConsoleMessage[]>([]);
  const [problemMessages, setProblemMessages] = useState<ConsoleMessage[]>([]);
  const [consoleExpanded, setConsoleExpanded] = useState(false);
  const [fileContent, setFileContent] = useState<string>('');
  const [createFileDialogOpen, setCreateFileDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [deleteFileDialogOpen, setDeleteFileDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [currentDirectory, setCurrentDirectory] = useState('/');
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [exportHtmlDialogOpen, setExportHtmlDialogOpen] = useState(false);
  const [exportAppDialogOpen, setExportAppDialogOpen] = useState(false);
  const [htmlExport, setHtmlExport] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Queries
  const { data: files = [], refetch: refetchFiles } = useQuery({
    queryKey: ['/api/files'],
  });

  const { data: docSections = [] } = useQuery({
    queryKey: ['/api/docs'],
  });

  // Get file content when active file changes
  const { data: activeFileData, refetch: refetchFileContent } = useQuery({
    queryKey: ['/api/files/content', activeFilePath],
    enabled: !!activeFilePath,
  });

  // Mutations
  const createFileMutation = useMutation({
    mutationFn: async ({ name, directory }: { name: string; directory: string }) => {
      return apiRequest('POST', '/api/files', { name, directory });
    },
    onSuccess: () => {
      refetchFiles();
      setCreateFileDialogOpen(false);
      setNewFileName('');
      toast({
        title: 'Fichier créé',
        description: 'Le fichier a été créé avec succès.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: `Erreur lors de la création du fichier: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  const createFolderMutation = useMutation({
    mutationFn: async ({ name, directory }: { name: string; directory: string }) => {
      return apiRequest('POST', '/api/folders', { name, directory });
    },
    onSuccess: () => {
      refetchFiles();
      setCreateFolderDialogOpen(false);
      setNewFolderName('');
      toast({
        title: 'Dossier créé',
        description: 'Le dossier a été créé avec succès.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: `Erreur lors de la création du dossier: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (path: string) => {
      return apiRequest('DELETE', `/api/files/${encodeURIComponent(path)}`);
    },
    onSuccess: () => {
      // Remove from open tabs if present
      if (fileToDelete) {
        setOpenTabs(prev => prev.filter(tab => tab.path !== fileToDelete));
        
        // If active file is deleted, select another tab
        if (activeFilePath === fileToDelete) {
          const remainingTabs = openTabs.filter(tab => tab.path !== fileToDelete);
          setActiveFilePath(remainingTabs.length > 0 ? remainingTabs[0].path : null);
        }
      }
      
      refetchFiles();
      setDeleteFileDialogOpen(false);
      setFileToDelete(null);
      
      toast({
        title: 'Fichier supprimé',
        description: 'Le fichier a été supprimé avec succès.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: `Erreur lors de la suppression: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  const saveFileMutation = useMutation({
    mutationFn: async ({ path, content }: { path: string; content: string }) => {
      return apiRequest('PUT', `/api/files/${encodeURIComponent(path)}`, { content });
    },
    onSuccess: () => {
      toast({
        title: 'Fichier sauvegardé',
        description: 'Les modifications ont été enregistrées.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: `Erreur lors de la sauvegarde: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  const executeCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      return apiRequest('POST', '/api/execute', { code });
    },
    onSuccess: (response) => {
      response.json().then((data) => {
        if (data.messages && Array.isArray(data.messages)) {
          setConsoleMessages((prev) => [...prev, ...data.messages]);
        }
      });
    },
    onError: (error: Error) => {
      setConsoleMessages((prev) => [
        ...prev, 
        { type: 'error', text: `Erreur d'exécution: ${error.message}` }
      ]);
    }
  });

  const executeTerminalCommandMutation = useMutation({
    mutationFn: async (command: string) => {
      return apiRequest('POST', '/api/terminal', { command });
    },
    onSuccess: (response) => {
      response.json().then((data) => {
        if (data.messages && Array.isArray(data.messages)) {
          setTerminalMessages((prev) => [...prev, ...data.messages]);
        }
      });
    },
    onError: (error: Error) => {
      setTerminalMessages((prev) => [
        ...prev, 
        { type: 'error', text: `Erreur d'exécution: ${error.message}` }
      ]);
    }
  });

  const exportHtmlMutation = useMutation({
    mutationFn: async (path: string) => {
      return apiRequest('POST', '/api/export-html', { path });
    },
    onSuccess: (response) => {
      response.json().then((data) => {
        if (data.html) {
          setHtmlExport(data.html);
          setExportHtmlDialogOpen(true);
        }
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: `Erreur lors de l'exportation HTML: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  const exportAppMutation = useMutation({
    mutationFn: async (path: string) => {
      return apiRequest('POST', '/api/export-app', { path });
    },
    onSuccess: (response) => {
      response.json().then((data) => {
        if (data.success) {
          setExportAppDialogOpen(true);
          toast({
            title: 'Application créée',
            description: data.message,
          });
        }
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: `Erreur lors de la conversion en application: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Effects
  useEffect(() => {
    if (activeFileData) {
      setFileContent(activeFileData.content || '');
    }
  }, [activeFileData]);

  useEffect(() => {
    // Add initial welcome message
    setConsoleMessages([
      { type: 'standard', text: 'Bienvenue dans nekoScript IDE!' },
      { type: 'info', text: 'Écrivez du code nekoScript et exécutez-le pour voir le résultat.' }
    ]);
    
    setTerminalMessages([
      { type: 'info', text: 'Terminal nekoScript' },
      { type: 'standard', text: 'Tapez "$neko-script aide" pour voir les commandes disponibles.' }
    ]);
  }, []);

  // Handlers
  const handleSelectFile = (path: string) => {
    // Check if file is already open
    if (!openTabs.some(tab => tab.path === path)) {
      // Get file name from path
      const fileName = path.split('/').pop() || path;
      
      // Add to open tabs
      setOpenTabs(prev => [...prev, { path, name: fileName }]);
    }
    
    // Set as active file
    setActiveFilePath(path);
  };

  const handleSelectTab = (path: string) => {
    setActiveFilePath(path);
  };

  const handleCloseTab = (path: string) => {
    setOpenTabs(prev => prev.filter(tab => tab.path !== path));
    
    // If closing active tab, select another tab if available
    if (activeFilePath === path) {
      const remainingTabs = openTabs.filter(tab => tab.path !== path);
      setActiveFilePath(remainingTabs.length > 0 ? remainingTabs[0].path : null);
    }
  };

  const handleChangeCode = (newCode: string) => {
    setFileContent(newCode);
  };

  const handleSaveFile = () => {
    if (activeFilePath) {
      saveFileMutation.mutate({ path: activeFilePath, content: fileContent });
    }
  };

  const handleRunCode = () => {
    executeCodeMutation.mutate(fileContent);
  };

  const handleClearConsole = () => {
    setConsoleMessages([]);
    setTerminalMessages([
      { type: 'info', text: 'Terminal nekoScript' },
      { type: 'standard', text: 'Tapez "$neko-script aide" pour voir les commandes disponibles.' }
    ]);
    setProblemMessages([]);
  };

  const handleConsoleCommand = (command: string) => {
    // Add command to console
    setConsoleMessages(prev => [...prev, { type: 'standard', text: command }]);
    
    // Execute as nekoScript code
    executeCodeMutation.mutate(command);
  };

  const handleTerminalCommand = (command: string) => {
    // Add command to terminal log
    setTerminalMessages(prev => [...prev, { type: 'standard', text: command }]);
    
    // Execute terminal command
    executeTerminalCommandMutation.mutate(command);
  };

  const handleCreateFile = () => {
    setCreateFileDialogOpen(true);
  };

  const handleCreateFolder = () => {
    setCreateFolderDialogOpen(true);
  };

  const handleDeleteFile = (path: string) => {
    setFileToDelete(path);
    setDeleteFileDialogOpen(true);
  };

  const confirmDeleteFile = () => {
    if (fileToDelete) {
      deleteFileMutation.mutate(fileToDelete);
    }
  };

  const handleExportHtml = () => {
    if (activeFilePath) {
      exportHtmlMutation.mutate(activeFilePath);
    } else {
      toast({
        title: 'Erreur',
        description: 'Aucun fichier sélectionné pour l\'exportation',
        variant: 'destructive',
      });
    }
  };

  const handleExportApp = () => {
    if (activeFilePath) {
      exportAppMutation.mutate(activeFilePath);
    } else {
      toast({
        title: 'Erreur',
        description: 'Aucun fichier sélectionné pour la conversion',
        variant: 'destructive',
      });
    }
  };

  const submitNewFile = () => {
    if (newFileName) {
      createFileMutation.mutate({
        name: newFileName.endsWith('.neko') ? newFileName : `${newFileName}.neko`,
        directory: currentDirectory
      });
    }
  };

  const submitNewFolder = () => {
    if (newFolderName) {
      createFolderMutation.mutate({
        name: newFolderName,
        directory: currentDirectory
      });
    }
  };

  const downloadHtml = () => {
    if (htmlExport) {
      const fileName = activeFilePath ? activeFilePath.split('/').pop()?.replace('.neko', '.html') || 'export.html' : 'export.html';
      const blob = new Blob([htmlExport], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveFile();
      }
      
      // F5 or Ctrl+Enter to run code
      if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key === 'Enter')) {
        e.preventDefault();
        handleRunCode();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFilePath, fileContent]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {activeTab === 'files' && (
          <FileExplorer 
            files={files}
            selectedFile={activeFilePath}
            onSelectFile={handleSelectFile}
            onCreateFile={handleCreateFile}
            onCreateFolder={handleCreateFolder}
            onDeleteFile={handleDeleteFile}
            onExportHtml={handleExportHtml}
            onExportApp={handleExportApp}
          />
        )}
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center border-b border-muted">
            <EditorTabs 
              tabs={openTabs}
              activeTab={activeFilePath}
              onSelectTab={handleSelectTab}
              onCloseTab={handleCloseTab}
            />
            
            {activeFilePath && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="mr-2">
                    <i className="ri-more-line"></i>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleSaveFile}>
                    <i className="ri-save-line mr-2"></i> Sauvegarder
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleRunCode}>
                    <i className="ri-play-line mr-2"></i> Exécuter
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeleteFile(activeFilePath)}>
                    <i className="ri-delete-bin-line mr-2"></i> Supprimer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportHtml}>
                    <i className="ri-html5-line mr-2"></i> Exporter en HTML
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportApp}>
                    <i className="ri-window-line mr-2"></i> Convertir en Application
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          {activeFilePath ? (
            <CodeEditor 
              value={fileContent}
              onChange={handleChangeCode}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-background">
              <div className="text-center p-6">
                <div className="text-5xl mb-4">🐱</div>
                <h2 className="text-2xl font-bold mb-2 text-primary">Bienvenue dans nekoScript</h2>
                <p className="text-muted-foreground">Ouvrez un fichier pour commencer à coder</p>
                <div className="mt-4 space-x-2">
                  <Button variant="outline" onClick={handleCreateFile}>
                    <i className="ri-file-add-line mr-2"></i> Créer un fichier
                  </Button>
                  <Button variant="outline" onClick={handleCreateFolder}>
                    <i className="ri-folder-add-line mr-2"></i> Créer un dossier
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <Console 
            messages={consoleMessages}
            terminalMessages={terminalMessages}
            problemMessages={problemMessages}
            onClear={handleClearConsole}
            onCommand={handleConsoleCommand}
            onTerminalCommand={handleTerminalCommand}
            expanded={consoleExpanded}
            onToggleExpand={() => setConsoleExpanded(!consoleExpanded)}
          />
        </div>
        
        {activeTab === 'docs' && (
          <DocumentationPanel sections={docSections} />
        )}
      </div>

      {/* Create File Dialog */}
      <Dialog open={createFileDialogOpen} onOpenChange={setCreateFileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau Fichier</DialogTitle>
            <DialogDescription>
              Créer un nouveau fichier nekoScript dans le répertoire courant.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Input
                id="fileName"
                placeholder="nom-du-fichier.neko"
                className="col-span-4"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={submitNewFile}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog open={createFolderDialogOpen} onOpenChange={setCreateFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau Dossier</DialogTitle>
            <DialogDescription>
              Créer un nouveau dossier dans le répertoire courant.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Input
                id="folderName"
                placeholder="nom-du-dossier"
                className="col-span-4"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={submitNewFolder}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete File Dialog */}
      <Dialog open={deleteFileDialogOpen} onOpenChange={setDeleteFileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer Fichier</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce fichier ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFileDialogOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={confirmDeleteFile}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export HTML Dialog */}
      <Dialog open={exportHtmlDialogOpen} onOpenChange={setExportHtmlDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Export HTML</DialogTitle>
            <DialogDescription>
              Votre code nekoScript a été exporté en HTML.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 border rounded-lg overflow-hidden">
            <div className="bg-muted p-2 font-mono text-xs overflow-auto max-h-96">
              {htmlExport && (
                <pre>{htmlExport}</pre>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportHtmlDialogOpen(false)}>Fermer</Button>
            <Button onClick={downloadHtml}>Télécharger</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export App Dialog */}
      <Dialog open={exportAppDialogOpen} onOpenChange={setExportAppDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conversion en Application</DialogTitle>
            <DialogDescription>
              Votre code nekoScript a été converti en application.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-center">
              L'application a été générée avec succès. Vous pouvez la télécharger en cliquant sur le bouton ci-dessous.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportAppDialogOpen(false)}>Fermer</Button>
            <Button>Télécharger l'Application</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
