import { DocsLayout } from '@/components/layout/DocsLayout';
import { RoomAnalysisSection } from '@/components/docs/RoomAnalysisSection';

export default function RoomAnalysisPage() {
  return (
    <DocsLayout activeSection="room-classification">
      <RoomAnalysisSection />
    </DocsLayout>
  );
}




