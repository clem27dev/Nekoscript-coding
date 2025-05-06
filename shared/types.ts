// File system types
export interface FileTreeItem {
  name: string;
  path: string;
  isFolder: boolean;
  children?: FileTreeItem[];
}

export interface FileTab {
  name: string;
  path: string;
}

// Console output types
export interface ConsoleMessage {
  type: 'standard' | 'success' | 'error' | 'info';
  text: string;
  image?: string;
}

// Documentation types
export interface DocItem {
  title: string;
  description: string;
  link?: string;
  linkText?: string;
}

export interface DocSection {
  title: string;
  color: 'primary' | 'secondary' | 'accent';
  items: DocItem[];
}

// nekoScript language types
export interface NekoScriptFunction {
  name: string;
  description: string;
  syntax: string;
  example: string;
}

export interface NekoScriptLibrary {
  name: string;
  description: string;
  functions: NekoScriptFunction[];
}

// Database models
export interface File {
  id: number;
  name: string;
  path: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Package {
  id: number;
  name: string;
  description: string;
  version: string;
  author: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
