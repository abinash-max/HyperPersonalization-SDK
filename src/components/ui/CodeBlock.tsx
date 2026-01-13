import { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  className?: string;
}

export function CodeBlock({ 
  code, 
  language = 'swift', 
  filename,
  showLineNumbers = true,
  className 
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n');

  return (
    <div className={cn('code-block my-4', className)}>
      {/* Header */}
      <div className="code-block-header">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-muted-foreground" />
          {filename ? (
            <span className="text-sm font-mono text-muted-foreground">{filename}</span>
          ) : (
            <span className="text-sm font-mono text-muted-foreground">{language}</span>
          )}
        </div>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-muted"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-500" />
              <span className="text-green-500">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code */}
      <div className="overflow-x-auto scrollbar-thin">
        <pre className="p-4 text-sm leading-relaxed">
          <code className="font-mono">
            {showLineNumbers ? (
              <table className="border-collapse">
                <tbody>
                  {lines.map((line, index) => (
                    <tr key={index}>
                      <td className="pr-4 text-right select-none text-muted-foreground/50 w-[1%] whitespace-nowrap">
                        {index + 1}
                      </td>
                      <td className="text-foreground/90">
                        <span dangerouslySetInnerHTML={{ __html: highlightSyntax(line, language) }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <span dangerouslySetInnerHTML={{ __html: highlightSyntax(code, language) }} />
            )}
          </code>
        </pre>
      </div>
    </div>
  );
}

// Simple syntax highlighting
function highlightSyntax(code: string, language: string): string {
  // Escape HTML first to prevent XSS
  let highlighted = escapeHtml(code);
  
  // Keywords
  const keywords = language === 'swift' 
    ? ['import', 'class', 'struct', 'func', 'let', 'var', 'if', 'else', 'guard', 'return', 'async', 'await', 'throws', 'try', 'catch', 'do', 'for', 'in', 'while', 'switch', 'case', 'default', 'break', 'continue', 'public', 'private', 'internal', 'static', 'final', 'override', 'init', 'deinit', 'self', 'Self', 'nil', 'true', 'false', 'enum', 'protocol', 'extension', 'where', 'typealias']
    : ['const', 'let', 'var', 'function', 'async', 'await', 'return', 'if', 'else', 'for', 'while', 'class', 'interface', 'type', 'export', 'import', 'from', 'default', 'try', 'catch', 'throw', 'new', 'this', 'true', 'false', 'null', 'undefined'];
  
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'g');
    highlighted = highlighted.replace(regex, `<span class="token keyword">${keyword}</span>`);
  });

  // Strings (double quotes)
  highlighted = highlighted.replace(/"([^"\\]|\\.)*"/g, (match) => {
    return `<span class="token string">${match}</span>`;
  });
  
  // Strings (single quotes)
  highlighted = highlighted.replace(/'([^'\\]|\\.)*'/g, (match) => {
    return `<span class="token string">${match}</span>`;
  });

  // Comments
  highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span class="token comment">$1</span>');

  // Numbers
  highlighted = highlighted.replace(/\b(\d+\.?\d*)\b/g, '<span class="token number">$1</span>');

  // Function calls
  highlighted = highlighted.replace(/(\w+)(?=\()/g, '<span class="token function">$1</span>');

  return highlighted;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
  };
  return text.replace(/[&<>]/g, char => map[char] || char);
}
