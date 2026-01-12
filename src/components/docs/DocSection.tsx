import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface DocSectionProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function DocSection({ id, children, className }: DocSectionProps) {
  return (
    <section 
      id={id} 
      className={cn('scroll-mt-24 mb-16', className)}
    >
      {children}
    </section>
  );
}

export interface DocHeadingProps {
  level: 1 | 2 | 3 | 4;
  id?: string;
  children: ReactNode;
  className?: string;
}

export function DocHeading({ level, id, children, className }: DocHeadingProps) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  const styles = {
    1: 'text-3xl font-bold text-foreground mb-6',
    2: 'text-2xl font-semibold text-foreground mb-4 mt-8 scroll-mt-24',
    3: 'text-xl font-semibold text-foreground mb-3 mt-6',
    4: 'text-lg font-medium text-foreground mb-2 mt-4',
  };

  return (
    <Tag id={id} className={cn(styles[level], className)}>
      {children}
    </Tag>
  );
}

interface DocParagraphProps {
  children: ReactNode;
  className?: string;
}

export function DocParagraph({ children, className }: DocParagraphProps) {
  return (
    <p className={cn('mb-4 text-muted-foreground leading-relaxed', className)}>
      {children}
    </p>
  );
}

interface DocListProps {
  items: (string | ReactNode)[];
  className?: string;
}

export function DocList({ items, className }: DocListProps) {
  return (
    <ul className={cn('mb-4 ml-6 list-disc text-muted-foreground space-y-2', className)}>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

interface DocCalloutProps {
  type: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  children: ReactNode;
}

export function DocCallout({ type, title, children }: DocCalloutProps) {
  const styles = {
    info: 'border-primary/30 bg-primary/5',
    warning: 'border-yellow-500/30 bg-yellow-500/5',
    error: 'border-destructive/30 bg-destructive/5',
    success: 'border-green-500/30 bg-green-500/5',
  };

  const iconColors = {
    info: 'text-primary',
    warning: 'text-yellow-500',
    error: 'text-destructive',
    success: 'text-green-500',
  };

  return (
    <div className={cn('p-4 rounded-lg border my-4', styles[type])}>
      {title && (
        <div className={cn('font-semibold mb-2', iconColors[type])}>
          {title}
        </div>
      )}
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

interface DocTableProps {
  headers: string[];
  rows: (string | ReactNode)[][];
}

export function DocTable({ headers, rows }: DocTableProps) {
  return (
    <div className="overflow-x-auto my-4 rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            {headers.map((header, index) => (
              <th key={index} className="px-4 py-3 text-left font-semibold text-foreground">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t border-border">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 text-muted-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
