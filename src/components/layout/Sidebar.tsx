import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, Search, Book, Shield, Home, Users, Zap, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  children?: { id: string; label: string }[];
}

const phases: NavItem[] = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    icon: <Book className="w-4 h-4" />,
    children: [
      { id: 'introduction', label: 'Introduction' },
      { id: 'installation', label: 'Installation' },
    ],
  },
  {
    id: 'usage',
    label: 'Usage',
    icon: <Zap className="w-4 h-4" />,
    children: [
      { id: 'initialization', label: 'Initialization' },
      { id: 'auto-service', label: 'Auto Service' },
      { id: 'manual-service', label: 'Manual Service' },
    ],
  },
  {
    id: 'phase-1',
    label: 'Permissions',
    icon: <Shield className="w-4 h-4" />,
    children: [
      { id: 'gallery-access', label: 'Gallery Access Strategy' },
    ],
  },
  {
    id: 'image-analysis',
    label: 'Image Analysis',
    icon: <Home className="w-4 h-4" />,
    children: [
      { id: 'room-selection', label: 'Room Selection' },
      { id: 'human-selection', label: 'Human Selection' },
    ],
  },
  {
    id: 'phase-5',
    label: 'Personalization',
    icon: <Zap className="w-4 h-4" />,
    children: [
      { id: 'product-mapping', label: 'Product Mapping' },
      { id: 'fashion-generation', label: 'Fashion Personalization' },
      { id: 'furniture-generation', label: 'Furniture Personalization' },
    ],
  },
];

interface SidebarProps {
  activeSection?: string;
}

// Map section IDs to route paths
const sectionToRoute: Record<string, string> = {
  'introduction': '/introduction',
  'installation': '/introduction',
  'initialization': '/usage',
  'auto-service': '/usage',
  'manual-service': '/usage',
  'gallery-access': '/permissions',
  'room-selection': '/image-analysis',
  'human-selection': '/image-analysis',
  'product-mapping': '/vendor-integration',
  'fashion-generation': '/vendor-integration',
  'furniture-generation': '/vendor-integration',
};

export function Sidebar({ activeSection }: SidebarProps) {
  const location = useLocation();
  const [expandedPhases, setExpandedPhases] = useState<string[]>(['getting-started', 'phase-1']);
  const [searchQuery, setSearchQuery] = useState('');
  const activeItemRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);

  // Determine active section from current route and hash
  const getCurrentActiveSection = () => {
    if (activeSection) return activeSection;
    
    // Check if URL has a hash
    if (location.hash) {
      return location.hash.substring(1);
    }
    
    // Otherwise, find section based on current path
    const path = location.pathname;
    for (const [sectionId, route] of Object.entries(sectionToRoute)) {
      if (route === path) {
        return sectionId;
      }
    }
    return 'introduction';
  };
  
  const currentActiveSection = getCurrentActiveSection();

  // Auto-expand parent phase when a child section becomes active
  useEffect(() => {
    const activePhase = phases.find(phase => 
      phase.children?.some(child => {
        const route = sectionToRoute[child.id];
        return route === location.pathname;
      })
    );
    
    if (activePhase) {
      setExpandedPhases(prev => {
        if (!prev.includes(activePhase.id)) {
          return [...prev, activePhase.id];
        }
        return prev;
      });
    }
  }, [location.pathname]);

  // Auto-scroll active item into view
  useEffect(() => {
    if (activeItemRef.current && navRef.current) {
      const navElement = navRef.current;
      const activeElement = activeItemRef.current;
      
      // Calculate positions
      const navRect = navElement.getBoundingClientRect();
      const activeRect = activeElement.getBoundingClientRect();
      
      // Check if active item is outside visible area
      const isAbove = activeRect.top < navRect.top;
      const isBelow = activeRect.bottom > navRect.bottom;
      
      if (isAbove || isBelow) {
        // Scroll the active item into view smoothly
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }
    }
  }, [currentActiveSection, location.pathname]);

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev =>
      prev.includes(phaseId)
        ? prev.filter(id => id !== phaseId)
        : [...prev, phaseId]
    );
  };

  const filteredPhases = phases.filter(phase => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    if (phase.label.toLowerCase().includes(query)) return true;
    return phase.children?.some(child => child.label.toLowerCase().includes(query));
  });

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-sidebar border-r border-sidebar-border flex flex-col z-40">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Camera className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground text-sm">HyperPersonalization</h1>
            <span className="text-xs text-muted-foreground">v2.1.0</span>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-muted border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav ref={navRef} className="flex-1 overflow-y-auto scrollbar-thin p-3">
        {filteredPhases.map((phase) => (
          <div key={phase.id} className="mb-1">
            <button
              onClick={() => togglePhase(phase.id)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors hover:bg-muted text-sidebar-foreground"
            >
              {phase.icon}
              <span className="flex-1 text-left font-medium">{phase.label}</span>
              {expandedPhases.includes(phase.id) ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            
            {expandedPhases.includes(phase.id) && phase.children && (
              <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-3">
                {phase.children.map((child) => {
                  const route = sectionToRoute[child.id] || '/introduction';
                  const isActive = location.pathname === route && 
                    (location.hash === `#${child.id}` || (!location.hash && child.id === currentActiveSection) || child.id === currentActiveSection);
                  
                  return (
                    <Link
                      key={child.id}
                      ref={isActive ? activeItemRef : null}
                      to={`${route}#${child.id}`}
                      onClick={(e) => {
                        // If already on the same page, scroll to anchor instead of navigating
                        if (location.pathname === route) {
                          e.preventDefault();
                          const element = document.getElementById(child.id);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth' });
                            // Update URL hash without full navigation
                            window.history.pushState(null, '', `${route}#${child.id}`);
                          }
                        }
                      }}
                      className={cn(
                        'nav-link w-full text-left block',
                        isActive && 'active'
                      )}
                    >
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>All systems operational</span>
        </div>
      </div>
    </aside>
  );
}
