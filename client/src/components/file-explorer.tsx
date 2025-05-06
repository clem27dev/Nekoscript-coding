import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileTreeItem } from '@shared/types';
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu';

interface FileExplorerProps {
  files: FileTreeItem[];
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onDeleteFile?: (path: string) => void;
  onExportHtml?: (path: string) => void;
  onExportApp?: (path: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  selectedFile,
  onSelectFile,
  onCreateFile,
  onCreateFolder,
  onDeleteFile,
  onExportHtml,
  onExportApp,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const isFolderExpanded = (path: string) => {
    return expandedFolders[path] !== false; // Par défaut, les dossiers sont ouverts
  };

  const renderFileTree = (items: FileTreeItem[], level = 0) => {
    return items.map((item) => (
      <div key={item.path} className="mb-1">
        <ContextMenu>
          <ContextMenuTrigger>
            <div 
              className={`flex items-center py-1 px-2 ${selectedFile === item.path ? 'selected-file bg-muted' : 'hover:bg-muted/50'} cursor-pointer rounded`}
              style={{ paddingLeft: `${level * 12 + 8}px` }}
              onClick={() => item.isFolder ? toggleFolder(item.path) : onSelectFile(item.path)}
            >
              {item.isFolder ? (
                <i className={`${isFolderExpanded(item.path) ? 'ri-folder-open-line' : 'ri-folder-line'} mr-2 text-accent`}></i>
              ) : (
                <i className="ri-file-code-line mr-2 text-primary"></i>
              )}
              <span>{item.name}</span>
            </div>
          </ContextMenuTrigger>
          
          <ContextMenuContent className="w-64">
            {item.isFolder ? (
              <>
                <ContextMenuItem onClick={() => setExpandedFolders(prev => ({...prev, [item.path]: true}))}>
                  <i className="ri-folder-open-line mr-2"></i> Ouvrir
                </ContextMenuItem>
                <ContextMenuItem onClick={() => setExpandedFolders(prev => ({...prev, [item.path]: false}))}>
                  <i className="ri-folder-line mr-2"></i> Fermer
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={onCreateFile}>
                  <i className="ri-file-add-line mr-2"></i> Nouveau fichier
                </ContextMenuItem>
                <ContextMenuItem onClick={onCreateFolder}>
                  <i className="ri-folder-add-line mr-2"></i> Nouveau dossier
                </ContextMenuItem>
              </>
            ) : (
              <>
                <ContextMenuItem onClick={() => onSelectFile(item.path)}>
                  <i className="ri-file-edit-line mr-2"></i> Ouvrir
                </ContextMenuItem>
                <ContextMenuSeparator />
                {onExportHtml && (
                  <ContextMenuItem onClick={() => onExportHtml(item.path)}>
                    <i className="ri-html5-line mr-2"></i> Exporter en HTML
                  </ContextMenuItem>
                )}
                {onExportApp && (
                  <ContextMenuItem onClick={() => onExportApp(item.path)}>
                    <i className="ri-window-line mr-2"></i> Convertir en Application
                  </ContextMenuItem>
                )}
                <ContextMenuSub>
                  <ContextMenuSubTrigger>
                    <i className="ri-more-line mr-2"></i> Plus d'options
                  </ContextMenuSubTrigger>
                  <ContextMenuSubContent className="w-48">
                    <ContextMenuItem onClick={() => onSelectFile(item.path)}>
                      <i className="ri-file-copy-line mr-2"></i> Dupliquer
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => onSelectFile(item.path)}>
                      <i className="ri-file-info-line mr-2"></i> Informations
                    </ContextMenuItem>
                  </ContextMenuSubContent>
                </ContextMenuSub>
                <ContextMenuSeparator />
                {onDeleteFile && (
                  <ContextMenuItem 
                    onClick={() => onDeleteFile(item.path)}
                    className="text-destructive"
                  >
                    <i className="ri-delete-bin-line mr-2"></i> Supprimer
                  </ContextMenuItem>
                )}
              </>
            )}
          </ContextMenuContent>
        </ContextMenu>
        
        {item.isFolder && item.children && isFolderExpanded(item.path) && (
          <div>
            {renderFileTree(item.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="w-64 bg-card border-r border-muted h-full overflow-hidden">
      <div className="p-4 h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">Fichiers</h2>
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-lg hover:text-primary" 
              title="Nouveau fichier"
              onClick={onCreateFile}
            >
              <i className="ri-add-line"></i>
              <span className="sr-only">Nouveau fichier</span>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-lg hover:text-primary" 
              title="Nouveau dossier"
              onClick={onCreateFolder}
            >
              <i className="ri-folder-add-line"></i>
              <span className="sr-only">Nouveau dossier</span>
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-grow">
          {files.length > 0 ? (
            renderFileTree(files)
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <i className="ri-folder-open-line text-4xl mb-2"></i>
              <p className="text-center">Aucun fichier</p>
              <Button 
                variant="link" 
                size="sm" 
                onClick={onCreateFile}
                className="mt-2"
              >
                Créer un fichier
              </Button>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};
