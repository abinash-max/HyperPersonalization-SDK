import { CodeBlock } from '@/components/ui/CodeBlock';
import { DocSection, DocHeading, DocParagraph, DocCallout, DocList } from './DocSection';

export function ImageAnalysisSection() {
  return (
    <>
      <DocSection id="image-analysis">
        <span className="phase-badge mb-4">Image Analysis</span>
        <DocHeading level={1}>Image Analysis</DocHeading>
        <DocParagraph>
          Image Analysis combines room classification and human analysis to process photos and extract 
          meaningful insights for personalization. This section covers how the SDK selects the best 
          room images and best human images for personalization.
        </DocParagraph>
      </DocSection>

      <DocSection id="room-selection">
        <DocHeading level={2}>Room Selection</DocHeading>
        <DocParagraph>
          This document explains <strong>how the SDK selects the best room image</strong> for home / room-based personalization, 
          based strictly on the behavior described in the usage documentation.
        </DocParagraph>

        <DocHeading level={3}>Overview</DocHeading>
        <DocParagraph>
          When the SDK is used for <strong>home-related personalization</strong> (e.g., room placement, furniture visualization, 
          home goods try-on), it automatically identifies, evaluates, and selects the <strong>best-quality room image</strong> 
          from the user's photo library or a developer-provided photo set.
        </DocParagraph>
        <DocParagraph>
          The selection is deterministic, quality-driven, and fails explicitly if requirements are not met.
        </DocParagraph>

        <DocHeading level={3}>Step-by-Step Selection Pipeline</DocHeading>

        <DocHeading level={4}>1. Personalization Type Determines the Rules</DocHeading>
        <DocParagraph>
          When the SDK is initialized with:
        </DocParagraph>
        <CodeBlock
          language="swift"
          filename="SDKOptions.swift"
          code={`personalizationType: .homegoods`}
        />
        <DocParagraph>
          the SDK switches to <strong>room and indoor-scene–specific selection logic</strong>.
        </DocParagraph>
        <DocParagraph>
          This configuration:
        </DocParagraph>
        <DocList items={[
          'Enables indoor / room classifiers',
          'Disables face or person-centric rules',
          'Activates scene quality and lighting checks',
          'Defines room categories as required outputs (e.g., bedroom, living room)',
        ]} />

        <DocHeading level={4}>2. Photo Ingestion</DocHeading>
        <DocParagraph>
          Photos are collected in one of two ways:
        </DocParagraph>
        <DocList items={[
          'Auto mode - Scans all photos accessible via iOS permissions. Full access scans entire library. Limited access scans only user-approved photos.',
          'Manual mode - Scans only the PHAsset[] explicitly passed by the app. Common for album-based or user-selected room photos.',
        ]} />
        <DocParagraph>
          Only <strong>accessible and readable assets</strong> enter the pipeline.
        </DocParagraph>

        <DocHeading level={4}>3. Analyzing Stage - Room Suitability Filtering</DocHeading>
        <DocParagraph>
          During the <code>analyzing</code> phase, images are filtered for room suitability based on indoor scene characteristics, clarity, lighting, and resolution.
        </DocParagraph>

        <DocHeading level={4}>4. Clustering Stage - Removing Near-Duplicates</DocHeading>
        <DocParagraph>
          Visually similar room images are grouped together, and only the best representative image per cluster is retained.
        </DocParagraph>

        <DocHeading level={4}>5. Selecting Best Photo - Quality-Based Ranking</DocHeading>
        <DocParagraph>
          For each detected room category, remaining images are scored and ranked by quality. The highest-scoring image is selected as the best candidate.
        </DocParagraph>

        <DocHeading level={4}>6. Tagging - Final Category Assignment</DocHeading>
        <DocParagraph>
          After selection:
        </DocParagraph>
        <DocList items={[
          'Each chosen image is tagged with a validCategory (Example: bedroom, livingRoom)',
          'The image is returned as a PersonalizeAsset',
          'The associated PHAsset is provided for downstream use',
        ]} />
        <DocParagraph>
          These tagged assets represent the <strong>final output</strong> of the SDK.
        </DocParagraph>

        <DocHeading level={3}>Failure Conditions</DocHeading>
        <DocParagraph>
          The SDK fails explicitly if <strong>no suitable room image</strong> can be selected.
        </DocParagraph>
        <DocParagraph>
          Common failure reasons:
        </DocParagraph>
        <DocList items={[
          'No indoor / room-like photos found',
          'Images are too blurry or poorly lit',
          'Limited photo access exposes too few usable assets',
          'Manual mode receives an empty or irrelevant asset list',
        ]} />
        <DocParagraph>
          In such cases, the SDK returns <code>.failure(error)</code> instead of weak or unreliable results.
        </DocParagraph>

        <DocHeading level={3}>One-Line Summary</DocHeading>
        <DocParagraph>
          <strong>The SDK selects the best room image by filtering for indoor scenes, removing near-duplicates, ranking remaining images by visual quality, and returning the highest-scoring room photo per category, or failing if none meet the quality threshold.</strong>
        </DocParagraph>

        <DocHeading level={3}>Recommended UX Handling</DocHeading>
        <DocParagraph>
          When selection fails:
        </DocParagraph>
        <DocList items={[
          'Prompt users to allow more photos',
          'Offer manual photo selection',
          'Clearly explain what kind of photo is missing (e.g., "We couldn\'t find a clear room image")',
        ]} />

        <DocHeading level={3}>Best Practice</DocHeading>
        <DocList items={[
          'Run room selection: Once during onboarding, Store selected asset identifiers, Re-run only when permissions change or the user requests a refresh',
        ]} />
      </DocSection>

      <DocSection id="human-selection">
        <DocHeading level={2}>Human Selection</DocHeading>
        <DocParagraph>
          This document explains <strong>how the SDK selects the best human (person) image</strong> for fashion, accessories, 
          shoes, cosmetics, and human-centric personalization, based strictly on the behavior described in the usage documentation.
        </DocParagraph>

        <DocHeading level={3}>Overview</DocHeading>
        <DocParagraph>
          When the SDK is used for <strong>human-based personalization</strong> (fashion, try-on, cosmetics, accessories, shoes), 
          it automatically identifies, evaluates, and selects the <strong>best-quality human image</strong> from the user's photo 
          library or a developer-provided photo set.
        </DocParagraph>
        <DocParagraph>
          The selection is quality-driven, category-aware (male/female/person), and <strong>fails explicitly</strong> if required 
          human images cannot be found.
        </DocParagraph>

        <DocHeading level={3}>Step-by-Step Selection Pipeline</DocHeading>

        <DocHeading level={4}>1. Personalization Type Determines the Rules</DocHeading>
        <DocParagraph>
          When the SDK is initialized with:
        </DocParagraph>
        <CodeBlock
          language="swift"
          filename="SDKOptions.swift"
          code={`personalizationType: .fashion`}
        />
        <DocParagraph>
          (or another human-centric domain)
        </DocParagraph>
        <DocParagraph>
          the SDK switches to <strong>person-focused selection logic</strong>.
        </DocParagraph>
        <DocParagraph>
          This configuration:
        </DocParagraph>
        <DocList items={[
          'Enables human / face / body classifiers',
          'Activates gender or person-category rules (male, female, person)',
          'Enforces minimum requirements for successful personalization',
          'Disables room or scene-centric scoring logic',
        ]} />
        <DocParagraph>
          If required human categories are missing, the SDK returns a failure.
        </DocParagraph>

        <DocHeading level={4}>2. Photo Ingestion</DocHeading>
        <DocParagraph>
          Photos are collected in one of two ways:
        </DocParagraph>
        <DocList items={[
          'Auto mode - Scans all photos accessible via iOS permissions. Full access scans entire library. Limited access scans only user-approved photos.',
          'Manual mode - Scans only the PHAsset[] explicitly passed by the app. Useful for selfies, curated albums, or user-selected images.',
        ]} />
        <DocParagraph>
          Only <strong>accessible and readable assets</strong> are considered.
        </DocParagraph>

        <DocHeading level={4}>3. Analyzing Stage - Human Detection & Filtering</DocHeading>
        <DocParagraph>
          During the <code>analyzing</code> phase, images are filtered for human suitability based on detectable humans, face/body visibility, sharpness, lighting quality, and occlusion checks.
        </DocParagraph>

        <DocHeading level={4}>4. Clustering Stage - Removing Near-Duplicates</DocHeading>
        <DocParagraph>
          Similar human images are grouped together, and only the best representative image per cluster is retained.
        </DocParagraph>

        <DocHeading level={4}>5. Selecting Best Photo - Human Quality Ranking</DocHeading>
        <DocParagraph>
          For each required human category, remaining images are scored and ranked by quality. The highest-scoring image is selected per category.
        </DocParagraph>

        <DocHeading level={4}>6. Tagging - Final Category Assignment</DocHeading>
        <DocParagraph>
          After selection:
        </DocParagraph>
        <DocList items={[
          'Each chosen image is tagged with a validCategory (Example: maleFace, femaleFace, person)',
          'The image is returned as a PersonalizeAsset',
          'The associated PHAsset is provided for downstream use',
        ]} />
        <DocParagraph>
          These tagged assets represent the <strong>final personalization inputs</strong>.
        </DocParagraph>

        <DocHeading level={3}>Failure Conditions</DocHeading>
        <DocParagraph>
          The SDK fails explicitly if <strong>required human images cannot be selected</strong>.
        </DocParagraph>
        <DocParagraph>
          Common failure reasons:
        </DocParagraph>
        <DocList items={[
          'No detectable human in accessible photos',
          'Faces are too small, blurred, or occluded',
          'Poor lighting across all candidates',
          'Limited photo access exposes too few usable human images',
          'Manual mode receives an empty or irrelevant asset list',
        ]} />
        <DocParagraph>
          In such cases, the SDK returns <code>.failure(error)</code> rather than weak or unreliable results.
        </DocParagraph>

        <DocHeading level={3}>One-Line Summary</DocHeading>
        <DocParagraph>
          <strong>The SDK selects the best human image by detecting usable people, removing near-duplicates, ranking candidates by face and body quality, and returning the highest-scoring image per required human category, or failing if requirements are not met.</strong>
        </DocParagraph>

        <DocHeading level={3}>Recommended UX Handling</DocHeading>
        <DocParagraph>
          When selection fails:
        </DocParagraph>
        <DocList items={[
          'Prompt users to allow more photos',
          'Suggest uploading or selecting a clear selfie',
          'Explain clearly what is missing (e.g., "We couldn\'t find a clear face photo")',
        ]} />

        <DocHeading level={3}>Best Practice</DocHeading>
        <DocList items={[
          'Run human selection: During onboarding or first try-on, Cache selected asset identifiers, Re-run only when permissions change or the user requests a refresh',
        ]} />
      </DocSection>
    </>
  );
}
