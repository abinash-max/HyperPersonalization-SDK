import { CodeBlock } from '@/components/ui/CodeBlock';
import { DocSection, DocHeading, DocParagraph, DocCallout, DocList, DocTable } from './DocSection';
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

      <DocHeading level={2} id="installation">Installation</DocHeading>
      <DocParagraph>
        HyperPersonalization SDK can be integrated into your project using multiple methods. 
        Choose the one that best fits your workflow.
      </DocParagraph>

      <DocHeading level={3}>Binary Distribution (XCFramework)</DocHeading>
      <DocParagraph>
        To protect the source code, this SDK is distributed as a binary framework (XCFramework).
      </DocParagraph>

      <DocParagraph>
        <strong>Download the Release</strong>
      </DocParagraph>
      <DocParagraph>
        Download the HyperPersonalizationSDK.xcframework.zip from the Latest Release.
      </DocParagraph>

      <DocHeading level={3}>Swift Package Manager (Binary Target)</DocHeading>
      <DocParagraph>
        You can include this SDK as a binary target in your own Package.swift.
      </DocParagraph>

      <CodeBlock
        language="swift"
        filename="Package.swift"
        code={`// Package.swift
targets: [
    .binaryTarget(
        name: "HyperPersonalizationSDK",
        url: "https://github.com/YOUR_USERNAME/YOUR_REPO/releases/download/v1.0.0/HyperPersonalizationSDK.xcframework.zip",
        checksum: "16c845f84c15176468b5389d69ba57dee05208d9fa82da439c073d057a4a0a03"
    )
]`}
      />

      <DocHeading level={3}>Manual Integration</DocHeading>
      <DocList items={[
        'Unzip HyperPersonalizationSDK.xcframework.zip',
        'Drag and drop HyperPersonalizationSDK.xcframework into your Xcode project',
        'Ensure "Embed & Sign" is selected in the "Frameworks, Libraries, and Embedded Content" section of your target settings',
      ]} />

      <DocCallout type="info" title="Requirements">
        iOS 15.0+ • Swift 5.7+ • Xcode 14.0+
      </DocCallout>

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
