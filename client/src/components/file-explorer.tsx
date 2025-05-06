import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileTreeItem } from '@shared/types';

interface FileExplorerProps {
  files: FileTreeItem[];
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  onCreateFile: () => void;
  onCreateFolder: () => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  selectedFile,
  onSelectFile,
  onCreateFile,
  onCreateFolder,
}) => {
  const renderFileTree = (items: FileTreeItem[], level = 0) => {
    return items.map((item) => (
      <div key={item.path} className="mb-1">
        <div 
          className={`flex items-center py-1 px-2 ${selectedFile === item.path ? 'selected-file' : 'hover:bg-muted/50'} cursor-pointer rounded`}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={() => !item.isFolder && onSelectFile(item.path)}
        >
          {item.isFolder ? (
            <i className="ri-folder-line mr-2 text-accent"></i>
          ) : (
            <i className="ri-file-code-line mr-2 text-primary"></i>
          )}
          <span>{item.name}</span>
        </div>
        
        {item.isFolder && item.children && item.children.length > 0 && (
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
          {renderFileTree(files)}
        </ScrollArea>
      </div>
    </div>
  );
};
