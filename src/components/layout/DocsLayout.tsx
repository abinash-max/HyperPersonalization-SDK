import { ReactNode, useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { PageNavigation } from './PageNavigation';
import { useLocation } from 'react-router-dom';

interface DocsLayoutProps {
  children: ReactNode;
  activeSection?: string;
}

export function DocsLayout({ children, activeSection }: DocsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentActiveSection, setCurrentActiveSection] = useState<string>('');
  const location = useLocation();

  // Handle hash navigation - scroll to section when URL has hash
  useEffect(() => {
    if (location.hash) {
      const hash = location.hash.substring(1); // Remove the #
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          setCurrentActiveSection(hash);
        }
      }, 100);
    } else {
      // Scroll to top when no hash
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Set default active section based on page
      const defaultSection = activeSection || location.pathname.split('/').pop() || 'introduction';
      setCurrentActiveSection(defaultSection);
    }
  }, [location.hash, location.pathname, activeSection]);

  // Auto-detect active section based on scroll position within the page
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      const sortedEntries = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => {
          const rectA = a.boundingClientRect;
          const rectB = b.boundingClientRect;
          return rectA.top - rectB.top;
        });

      if (sortedEntries.length > 0) {
        const activeId = sortedEntries[0].target.id;
        setCurrentActiveSection(activeId);
        // Update URL hash without scrolling
        if (activeId && !location.hash.includes(activeId)) {
          window.history.replaceState(null, '', `${location.pathname}#${activeId}`);
        }
      }
    }, observerOptions);

    // Observe all sections with IDs on the current page
    const timeoutId = setTimeout(() => {
      const allSections = document.querySelectorAll('section[id], h1[id], h2[id], h3[id]');
      allSections.forEach((section) => {
        observer.observe(section);
      });
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar activeSection={currentActiveSection || activeSection} />
      </div>

      {/* Header */}
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main content */}
      <main className="md:pl-[280px] pt-16">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <article className="prose-docs animate-fade-in">
            {children}
          </article>

          {/* Page Navigation */}
          <PageNavigation currentPath={location.pathname} />

          {/* Footer */}
          <footer className="mt-8 pt-8 border-t border-border">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
              <p>© 2024 HyperPersonalization. All rights reserved.</p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-foreground transition-colors">Support</a>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

