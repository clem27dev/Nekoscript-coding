// Color definitions matching the design reference
export const nekoColors = {
  pink: '#FF6B7A',
  purple: '#7C4DFF',
  yellow: '#FFD166',
  dark: '#1E1E2E',
  gray: '#2A2B3D',
  lightGray: '#3A3B4D',
  success: '#4CAF50',
  error: '#F44336',
  info: '#2196F3'
};

// Token types for syntax highlighting
export type TokenType = 
  | 'keyword'
  | 'function'
  | 'string'
  | 'number'
  | 'operator'
  | 'comment'
  | 'text';

// Function to tokenize nekoScript code
export function tokenizeNekoScript(code: string): { type: TokenType; content: string }[] {
  const tokens: { type: TokenType; content: string }[] = [];
  
  // Simple regex-based tokenizer
  const patterns = [
    { type: 'comment', regex: /\/\/.*?$/gm },
    { type: 'keyword', regex: /\b(nekimporter|nekConnection|nekStatus|nekCommande|fonction|nekRetour)\b/g },
    { type: 'string', regex: /"([^"\\]|\\.)*"/g },
    { type: 'number', regex: /\b\d+\b/g },
    { type: 'operator', regex: /\b(plus|moins|multiplier|diviser)\b|[=();{}]/g },
    { type: 'function', regex: /\b(neko|compteneko|nekimg|Discord\.nek\w+)\b/g },
  ];
  
  let remaining = code;
  
  while (remaining.length > 0) {
    let match = null;
    let matchType: TokenType = 'text';
    let matchIndex = Infinity;
    let matchLength = 0;
    
    // Find the earliest match among all patterns
    for (const pattern of patterns) {
      pattern.regex.lastIndex = 0;
      const result = pattern.regex.exec(remaining);
      
      if (result && result.index < matchIndex) {
        match = result[0];
        matchType = pattern.type;
        matchIndex = result.index;
        matchLength = match.length;
      }
    }
    
    // Add any text before the match
    if (matchIndex > 0) {
      tokens.push({ type: 'text', content: remaining.substring(0, matchIndex) });
    }
    
    // Add the match itself
    if (match) {
      tokens.push({ type: matchType, content: match });
      remaining = remaining.substring(matchIndex + matchLength);
    } else {
      // No match found, add the remaining text and break
      tokens.push({ type: 'text', content: remaining });
      break;
    }
  }
  
  return tokens;
}
