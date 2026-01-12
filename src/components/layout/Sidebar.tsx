import { useState } from 'react';
import { ChevronDown, ChevronRight, Search, Book, Shield, Brain, Home, Users, Zap, Database, TestTube, Layout, Smartphone, Camera, Palette, Box, Cpu, Server, Lock } from 'lucide-react';
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
      { id: 'quick-start', label: 'Quick Start' },
    ],
  },
  {
    id: 'phase-1',
    label: 'Phase 1: Permissions',
    icon: <Shield className="w-4 h-4" />,
    children: [
      { id: 'gallery-access', label: 'Gallery Access Strategy' },
      { id: 'permission-handling', label: 'Permission Handling' },
      { id: 'denial-flow', label: 'Denial Flow' },
    ],
  },
  {
    id: 'phase-2',
    label: 'Phase 2: Model Architecture',
    icon: <Brain className="w-4 h-4" />,
    children: [
      { id: 'model-inventory', label: 'Model Inventory' },
      { id: 'coreml-implementation', label: 'CoreML Implementation' },
      { id: 'image-pipeline', label: 'Image Input Pipeline' },
      { id: 'response-structure', label: 'Response Structure' },
      { id: 'confidence-scores', label: 'Confidence Scores' },
    ],
  },
  {
    id: 'phase-3',
    label: 'Phase 3: Room Analysis',
    icon: <Home className="w-4 h-4" />,
    children: [
      { id: 'room-classification', label: 'Room Classification' },
      { id: 'asset-storage', label: 'Asset Storage' },
      { id: 'low-confidence', label: 'Low Confidence Handling' },
    ],
  },
  {
    id: 'phase-4',
    label: 'Phase 4: Human Analysis',
    icon: <Users className="w-4 h-4" />,
    children: [
      { id: 'fashion-analysis', label: 'Fashion Analysis Flow' },
      { id: 'vision-framework', label: 'Vision Framework' },
      { id: 'face-pipeline', label: 'Face Pipeline' },
      { id: 'embeddings-api', label: 'Embeddings & Clustering' },
      { id: 'best-face', label: 'Best Face Selection' },
    ],
  },
  {
    id: 'phase-5',
    label: 'Phase 5: Vendor Integration',
    icon: <Zap className="w-4 h-4" />,
    children: [
      { id: 'product-mapping', label: 'Product Mapping' },
      { id: 'fashion-generation', label: 'Fashion Generation' },
      { id: 'furniture-generation', label: 'Furniture Generation' },
    ],
  },
  {
    id: 'phase-6',
    label: 'Phase 6: Performance',
    icon: <Cpu className="w-4 h-4" />,
    children: [
      { id: 'device-compatibility', label: 'Device Compatibility' },
      { id: 'memory-management', label: 'Memory Management' },
      { id: 'concurrency', label: 'Concurrency' },
      { id: 'battery-impact', label: 'Battery Impact' },
    ],
  },
  {
    id: 'phase-7',
    label: 'Phase 7: Privacy',
    icon: <Lock className="w-4 h-4" />,
    children: [
      { id: 'privacy-manifest', label: 'Privacy Manifest' },
      { id: 'caching', label: 'Caching Mechanism' },
      { id: 'normalization', label: 'Image Normalization' },
    ],
  },
  {
    id: 'phase-8',
    label: 'Phase 8: Advanced',
    icon: <Server className="w-4 h-4" />,
    children: [
      { id: 'custom-models', label: 'Custom Model Injection' },
      { id: 'webhooks', label: 'Webhooks & Callbacks' },
      { id: 'offline-mode', label: 'Offline Mode' },
    ],
  },
  {
    id: 'phase-9',
    label: 'Phase 9: Testing',
    icon: <TestTube className="w-4 h-4" />,
    children: [
      { id: 'test-mode', label: 'Mocking & Test Mode' },
      { id: 'logging', label: 'Logging & Tracing' },
      { id: 'error-codes', label: 'Error Code Reference' },
    ],
  },
  {
    id: 'phase-10',
    label: 'Phase 10: UI & Lifecycle',
    icon: <Layout className="w-4 h-4" />,
    children: [
      { id: 'localization', label: 'Localization' },
      { id: 'cache-cleaning', label: 'Cache Cleaning' },
    ],
  },
];

interface SidebarProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export function Sidebar({ activeSection, onNavigate }: SidebarProps) {
  const [expandedPhases, setExpandedPhases] = useState<string[]>(['getting-started', 'phase-1', 'phase-2']);
  const [searchQuery, setSearchQuery] = useState('');

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
      <nav className="flex-1 overflow-y-auto scrollbar-thin p-3">
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
                {phase.children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => onNavigate(child.id)}
                    className={cn(
                      'nav-link w-full text-left',
                      activeSection === child.id && 'active'
                    )}
                  >
                    {child.label}
                  </button>
                ))}
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
