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

export default function Home() {
  // State
  const [activeTab, setActiveTab] = useState<'files' | 'packages' | 'docs' | 'run'>('files');
  const [openTabs, setOpenTabs] = useState<FileTab[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const [consoleExpanded, setConsoleExpanded] = useState(false);
  const [fileContent, setFileContent] = useState<string>('');
  const [createFileDialogOpen, setCreateFileDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [currentDirectory, setCurrentDirectory] = useState('/');
  
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
  };

  const handleConsoleCommand = (command: string) => {
    // Add command to console
    setConsoleMessages(prev => [...prev, { type: 'standard', text: command }]);
    
    // Process command (terminal commands)
    if (command.startsWith('$neko-script')) {
      const parts = command.split(' ');
      if (parts.length > 1) {
        const action = parts[1];
        switch (action) {
          case 'télécharger':
            setConsoleMessages(prev => [...prev, { type: 'success', text: 'nekoScript installé avec succès!' }]);
            break;
          case 'publish':
            if (parts.length > 2) {
              setConsoleMessages(prev => [...prev, { type: 'success', text: `Bibliothèque ${parts[2]} publiée avec succès!` }]);
            } else {
              setConsoleMessages(prev => [...prev, { type: 'error', text: 'Nom de bibliothèque requis' }]);
            }
            break;
          case 'librairie':
            if (parts.length > 2) {
              setConsoleMessages(prev => [...prev, { type: 'success', text: `Bibliothèque ${parts[2]} téléchargée avec succès!` }]);
            } else {
              setConsoleMessages(prev => [...prev, { type: 'error', text: 'Nom de bibliothèque requis' }]);
            }
            break;
          default:
            setConsoleMessages(prev => [...prev, { type: 'error', text: `Commande inconnue: ${action}` }]);
        }
      }
    } else {
      // Execute as nekoScript code
      executeCodeMutation.mutate(command);
    }
  };

  const handleCreateFile = () => {
    setCreateFileDialogOpen(true);
  };

  const handleCreateFolder = () => {
    setCreateFolderDialogOpen(true);
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
          />
        )}
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <EditorTabs 
            tabs={openTabs}
            activeTab={activeFilePath}
            onSelectTab={handleSelectTab}
            onCloseTab={handleCloseTab}
          />
          
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
              </div>
            </div>
          )}
          
          <Console 
            messages={consoleMessages}
            onClear={handleClearConsole}
            onCommand={handleConsoleCommand}
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
    </div>
  );
}
