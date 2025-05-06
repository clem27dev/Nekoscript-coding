import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DocSection } from '@shared/types';

interface DocumentationPanelProps {
  sections: DocSection[];
}

export const DocumentationPanel: React.FC<DocumentationPanelProps> = ({ sections }) => {
  return (
    <div className="w-80 bg-card border-l border-muted overflow-hidden hidden lg:block">
      <ScrollArea className="h-full">
        <div className="p-4">
          <h2 className="font-semibold mb-4">Documentation nekoScript</h2>
          
          {sections.map((section, index) => (
            <div key={index} className="mb-6">
              <div className="flex items-center mb-2">
                <div className={`w-2 h-2 rounded-full bg-${section.color} mr-2`}></div>
                <h3 className="font-medium">{section.title}</h3>
              </div>
              
              <div className="ml-4 space-y-2 text-sm">
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="p-2 bg-muted/50 rounded">
                    <div className={`font-semibold text-${section.color}`}>{item.title}</div>
                    <p className="text-muted-foreground mt-1">{item.description}</p>
                    {item.link && (
                      <a href={item.link} className="text-primary text-xs mt-1 block">
                        {item.linkText || 'Voir documentation complète →'}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
