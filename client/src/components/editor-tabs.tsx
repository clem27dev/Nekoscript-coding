import React from 'react';
import { Button } from '@/components/ui/button';
import { FileTab } from '@shared/types';

interface EditorTabsProps {
  tabs: FileTab[];
  activeTab: string | null;
  onSelectTab: (path: string) => void;
  onCloseTab: (path: string) => void;
}

export const EditorTabs: React.FC<EditorTabsProps> = ({
  tabs,
  activeTab,
  onSelectTab,
  onCloseTab,
}) => {
  if (tabs.length === 0) return null;

  return (
    <div className="bg-card border-b border-muted flex overflow-x-auto">
      {tabs.map((tab) => (
        <div 
          key={tab.path}
          className={`px-4 py-2 flex items-center ${activeTab === tab.path ? 'tab-active' : 'text-muted-foreground'} cursor-pointer`}
          onClick={() => onSelectTab(tab.path)}
        >
          <span className="text-primary mr-1">🐱</span>
          <span className="text-sm">{tab.name}</span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-2 h-4 w-4 text-xs hover:text-primary"
            onClick={(e) => {
              e.stopPropagation();
              onCloseTab(tab.path);
            }}
          >
            <i className="ri-close-line"></i>
            <span className="sr-only">Fermer</span>
          </Button>
        </div>
      ))}
    </div>
  );
};
