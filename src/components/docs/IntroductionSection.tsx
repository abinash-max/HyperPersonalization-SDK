import { CodeBlock } from '@/components/ui/CodeBlock';
import { DocSection, DocHeading, DocParagraph, DocCallout, DocList } from './DocSection';
import { Camera, Zap, Shield, Cpu } from 'lucide-react';

export function IntroductionSection() {
  return (
    <DocSection id="introduction">
      {/* Hero */}
      <div className="relative mb-12 p-8 rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative">
          <span className="phase-badge mb-4">SDK Documentation</span>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            HyperPersonalization
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mb-6">
            On-device ML-powered photo analysis for personalized shopping experiences. 
            Analyze rooms, detect faces, and generate product visualizations—all with privacy-first architecture.
          </p>
          
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Camera className="w-4 h-4 text-primary" />
              <span>Photo Analysis</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Cpu className="w-4 h-4 text-primary" />
              <span>CoreML Powered</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-primary" />
              <span>Privacy First</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="w-4 h-4 text-primary" />
              <span>Real-time Processing</span>
            </div>
          </div>
        </div>
      </div>

      <DocHeading level={2}>Overview</DocHeading>
      <DocParagraph>
        HyperPersonalization enables iOS applications to analyze user photos for personalized e-commerce experiences. 
        Using on-device CoreML models, the SDK can classify rooms, detect faces, determine demographics, 
        and facilitate virtual try-on and furniture visualization features.
      </DocParagraph>

      <DocHeading level={3}>Key Capabilities</DocHeading>
      <DocList items={[
        <><strong>Gallery Analysis</strong> — Scan and classify photos from the user's photo library</>,
        <><strong>Room Detection</strong> — Identify living rooms, bedrooms, kitchens, and more</>,
        <><strong>Face Analysis</strong> — Detect faces and classify age, gender for personalization</>,
        <><strong>Face Clustering</strong> — Group faces to identify the primary user</>,
        <><strong>Virtual Try-On</strong> — Generate product visualizations on detected users</>,
        <><strong>Room Visualization</strong> — Place furniture in detected room scenes</>,
      ]} />

      <DocHeading level={2} id="installation">Quick Installation</DocHeading>
      <DocParagraph>
        Add HyperPersonalization to your project using Swift Package Manager:
      </DocParagraph>

      <CodeBlock
        language="swift"
        filename="Package.swift"
        code={`dependencies: [
    .package(
        url: "https://github.com/hyperpersonalization/sdk-ios.git",
        from: "2.1.0"
    )
]`}
      />

      <DocCallout type="info" title="Requirements">
        iOS 15.0+ • Swift 5.7+ • Xcode 14.0+
      </DocCallout>

      <DocHeading level={2} id="quick-start">Basic Usage</DocHeading>
      <DocParagraph>
        Initialize the SDK and start analyzing the user's photo library:
      </DocParagraph>

      <CodeBlock
        language="swift"
        filename="ContentView.swift"
        code={`import HyperPersonalization

class PhotoAnalyzer {
    let sdk = HyperPersonalizationSDK(
        apiKey: "your-api-key",
        config: .default
    )
    
    func startAnalysis() async throws {
        // Request gallery permission
        let granted = try await sdk.requestGalleryAccess()
        guard granted else { return }
        
        // Scan and analyze photos
        let results = try await sdk.analyzeGallery(
            options: AnalysisOptions(
                includeRooms: true,
                includeFaces: true,
                maxPhotos: 500
            )
        )
        
        // Access personalization assets
        let bestAssets = results.bestAssets
        print("Best male face: \\(bestAssets.male?.imageURL)")
        print("Best living room: \\(bestAssets.livingRoom?.imageURL)")
    }
}`}
      />

      <DocHeading level={2}>Architecture Overview</DocHeading>
      <DocParagraph>
        The SDK follows a pipeline architecture that processes photos through multiple stages:
      </DocParagraph>

      <div className="my-6 p-6 rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <div className="px-4 py-2 rounded-lg bg-muted text-foreground font-medium">
            Photo Library
          </div>
          <span className="text-primary">→</span>
          <div className="px-4 py-2 rounded-lg bg-muted text-foreground font-medium">
            Permission Check
          </div>
          <span className="text-primary">→</span>
          <div className="px-4 py-2 rounded-lg bg-muted text-foreground font-medium">
            Image Pipeline
          </div>
          <span className="text-primary">→</span>
          <div className="px-4 py-2 rounded-lg bg-primary/20 text-primary font-medium">
            CoreML Models
          </div>
          <span className="text-primary">→</span>
          <div className="px-4 py-2 rounded-lg bg-muted text-foreground font-medium">
            Results Cache
          </div>
          <span className="text-primary">→</span>
          <div className="px-4 py-2 rounded-lg bg-muted text-foreground font-medium">
            Best Assets
          </div>
        </div>
      </div>

      <DocCallout type="success" title="Privacy by Design">
        All ML inference happens on-device. Photo data never leaves the user's device unless 
        explicitly sent for generation features. Face embeddings are processed via secure API 
        calls with end-to-end encryption.
      </DocCallout>
    </DocSection>
  );
}
