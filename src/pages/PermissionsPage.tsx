import { DocsLayout } from '@/components/layout/DocsLayout';
import { PermissionsSection } from '@/components/docs/PermissionsSection';

export default function PermissionsPage() {
  return (
    <DocsLayout activeSection="gallery-access">
      <PermissionsSection />
    </DocsLayout>
  );
}


