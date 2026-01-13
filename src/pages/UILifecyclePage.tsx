import { DocsLayout } from '@/components/layout/DocsLayout';
import { UILifecycleSection } from '@/components/docs/UILifecycleSection';

export default function UILifecyclePage() {
  return (
    <DocsLayout activeSection="localization">
      <UILifecycleSection />
    </DocsLayout>
  );
}

