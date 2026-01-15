import { Menu, Github, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-xl border-b border-border z-50 md:pl-[280px]">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        <div className="flex items-center gap-4">
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuToggle}
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Breadcrumb */}
          <nav className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <span>Docs</span>
            <span>/</span>
            <span className="text-foreground">Getting Started</span>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Version badge */}
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
            v2.1.0
          </span>

          {/* GitHub link */}
          <Button variant="ghost" size="icon" asChild>
            <a 
              href="https://github.com/hyperpersonalization/plugin-ios" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Github className="w-5 h-5" />
            </a>
          </Button>

          {/* Dashboard link */}
          <Button variant="outline" size="sm" className="hidden sm:inline-flex gap-2">
            <span>Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
