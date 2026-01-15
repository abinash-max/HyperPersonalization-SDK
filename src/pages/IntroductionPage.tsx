import { DocsLayout } from '@/components/layout/DocsLayout';
import { IntroductionSection } from '@/components/docs/IntroductionSection';

export default function IntroductionPage() {
  return (
    <DocsLayout activeSection="introduction">
      <IntroductionSection />
    </DocsLayout>
  );
}




