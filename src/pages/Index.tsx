import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { IntroductionSection } from '@/components/docs/IntroductionSection';
import { PermissionsSection } from '@/components/docs/PermissionsSection';
import { ModelArchitectureSection } from '@/components/docs/ModelArchitectureSection';
import { RoomAnalysisSection } from '@/components/docs/RoomAnalysisSection';
import { HumanAnalysisSection } from '@/components/docs/HumanAnalysisSection';
import { VendorIntegrationSection } from '@/components/docs/VendorIntegrationSection';
import { PerformanceSection } from '@/components/docs/PerformanceSection';
import { PrivacySection } from '@/components/docs/PrivacySection';
import { AdvancedIntegrationSection } from '@/components/docs/AdvancedIntegrationSection';
import { TestingSupportSection } from '@/components/docs/TestingSupportSection';
import { UILifecycleSection } from '@/components/docs/UILifecycleSection';

const Index = () => {
  const [activeSection, setActiveSection] = useState('introduction');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setSidebarOpen(false);
  };

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
        <Sidebar 
          activeSection={activeSection} 
          onNavigate={handleNavigate} 
        />
      </div>

      {/* Header */}
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main content */}
      <main className="md:pl-[280px] pt-16">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <article className="prose-docs animate-fade-in">
            <IntroductionSection />
            <PermissionsSection />
            <ModelArchitectureSection />
            <RoomAnalysisSection />
            <HumanAnalysisSection />
            <VendorIntegrationSection />
            <PerformanceSection />
            <PrivacySection />
            <AdvancedIntegrationSection />
            <TestingSupportSection />
            <UILifecycleSection />
          </article>

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t border-border">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
              <p>© 2024 PersonaLens. All rights reserved.</p>
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
};

export default Index;
