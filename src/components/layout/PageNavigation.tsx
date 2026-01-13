import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageNavItem {
  path: string;
  title: string;
  description?: string;
}

// Define all pages in order
const pages: PageNavItem[] = [
  { path: '/introduction', title: 'Introduction', description: 'Get started with HyperPersonalization' },
  { path: '/usage', title: 'Usage', description: 'Initialize SDK and run personalization service' },
  { path: '/permissions', title: 'Permissions', description: 'Gallery access and permission handling' },
  { path: '/model-architecture', title: 'Model Architecture', description: 'CoreML models and implementation' },
  { path: '/room-analysis', title: 'Room Analysis', description: 'Room classification and storage' },
  { path: '/human-analysis', title: 'Human Analysis', description: 'Face detection and clustering' },
  { path: '/vendor-integration', title: 'Vendor Integration', description: 'Product mapping and generation' },
  { path: '/performance', title: 'Performance', description: 'Optimization and device compatibility' },
  { path: '/privacy', title: 'Privacy', description: 'Data handling and privacy manifest' },
  { path: '/advanced-integration', title: 'Advanced Integration', description: 'Custom models and webhooks' },
  { path: '/testing-support', title: 'Testing & Support', description: 'Debug mode and error codes' },
  { path: '/ui-lifecycle', title: 'UI & Lifecycle', description: 'Localization and cache management' },
];

interface PageNavigationProps {
  currentPath: string;
}

export function PageNavigation({ currentPath }: PageNavigationProps) {
  const currentIndex = pages.findIndex(page => page.path === currentPath);
  const previousPage = currentIndex > 0 ? pages[currentIndex - 1] : null;
  const nextPage = currentIndex < pages.length - 1 ? pages[currentIndex + 1] : null;

  if (!previousPage && !nextPage) {
    return null;
  }

  return (
    <div className="mt-16 pt-8 border-t border-border">
      <div className="flex flex-col sm:flex-row gap-4">
        {previousPage ? (
          <Link
            to={previousPage.path}
            className={cn(
              'flex-1 group p-4 rounded-lg border border-border',
              'hover:border-primary/50 hover:bg-muted/50 transition-all',
              'flex items-center gap-4'
            )}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground mb-1">Previous</div>
              <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {previousPage.title}
              </div>
              {previousPage.description && (
                <div className="text-sm text-muted-foreground mt-1 line-clamp-1">
                  {previousPage.description}
                </div>
              )}
            </div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}

        {nextPage ? (
          <Link
            to={nextPage.path}
            className={cn(
              'flex-1 group p-4 rounded-lg border border-border',
              'hover:border-primary/50 hover:bg-muted/50 transition-all',
              'flex items-center gap-4 text-right'
            )}
          >
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground mb-1">Next</div>
              <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {nextPage.title}
              </div>
              {nextPage.description && (
                <div className="text-sm text-muted-foreground mt-1 line-clamp-1">
                  {nextPage.description}
                </div>
              )}
            </div>
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </div>
  );
}


