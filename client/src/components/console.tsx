import React, { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConsoleMessage } from '@shared/types';

interface ConsoleProps {
  messages: ConsoleMessage[];
  terminalMessages: ConsoleMessage[];
  problemMessages: ConsoleMessage[];
  onClear: () => void;
  onCommand: (command: string) => void;
  onTerminalCommand: (command: string) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}

export const Console: React.FC<ConsoleProps> = ({
  messages,
  terminalMessages,
  problemMessages,
  onClear,
  onCommand,
  onTerminalCommand,
  expanded,
  onToggleExpand,
}) => {
  const [activeTab, setActiveTab] = useState<'console' | 'terminal' | 'problems'>('console');
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, terminalMessages, problemMessages, activeTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      if (activeTab === 'terminal') {
        onTerminalCommand(input);
      } else {
        onCommand(input);
      }
      setInput('');
    }
  };

  const getMessageIcon = (type: ConsoleMessage['type']) => {
    switch (type) {
      case 'success':
        return <div className="text-green-500 mr-2">{'>'}</div>;
      case 'error':
        return <div className="text-destructive mr-2">{'>'}</div>;
      case 'info':
        return <div className="text-info mr-2">{'>'}</div>;
      default:
        return <div className="text-primary mr-2">{'>'}</div>;
    }
  };

  // Détermine les messages à afficher en fonction de l'onglet actif
  const displayMessages = activeTab === 'terminal' 
    ? terminalMessages 
    : activeTab === 'problems' 
      ? problemMessages 
      : messages;

  // Préfixe pour l'invite de commande
  const commandPrefix = activeTab === 'terminal' ? '$ ' : '> ';

  // Placeholder en fonction de l'onglet
  const inputPlaceholder = activeTab === 'terminal' 
    ? 'Entrez une commande terminal (ex: $neko-script aide)...' 
    : 'Entrez une commande nekoScript...';

  return (
    <div className={`border-t border-muted bg-card overflow-hidden flex flex-col ${expanded ? 'h-1/2' : 'h-64'}`}>
      <div className="flex border-b border-muted">
        <Button
          variant={activeTab === 'console' ? 'secondary' : 'ghost'}
          className={`px-4 py-2 rounded-none text-sm ${activeTab === 'console' ? '' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('console')}
        >
          Console
        </Button>
        <Button
          variant={activeTab === 'terminal' ? 'secondary' : 'ghost'}
          className={`px-4 py-2 rounded-none text-sm ${activeTab === 'terminal' ? '' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('terminal')}
        >
          Terminal
        </Button>
        <Button
          variant={activeTab === 'problems' ? 'secondary' : 'ghost'}
          className={`px-4 py-2 rounded-none text-sm ${activeTab === 'problems' ? '' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('problems')}
        >
          Problèmes
        </Button>
        <div className="ml-auto px-4 py-2 flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-sm hover:text-primary"
            title="Effacer la console"
            onClick={onClear}
          >
            <i className="ri-delete-bin-line"></i>
            <span className="sr-only">Effacer la console</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-sm hover:text-primary"
            title={expanded ? "Réduire" : "Agrandir"}
            onClick={onToggleExpand}
          >
            <i className={expanded ? "ri-contract-left-right-line" : "ri-fullscreen-line"}></i>
            <span className="sr-only">{expanded ? "Réduire" : "Agrandir"}</span>
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 font-mono text-sm">
          {displayMessages.map((message, index) => (
            <div key={index} className="flex items-start mb-2">
              {getMessageIcon(message.type)}
              <div className="flex-1 break-words">
                <div>{message.text}</div>
                {message.image && (
                  <img 
                    src={message.image} 
                    alt="Output" 
                    className="mt-2 rounded max-h-24" 
                  />
                )}
              </div>
            </div>
          ))}

          <form onSubmit={handleSubmit} className="flex items-start">
            <div className="text-white mr-2">{commandPrefix}</div>
            <div className="relative w-full">
              <Input
                ref={inputRef}
                type="text"
                className="w-full bg-transparent border-none outline-none"
                placeholder={inputPlaceholder}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  // Ajouter la complétion automatique des commandes
                  if (e.key === 'Tab' && activeTab === 'terminal' && input.startsWith('$neko-script')) {
                    e.preventDefault();
                    // Suggestions de commandes
                    const commands = ['télécharger', 'publish', 'librairie', 'init', 'run', 'build', 'export-html', 'export-app', 'aide'];
                    // Trouver une commande qui commence par ce qu'a tapé l'utilisateur après $neko-script
                    const parts = input.split(' ');
                    if (parts.length === 1) {
                      setInput('$neko-script ');
                    } else if (parts.length === 2) {
                      const partialCommand = parts[1];
                      const suggestion = commands.find(cmd => cmd.startsWith(partialCommand));
                      if (suggestion) {
                        setInput(`$neko-script ${suggestion} `);
                      }
                    }
                  }
                }}
              />
            </div>
          </form>
        </div>
      </ScrollArea>
    </div>
  );
};
