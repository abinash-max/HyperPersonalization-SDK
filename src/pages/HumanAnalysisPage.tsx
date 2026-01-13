import { DocsLayout } from '@/components/layout/DocsLayout';
import { HumanAnalysisSection } from '@/components/docs/HumanAnalysisSection';

export default function HumanAnalysisPage() {
  return (
    <DocsLayout activeSection="fashion-analysis">
      <HumanAnalysisSection />
    </DocsLayout>
  );
}


