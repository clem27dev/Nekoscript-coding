import React, { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { tokenizeNekoScript, TokenType } from '@/lib/theme';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange }) => {
  const [code, setCode] = useState(value);
  const [lines, setLines] = useState<string[]>([]);
  const [tokens, setTokens] = useState<{ type: TokenType; content: string }[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const codeDisplayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Update lines count
    const codeLines = code.split('\n');
    setLines(codeLines);
    
    // Update tokens for syntax highlighting
    setTokens(tokenizeNekoScript(code));
  }, [code]);

  useEffect(() => {
    setCode(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setCode(newValue);
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      
      // Insert 2 spaces for indentation
      const newValue = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newValue);
      onChange(newValue);
      
      // Move cursor position after the inserted tab
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  // Generate code display from tokens
  const renderTokenizedCode = () => {
    // Split tokens by line
    const lineTokens: Array<Array<{ type: TokenType; content: string }>> = [[]];
    let currentLine = 0;
    
    tokens.forEach(token => {
      const lines = token.content.split('\n');
      
      lines.forEach((line, i) => {
        if (i > 0) {
          currentLine++;
          lineTokens[currentLine] = [];
        }
        
        if (line) {
          lineTokens[currentLine].push({
            type: token.type,
            content: line + (i < lines.length - 1 ? '' : '')
          });
        }
      });
    });
    
    return lineTokens.map((line, i) => (
      <div key={i}>
        {line.map((token, j) => (
          <span key={j} className={`token-${token.type}`}>
            {token.content}
          </span>
        ))}
      </div>
    ));
  };

  return (
    <div className="flex-1 relative overflow-hidden">
      <div className="absolute inset-0 flex">
        <div className="editor-line-numbers px-3 py-4 text-right bg-background text-muted-foreground select-none">
          {Array.from({ length: Math.max(lines.length, 1) }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        
        <div className="relative flex-1">
          {/* Hidden textarea for editing */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="absolute inset-0 p-4 w-full h-full bg-transparent text-transparent caret-white resize-none font-mono z-10 whitespace-pre"
            spellCheck="false"
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
          />
          
          {/* Visible code display */}
          <ScrollArea className="w-full h-full">
            <div 
              ref={codeDisplayRef}
              className="p-4 font-mono whitespace-pre pointer-events-none"
            >
              {renderTokenizedCode()}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};
