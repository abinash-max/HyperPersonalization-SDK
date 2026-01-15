import { DocsLayout } from '@/components/layout/DocsLayout';
import { ImageAnalysisSection } from '@/components/docs/ImageAnalysisSection';

export default function ImageAnalysisPage() {
  return (
    <DocsLayout activeSection="image-analysis">
      <ImageAnalysisSection />
    </DocsLayout>
  );
}


