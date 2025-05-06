import React from 'react';
import { Button } from '@/components/ui/button';

export const Header: React.FC = () => {
  return (
    <header className="bg-card border-b border-muted px-4 py-2 flex items-center justify-between">
      <div className="flex items-center">
        <div className="text-primary text-2xl mr-2">🐱</div>
        <h1 className="font-bold text-primary">nekoScript</h1>
        <span className="ml-2 text-sm bg-secondary rounded-full px-2 py-0.5">v1.0.0</span>
      </div>
      
      <div className="flex space-x-4">
        <Button variant="ghost" size="sm" className="flex items-center text-sm hover:text-primary">
          <i className="ri-settings-4-line mr-1"></i> Paramètres
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center text-sm hover:text-primary">
          <i className="ri-question-line mr-1"></i> Aide
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center text-sm hover:text-primary">
          <i className="ri-github-fill mr-1"></i> GitHub
        </Button>
      </div>
    </header>
  );
};
