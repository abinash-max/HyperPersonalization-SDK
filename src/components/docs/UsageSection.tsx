import { CodeBlock } from '@/components/ui/CodeBlock';
import { DocSection, DocHeading, DocParagraph, DocList, DocTable } from './DocSection';

export function UsageSection() {
  return (
    <DocSection id="usage">
      <span className="phase-badge mb-4">Usage Guide</span>
      <DocHeading level={1}>Usage</DocHeading>
      <DocParagraph>
        Learn how to initialize the SDK and use the personalization service to analyze photos 
        and discover the best assets for personalization.
      </DocParagraph>

      <DocHeading level={2} id="initialization">Initialization</DocHeading>
      <DocParagraph>
        Import the SDK and access the shared instance:
      </DocParagraph>

      <CodeBlock
        language="swift"
        filename="AppDelegate.swift"
        code={`import AIModelOnDeviceSDK

let sdk = AIModelSDK.shared`}
      />

      <DocHeading level={2} id="auto-service">Run Personalization Service (Auto)</DocHeading>
      <DocParagraph>
        Automatically scan the photo library, cluster images, and find the best photos for personalization 
        (e.g., best bedroom, best living room).
      </DocParagraph>

      <DocHeading level={3}>Code Breakdown</DocHeading>

      <DocParagraph>
        <strong>1. Create SDK Options</strong>
      </DocParagraph>
      <CodeBlock
        language="swift"
        filename="PersonalizationService.swift"
        code={`let options = SDKOptions(
    personalizationType: .all,  // .homegoods, .fashion, or .all
    photoSelectionType: .auto
)`}
      />
      <DocList items={[
        'Creates configuration options for the SDK',
        'personalizationType: .all — analyze both home goods (furniture) and fashion',
        'photoSelectionType: .auto — automatically scan the entire photo library',
      ]} />

      <DocParagraph>
        <strong>2. Start the Task</strong>
      </DocParagraph>
      <CodeBlock
        language="swift"
        filename="PersonalizationService.swift"
        code={`Task {
    await sdk.runPersonalizationService(...)
}`}
      />
      <DocList items={[
        'Task runs async work',
        'await waits for the service to finish',
      ]} />

      <DocParagraph>
        <strong>3. Call the Service</strong>
      </DocParagraph>
      <CodeBlock
        language="swift"
        filename="PersonalizationService.swift"
        code={`await sdk.runPersonalizationService(
    sdkOptions: options,
    progress: { state in ... },
    completion: { result in ... }
)`}
      />
      <DocList items={[
        'Passes the options',
        'progress callback reports progress updates',
        'completion callback handles the final result',
      ]} />

      <DocParagraph>
        <strong>4. Progress Handler</strong>
      </DocParagraph>
      <CodeBlock
        language="swift"
        filename="PersonalizationService.swift"
        code={`progress: { state in
    switch state {
    case .analyzing: print("Analyzing photos...")
    case .clustering: print("Clustering photos...")
    case .selectingBestPhoto: print("Selecting best photo...")
    case .tagging: print("Tagging photos...")
    case .complete: print("Complete!")
    case .error: print("Error occurred")
    }
}`}
      />
      <DocList items={[
        'Receives progress updates as the SDK works',
        'States: analyzing → clustering → selecting best photos → tagging → complete (or error)',
      ]} />

      <DocParagraph>
        <strong>5. Completion Handler</strong>
      </DocParagraph>
      <CodeBlock
        language="swift"
        filename="PersonalizationService.swift"
        code={`completion: { result in
    switch result {
    case .success(let sdkResult):
        print("Success: \\(sdkResult.message)")
        for asset in sdkResult.arrPersonalizeAsset {
            print("Found category: \\(asset.validCategory.rawValue)")
            // asset.phAsset contains the PHAsset
        }
    case .failure(let error):
        print("Failed: \\(error.localizedDescription)")
    }
}`}
      />
      <DocList items={[
        'On success: prints the message and loops through discovered assets, printing each category',
        'On failure: prints the error description',
      ]} />

      <DocParagraph>
        <strong>Summary</strong>
      </DocParagraph>
      <DocList items={[
        'Configure options (what to analyze, auto vs manual)',
        'Start an async task',
        'Call the service with options',
        'Handle progress updates (analyzing, clustering, etc.)',
        'Handle the final result (success with assets, or failure with error)',
        'The SDK scans photos, finds the best ones for each category (bedroom, living room, male face, female face, etc.), and returns them in sdkResult.arrPersonalizeAsset',
      ]} />

      <DocHeading level={3}>Complete Code Example</DocHeading>
      <CodeBlock
        language="swift"
        filename="PersonalizationService.swift"
        code={`let options = SDKOptions(
    personalizationType: .all,  // .homegoods, .fashion, or .all
    photoSelectionType: .auto
)

Task {
    await sdk.runPersonalizationService(
        sdkOptions: options,
        progress: { state in
            // Handle progress updates
            switch state {
            case .analyzing:
                print("Analyzing photos...")
            case .clustering:
                print("Clustering photos...")
            case .selectingBestPhoto:
                print("Selecting best photo...")
            case .tagging:
                print("Tagging photos...")
            case .complete:
                print("Complete!")
            case .error:
                print("Error occurred")
            }
        },
        completion: { result in
            switch result {
            case .success(let sdkResult):
                print("Success: \\(sdkResult.message)")
                // Access discovered assets
                for asset in sdkResult.arrPersonalizeAsset {
                    print("Found category: \\(asset.validCategory.rawValue)")
                    // asset.phAsset contains the PHAsset
                }
            case .failure(let error):
                print("Failed: \\(error.localizedDescription)")
            }
        }
    )
}`}
      />

      <DocHeading level={2} id="manual-service">Run Personalization Service (Manual)</DocHeading>
      <DocParagraph>
        If you have a specific set of PHAsset objects you want to analyze:
      </DocParagraph>

      <DocHeading level={3}>Code Breakdown</DocHeading>

      <DocParagraph>
        <strong>1. Prepare your selected assets</strong>
      </DocParagraph>
      <CodeBlock
        language="swift"
        filename="PersonalizationService.swift"
        code={`let assets: [PHAsset] = ... // Your selected assets`}
      />
      <DocList items={[
        'You provide a specific array of PHAsset objects',
        'Instead of scanning the entire photo library, you choose which photos to analyze',
        'Example: photos from a specific album, user-selected photos, or photos from a certain date range',
      ]} />

      <DocParagraph>
        <strong>2. Start the Task</strong>
      </DocParagraph>
      <CodeBlock
        language="swift"
        filename="PersonalizationService.swift"
        code={`Task {
    await sdk.runPersonalizationServiceWith(...)
}`}
      />
      <DocList items={[
        'Task runs the async work',
        'await waits for the service to finish',
      ]} />

      <DocParagraph>
        <strong>3. Call the Manual Service</strong>
      </DocParagraph>
      <CodeBlock
        language="swift"
        filename="PersonalizationService.swift"
        code={`await sdk.runPersonalizationServiceWith(
    sdkOptions: options,
    arrPHAssets: assets,
    progress: { state in ... },
    completion: { result in ... }
)`}
      />
      <DocList items={[
        'Uses runPersonalizationServiceWith instead of runPersonalizationService',
        'arrPHAssets: assets passes your selected photos',
        'sdkOptions: options uses the same configuration (personalizationType, etc.)',
        'progress callback reports progress updates',
        'completion callback handles the final result',
      ]} />

      <DocParagraph>
        <strong>4. Progress Handler</strong>
      </DocParagraph>
      <CodeBlock
        language="swift"
        filename="PersonalizationService.swift"
        code={`progress: { state in
    print("State: \\(state)")
}`}
      />
      <DocList items={[
        'Receives progress updates as the SDK processes your selected photos',
        'States: analyzing → clustering → selecting best photo → tagging → complete (or error)',
      ]} />

      <DocParagraph>
        <strong>5. Completion Handler</strong>
      </DocParagraph>
      <CodeBlock
        language="swift"
        filename="PersonalizationService.swift"
        code={`completion: { result in
    // Handle result
}`}
      />
      <DocList items={[
        'On success: result contains the discovered assets',
        'On failure: result contains the error information',
      ]} />

      <DocParagraph>
        <strong>Differences from Auto mode</strong>
      </DocParagraph>
      <DocTable
        headers={['Auto Mode', 'Manual Mode']}
        rows={[
          ['Scans entire photo library', 'Only analyzes photos you provide'],
          ['runPersonalizationService', 'runPersonalizationServiceWith'],
          ['No arrPHAssets parameter', 'Requires arrPHAssets parameter'],
        ]}
      />

      <DocParagraph>
        <strong>When to use manual mode</strong>
      </DocParagraph>
      <DocList items={[
        'User selects specific photos',
        'Analyzing photos from a specific album',
        'Processing photos from a date range',
        'Testing with a small set of photos',
        'Analyzing photos from a custom picker',
      ]} />

      <DocHeading level={3}>Complete Code Example</DocHeading>
      <CodeBlock
        language="swift"
        filename="PersonalizationService.swift"
        code={`let assets: [PHAsset] = ... // Your selected assets

Task {
    await sdk.runPersonalizationServiceWith(
        sdkOptions: options,
        arrPHAssets: assets,
        progress: { state in
            print("State: \\(state)")
        },
        completion: { result in
            // Handle result
        }
    )
}`}
      />
    </DocSection>
  );
}

