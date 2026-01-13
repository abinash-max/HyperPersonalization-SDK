import { DocsLayout } from '@/components/layout/DocsLayout';
import { ModelArchitectureSection } from '@/components/docs/ModelArchitectureSection';

export default function ModelArchitecturePage() {
  return (
    <DocsLayout activeSection="model-inventory">
      <ModelArchitectureSection />
    </DocsLayout>
  );
}

