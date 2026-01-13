import { DocsLayout } from '@/components/layout/DocsLayout';
import { TestingSupportSection } from '@/components/docs/TestingSupportSection';

export default function TestingSupportPage() {
  return (
    <DocsLayout activeSection="test-mode">
      <TestingSupportSection />
    </DocsLayout>
  );
}


