import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Tab = 'files' | 'packages' | 'docs' | 'run';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="w-16 bg-card border-r border-muted flex flex-col items-center py-4">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-10 h-10 mb-4 ${activeTab === 'files' ? 'bg-primary/10' : ''} hover:bg-primary/20`}
              onClick={() => setActiveTab('files')}
            >
              <i className="ri-file-list-line text-xl"></i>
              <span className="sr-only">Fichiers</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Fichiers</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-10 h-10 mb-4 ${activeTab === 'packages' ? 'bg-primary/10' : ''} hover:bg-primary/20`}
              onClick={() => setActiveTab('packages')}
            >
              <i className="ri-archive-line text-xl"></i>
              <span className="sr-only">Packages</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Packages</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-10 h-10 mb-4 ${activeTab === 'docs' ? 'bg-primary/10' : ''} hover:bg-primary/20`}
              onClick={() => setActiveTab('docs')}
            >
              <i className="ri-book-open-line text-xl"></i>
              <span className="sr-only">Documentation</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Documentation</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-10 h-10 mb-4 ${activeTab === 'run' ? 'bg-primary/10' : ''} hover:bg-primary/20`}
              onClick={() => setActiveTab('run')}
            >
              <i className="ri-play-circle-line text-xl"></i>
              <span className="sr-only">Exécuter</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Exécuter</p>
          </TooltipContent>
        </Tooltip>

        <div className="mt-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="w-10 h-10 hover:bg-primary/20">
                <i className="ri-user-line text-xl"></i>
                <span className="sr-only">Profil</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Profil</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
};
