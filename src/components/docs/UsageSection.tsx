import { CodeBlock } from '@/components/ui/CodeBlock';
import { DocSection, DocHeading, DocParagraph, DocList, DocTable, DocCallout } from './DocSection';

export function UsageSection() {
  return (
    <DocSection id="usage">
      <span className="phase-badge mb-4">Usage Guide</span>
      <DocHeading level={1}>HyperPersonalization iOS SDK Documentation (Swift)</DocHeading>
      
      <DocParagraph>
        Personalize your <strong>entire e-commerce inventory</strong> using the customer's real photos — without making them manually pick "the perfect selfie" or "the perfect room shot".
      </DocParagraph>

      <DocParagraph>
        The SDK scans the user's photo library (or a subset the user allows), identifies <strong>high-quality, relevant images</strong> for the selected personalization domains, and returns <strong>the best candidate assets</strong> to power downstream experiences like Virtual Try-On, room placement, cosmetics try-on, accessories try-on, and more.
      </DocParagraph>

      <DocHeading level={2} id="what-sdk-does">What this SDK does (in one sentence)</DocHeading>
      <DocParagraph>
        <strong>Given a personalization goal (fashion/home goods/etc.) and a photo access strategy (auto/manual), the SDK analyzes photos in parallel, clusters and ranks them, and returns the best photo assets per required category — or fails with a clear, developer-friendly error when requirements can't be met.</strong>
      </DocParagraph>

      <DocHeading level={2} id="supported-domains">Supported personalization domains</DocHeading>
      <DocParagraph>
        The SDK supports these domains (your app chooses what to enable):
      </DocParagraph>
      <DocList items={[
        'Fashion (e.g., male/female face/person images, outfit-friendly shots)',
        'Home goods (e.g., bedroom/living room-friendly images)',
        'Shoes',
        'Cosmetics',
        'Jewellery',
        'Accessories (bags, glasses, etc.)',
        'All (a convenience option when your catalog spans multiple domains)',
      ]} />

      <DocCallout type="warning" title="Important behavior">
        Some domains have minimum requirements. Example: If you choose fashion and the scan cannot find a suitable male or female image (depending on your category rules), the SDK returns a failure (an exception/error) instead of silently returning weak results.
      </DocCallout>

      <DocHeading level={2} id="core-concepts">Core concepts</DocHeading>

      <DocHeading level={3} id="personalization-type">1) personalizationType (what you want)</DocHeading>
      <DocParagraph>
        This decides:
      </DocParagraph>
      <DocList items={[
        'Which domain classifiers and selection rules are used',
        'Which categories are considered "required" vs "optional"',
        'The minimum set of "suitable" images needed to return a successful result',
      ]} />

      <DocParagraph>
        Typical choices:
      </DocParagraph>
      <DocList items={[
        '.fashion',
        '.homegoods',
        '.all (use when you have multiple categories and want one scan)',
      ]} />

      <DocParagraph>
        <strong>How it changes behavior</strong>
      </DocParagraph>
      <DocList items={[
        '.fashion focuses on people/face/person-quality selection rules',
        '.homegoods focuses on indoor/scene selection rules (rooms/lighting/clarity)',
        '.all runs a broader pipeline (more work, broader return set)',
      ]} />

      <DocHeading level={3} id="photo-selection-type">2) photoSelectionType (where photos come from)</DocHeading>
      <DocParagraph>
        This decides <em>how the SDK gets images to analyze</em>.
      </DocParagraph>
      <DocList items={[
        '.auto — The SDK scans the user-accessible photo library automatically. If the user grants Full Access: the SDK can scan the entire library. If the user grants Limited Access: iOS only exposes the selected items; the SDK scans only what it can see.',
        'Manual scanning (developer-provided PHAsset[]) — For album/folder scope, limited sets, custom pickers, or explicit user selection, you provide PHAsset items and call the manual API.',
      ]} />

      <DocCallout type="info" title="Practical mapping">
        <DocList items={[
          'Full gallery access → .auto',
          'Limited access → .auto (but results depend on what iOS exposes)',
          'Album / folder / user-selected set → use the manual API with PHAsset[]',
        ]} />
      </DocCallout>

      <DocHeading level={3} id="pipeline-stages">3) Pipeline stages (what "progress" means)</DocHeading>
      <DocParagraph>
        The SDK reports states such as:
      </DocParagraph>
      <DocList items={[
        'analyzing → reading metadata + running model inference',
        'clustering → grouping similar images, removing near-duplicates',
        'selectingBestPhoto → ranking + choosing best candidates per category',
        'tagging → attaching categories/labels to final candidates',
        'complete → finished successfully',
        'error → an error occurred (the completion result will indicate failure)',
      ]} />

      <DocCallout type="info">
        Treat progress states as <strong>stage indicators</strong>, not as a strict percentage.
      </DocCallout>

      <DocHeading level={2} id="initialization">Initialization</DocHeading>
      <DocParagraph>
        Import the SDK and get the shared instance:
      </DocParagraph>
      <CodeBlock
        language="swift"
        filename="AppDelegate.swift"
        code={`import AIModelOnDeviceSDK

let sdk = AIModelSDK.shared`}
      />
      <DocParagraph>
        A singleton instance used to run personalization tasks. This typically ensures model/session resources are reused efficiently and avoids repeated initialization overhead.
      </DocParagraph>

      <DocHeading level={2} id="auto-service">Run Personalization Service (Auto)</DocHeading>
      <DocParagraph>
        Automatically scan the user-accessible photo library. Use when you want the SDK to scan the photo library automatically.
      </DocParagraph>

      <DocHeading level={3} id="step-1">Step 1 — Create SDKOptions</DocHeading>
      <CodeBlock
        language="swift"
        filename="SDKOptions.swift"
        code={`let options = SDKOptions(
    personalizationType: .all,   // .fashion, .homegoods, .all, etc.
    photoSelectionType: .auto    // .auto for library scan
)`}
      />

      <DocHeading level={4}>How these parameters work together</DocHeading>
      <DocList items={[
        'personalizationType defines what "good" means (rules + required categories)',
        'photoSelectionType defines what photos are available to meet those requirements',
      ]} />

      <DocParagraph>
        So:
      </DocParagraph>
      <DocList items={[
        '.fashion + .auto = scan user\'s accessible library looking for fashion-suitable images',
        '.homegoods + manual assets = only evaluate photos you provide (e.g., an "Apartment" album)',
      ]} />

      <DocHeading level={3} id="step-2">Step 2 — Run Auto scan</DocHeading>
      <CodeBlock
        language="swift"
        filename="PersonalizationService.swift"
        code={`Task {
    await sdk.runPersonalizationService(
        sdkOptions: options,
        progress: { state in
            switch state {
            case .analyzing: print("Analyzing photos...")
            case .clustering: print("Clustering photos...")
            case .selectingBestPhoto: print("Selecting best photo...")
            case .tagging: print("Tagging photos...")
            case .complete: print("Complete!")
            case .error: print("Error occurred")
            }
        },
        completion: { result in
            switch result {
            case .success(let sdkResult):
                print("Success: \\(sdkResult.message)")
                for asset in sdkResult.arrPersonalizeAsset {
                    print("Category: \\(asset.validCategory.rawValue)")
                    // asset.phAsset is the selected PHAsset
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
        Use when you want full control over which photos are analyzed (album/folder/user-picked/limited set/testing).
      </DocParagraph>
      <DocParagraph>
        You fetch assets in your app, then pass them in:
      </DocParagraph>
      <CodeBlock
        language="swift"
        filename="ManualService.swift"
        code={`let options = SDKOptions(
    personalizationType: .homegoods,
    photoSelectionType: .auto // or your "manual intent" if you define one
)

let assets: [PHAsset] = /* fetch from a chosen album */

Task {
    await sdk.runPersonalizationServiceWith(
        sdkOptions: options,
        arrPHAssets: assets,
        progress: { state in
            print("State:", state)
        },
        completion: { result in
            switch result {
            case .success(let sdkResult):
                print("Found:", sdkResult.arrPersonalizeAsset.count)
            case .failure(let error):
                print("Failed:", error.localizedDescription)
            }
        }
    )
}`}
      />
      <DocParagraph>
        <strong>arrPHAssets:</strong> The exact photos the SDK will analyze. Useful for: "Select an album", "Pick 10 photos", "Scan only last 90 days", "Scan only room photos".
      </DocParagraph>
      <DocParagraph>
        <strong>What happens if arrPHAssets is empty?</strong> A well-behaved integration should treat it as a failure ("no inputs"). Your SDK's error should communicate this clearly.
      </DocParagraph>

      <DocHeading level={2} id="api-reference">API Reference</DocHeading>

      <DocHeading level={3} id="aimodelsdk">AIModelSDK</DocHeading>

      <DocHeading level={4} id="shared">shared</DocHeading>
      <CodeBlock
        language="swift"
        filename="AIModelSDK.swift"
        code={`let sdk = AIModelSDK.shared`}
      />
      <DocParagraph>
        A singleton instance used to run personalization tasks.
      </DocParagraph>
      <DocParagraph>
        <strong>Why singleton?</strong> This typically ensures model/session resources are reused efficiently and avoids repeated initialization overhead.
      </DocParagraph>

      <DocHeading level={4} id="run-personalization-service-auto">runPersonalizationService(sdkOptions:progress:completion:) — Auto scan</DocHeading>
      <DocParagraph>
        <strong>Use when:</strong> You want the SDK to scan the user-accessible photo library automatically.
      </DocParagraph>
      <CodeBlock
        language="swift"
        filename="AIModelSDK.swift"
        code={`await sdk.runPersonalizationService(
    sdkOptions: SDKOptions,
    progress: (PersonalizationState) -> Void,
    completion: (Result<SDKResult, Error>) -> Void
)`}
      />

      <DocHeading level={4}>Parameters</DocHeading>
      <DocParagraph>
        <strong>sdkOptions</strong>
      </DocParagraph>
      <DocList items={[
        'personalizationType: chooses domain rules and required categories',
        'photoSelectionType: must be .auto for this method',
      ]} />

      <DocParagraph>
        <strong>progress</strong>
      </DocParagraph>
      <DocList items={[
        'Called multiple times as the pipeline advances.',
        'Do not assume it runs on the main thread. If you update UI, dispatch to main.',
      ]} />

      <DocParagraph>
        <strong>completion</strong>
      </DocParagraph>
      <DocList items={[
        'Called once with either: .success(SDKResult) or .failure(Error)',
      ]} />

      <DocHeading level={4}>Expected behavior</DocHeading>
      <DocList items={[
        'The SDK may analyze in parallel internally.',
        'If requirements for the selected domain cannot be satisfied (e.g., fashion requires a suitable person image and none exist), the result is .failure(...).',
      ]} />

      <DocHeading level={4} id="run-personalization-service-manual">runPersonalizationServiceWith(sdkOptions:arrPHAssets:progress:completion:) — Manual scan</DocHeading>
      <DocParagraph>
        <strong>Use when:</strong> You want full control over which photos are analyzed (album/folder/user-picked/limited set/testing).
      </DocParagraph>
      <CodeBlock
        language="swift"
        filename="AIModelSDK.swift"
        code={`await sdk.runPersonalizationServiceWith(
    sdkOptions: SDKOptions,
    arrPHAssets: [PHAsset],
    progress: (PersonalizationState) -> Void,
    completion: (Result<SDKResult, Error>) -> Void
)`}
      />

      <DocHeading level={4}>Parameters</DocHeading>
      <DocParagraph>
        <strong>sdkOptions</strong>
      </DocParagraph>
      <DocList items={[
        'Same meaning as auto mode.',
        'For manual runs, set photoSelectionType to your "manual" intent (if applicable in your SDK design) or keep consistent with your integration contract.',
      ]} />

      <DocParagraph>
        <strong>arrPHAssets</strong>
      </DocParagraph>
      <DocList items={[
        'The exact photos the SDK will analyze.',
        'Useful for: "Select an album", "Pick 10 photos", "Scan only last 90 days", "Scan only room photos"',
      ]} />

      <DocParagraph>
        <strong>progress / completion</strong>
      </DocParagraph>
      <DocList items={[
        'Same behavior as auto mode.',
      ]} />

      <DocHeading level={4}>What happens if arrPHAssets is empty?</DocHeading>
      <DocParagraph>
        A well-behaved integration should treat it as a failure ("no inputs"). Your SDK's error should communicate this clearly (see "Errors" below).
      </DocParagraph>

      <DocHeading level={2} id="data-model">Data model (what you get back)</DocHeading>

      <DocHeading level={3} id="sdkresult">SDKResult</DocHeading>
      <DocParagraph>
        Returned on success.
      </DocParagraph>
      <DocParagraph>
        Common fields shown in your current implementation:
      </DocParagraph>
      <DocList items={[
        'message: String — Human-readable success message (useful for logs/debug; don\'t rely on exact wording).',
        'arrPersonalizeAsset: [PersonalizeAsset] — The selected best assets for personalization, per recognized category.',
      ]} />

      <DocHeading level={3} id="personalize-asset">PersonalizeAsset</DocHeading>
      <DocParagraph>
        Each item generally contains:
      </DocParagraph>
      <DocList items={[
        'validCategory — An enum (or string-backed enum) that tells you what the asset is best suited for (e.g., bedroom, living room, male face, female face, etc.)',
        'phAsset: PHAsset — A Photos framework reference. You can later fetch image data via Photos APIs in your app.',
      ]} />

      <DocCallout type="info">
        Tip: For persistence, store PHAsset.localIdentifier rather than the PHAsset object itself.
      </DocCallout>

      <DocHeading level={2} id="photo-access-strategies">Photo access strategies in real apps</DocHeading>

      <DocHeading level={3} id="full-library-scan">A) Full library scan (Auto mode)</DocHeading>
      <DocParagraph>
        Best onboarding experience for "set it and forget it".
      </DocParagraph>
      <DocList items={[
        'Ask for photo access once (with a clear explanation)',
        'Run .auto',
        'Store results for reuse',
      ]} />

      <DocHeading level={3} id="limited-library-access">B) Limited library access (Auto mode)</DocHeading>
      <DocParagraph>
        If the user selects "Limited Access", iOS only reveals what the user selected.
      </DocParagraph>
      <DocList items={[
        'The SDK will scan only what it can see',
        'If there aren\'t enough suitable photos, you may get a failure like: "Insufficient photos for fashion" / "No suitable assets found"',
        'Your UI should let users: Add more photos to the allowed set, or Switch to manual selection',
      ]} />

      <DocHeading level={3} id="album-folder-scanning">C) Album/folder scanning (Manual mode)</DocHeading>
      <DocParagraph>
        Use manual mode to scan photos from a specific album or a custom picker.
      </DocParagraph>
      <DocParagraph>
        High-level flow:
      </DocParagraph>
      <DocList items={[
        'Your app collects PHAsset[] from an album/picker',
        'Call runPersonalizationServiceWith(...)',
      ]} />

      <DocHeading level={2} id="errors-exceptions">Errors & exceptions</DocHeading>
      <DocParagraph>
        Your current integration returns errors via:
      </DocParagraph>
      <CodeBlock
        language="swift"
        filename="ErrorHandling.swift"
        code={`completion: { result in
  switch result {
    case .success(...)
    case .failure(let error)
  }
}`}
      />
      <DocParagraph>
        That .failure(error) is where developers must branch by error type and present the right UX.
      </DocParagraph>

      <DocHeading level={3}>Error categories you should document (recommended)</DocHeading>
      <DocParagraph>
        Even if your internal implementation differs, your SDK docs should clearly communicate <em>what can fail and why</em>. Common categories:
      </DocParagraph>

      <DocParagraph>
        <strong>1. Permission / access errors</strong>
      </DocParagraph>
      <DocList items={[
        'Photo library permission denied/restricted',
        'Limited access provides too few relevant photos',
      ]} />

      <DocParagraph>
        <strong>2. Insufficient suitable images</strong>
      </DocParagraph>
      <DocList items={[
        'Requested domain requires specific categories that were not found',
        'Example: .fashion selected, but no suitable male/female/person images found',
      ]} />

      <DocParagraph>
        <strong>3. Invalid input (manual mode)</strong>
      </DocParagraph>
      <DocList items={[
        'Empty asset list',
        'Unsupported asset types / corrupted items',
        'Assets not accessible due to iOS permission scope',
      ]} />

      <DocParagraph>
        <strong>4. Task cancellation</strong>
      </DocParagraph>
      <DocList items={[
        'User navigates away',
        'Developer cancels the Task',
      ]} />

      <DocParagraph>
        <strong>5. Internal / model errors</strong>
      </DocParagraph>
      <DocList items={[
        'Model resources unavailable',
        'Unexpected runtime failure',
      ]} />

      <DocHeading level={3}>Recommended: expose a typed error (best developer experience)</DocHeading>
      <DocParagraph>
        If you can, define a public error type (example shape):
      </DocParagraph>
      <DocList items={[
        'SDKError.permissionDenied',
        'SDKError.insufficientAssets(missing: [RequiredCategory])',
        'SDKError.noSuitableImagesFound(personalizationType: ...)',
        'SDKError.invalidInput(reason: ...)',
        'SDKError.cancelled',
        'SDKError.internalError(underlying: Error?)',
      ]} />

      <DocParagraph>
        Then developers can do:
      </DocParagraph>
      <CodeBlock
        language="swift"
        filename="ErrorHandling.swift"
        code={`if let sdkError = error as? SDKError {
   switch sdkError { ... }
}`}
      />

      <DocHeading level={3}>UX guidance for "insufficient images"</DocHeading>
      <DocParagraph>
        When the SDK fails because it can't find required image types:
      </DocParagraph>
      <DocList items={[
        'Don\'t show a generic "Something went wrong"',
        'Explain what\'s missing in user language: "We couldn\'t find a clear face photo for try-on." / "Please allow more photos or pick a few selfies."',
      ]} />

      <DocHeading level={2} id="best-practices">Best practices (to help devs succeed)</DocHeading>

      <DocHeading level={3}>1) Run once, reuse many times</DocHeading>
      <DocParagraph>
        Personalization selection is expensive compared to reusing results.
      </DocParagraph>
      <DocParagraph>
        Recommended flow:
      </DocParagraph>
      <DocList items={[
        'Run scan at onboarding / first use',
        'Store selected asset identifiers',
        'Re-run only when: user changes permissions, user wants to refresh personalization, results are missing for a newly enabled category',
      ]} />

      <DocHeading level={3}>2) Always show progress</DocHeading>
      <DocParagraph>
        Even simple stage updates reduce perceived latency:
      </DocParagraph>
      <DocList items={[
        '"Analyzing…"',
        '"Finding the best photos…"',
        '"Finalizing…"',
      ]} />

      <DocHeading level={3}>3) Treat .all as broader + slower</DocHeading>
      <DocParagraph>
        Use .all when your storefront truly spans multiple domains. If your app is single-domain, prefer a specific type to reduce time and failure surface area.
      </DocParagraph>

      <DocHeading level={3}>4) Handle limited access explicitly</DocHeading>
      <DocParagraph>
        Limited access is common. Build a graceful fallback:
      </DocParagraph>
      <DocList items={[
        'If failure due to insufficient images: offer "Allow more photos" / offer "Select photos manually"',
      ]} />

      <DocHeading level={3}>5) UI thread safety</DocHeading>
      <DocParagraph>
        Unless your SDK guarantees main-thread callbacks, assume:
      </DocParagraph>
      <DocList items={[
        'progress and completion may arrive on background threads',
        'Dispatch UI changes to the main queue',
      ]} />

      <DocHeading level={2} id="practical-examples">Practical integration examples</DocHeading>

      <DocHeading level={3}>Example 1 — Fashion-only app (Auto scan)</DocHeading>
      <CodeBlock
        language="swift"
        filename="FashionAppExample.swift"
        code={`let options = SDKOptions(
    personalizationType: .fashion,
    photoSelectionType: .auto
)

Task {
    await sdk.runPersonalizationService(
        sdkOptions: options,
        progress: { state in
            print("State:", state)
        },
        completion: { result in
            switch result {
            case .success(let sdkResult):
                // Save selected assets for try-on
                print(sdkResult.arrPersonalizeAsset.count)

            case .failure(let error):
                // If this is "insufficient images", prompt user to allow more photos
                print(error.localizedDescription)
            }
        }
    )
}`}
      />

      <DocHeading level={3}>Example 2 — Scan a specific album (Manual scan)</DocHeading>
      <DocParagraph>
        You fetch assets in your app, then pass them in.
      </DocParagraph>
      <CodeBlock
        language="swift"
        filename="AlbumScanExample.swift"
        code={`let options = SDKOptions(
    personalizationType: .homegoods,
    photoSelectionType: .auto // or your "manual intent" if you define one
)

let assets: [PHAsset] = /* fetch from a chosen album */

Task {
    await sdk.runPersonalizationServiceWith(
        sdkOptions: options,
        arrPHAssets: assets,
        progress: { state in
            print("State:", state)
        },
        completion: { result in
            switch result {
            case .success(let sdkResult):
                print("Found:", sdkResult.arrPersonalizeAsset.count)
            case .failure(let error):
                print("Failed:", error.localizedDescription)
            }
        }
    )
}`}
      />
    </DocSection>
  );
}
