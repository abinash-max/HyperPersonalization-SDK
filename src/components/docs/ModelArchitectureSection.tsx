import { CodeBlock } from '@/components/ui/CodeBlock';
import { DocSection, DocHeading, DocParagraph, DocList } from './DocSection';

export function ModelArchitectureSection() {
  return (
    <>
      <DocSection id="model-overview">
        <span className="phase-badge mb-4">Phase 2</span>
        <DocHeading level={1}>CoreML Implementation</DocHeading>

        <DocHeading level={2}>1. Manual Personalization Service Call</DocHeading>
        <CodeBlock
          language="swift"
          filename="ManualService.swift"
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

        <DocList items={[
          'assets: Array of PHAsset objects you select (not the entire gallery)',
          'Task: Runs the async work',
          'runPersonalizationServiceWith: Analyzes only the provided assets',
          'arrPHAssets: Passes your selected photos',
          'progress: Callback for progress updates',
          'completion: Callback with the final result',
        ]} />

        <DocHeading level={2}>2. SDKResult Structure</DocHeading>
        <CodeBlock
          language="swift"
          filename="SDKResult.swift"
          code={`public struct SDKResult {
    public let success: Bool
    public let message: String
    public let arrPersonalizeAsset: [PersonalizedAsset]
}`}
        />

        <DocList items={[
          'success: Whether the operation succeeded',
          'message: Status or error message',
          'arrPersonalizeAsset: Array of discovered assets with their categories',
        ]} />

        <DocHeading level={2}>3. PersonalizedAsset Structure</DocHeading>
        <CodeBlock
          language="swift"
          filename="PersonalizedAsset.swift"
          code={`public struct PersonalizedAsset {
    public let phAsset: PHAsset?
    public var validCategory: TaggerAPIResultCategory
}`}
        />

        <DocList items={[
          'phAsset: The original photo asset (can be nil)',
          'validCategory: The category assigned (e.g., bedroom, male, female)',
        ]} />

        <DocHeading level={2}>4. TaggerAPIResultCategory Enum</DocHeading>
        <CodeBlock
          language="swift"
          filename="TaggerAPIResultCategory.swift"
          code={`public enum TaggerAPIResultCategory : String {
    case bed_room = "bedroom"
    case living_room = "living_room"
    case dining_room = "dining_room"
    case male = "male"
    case female = "female"
    case kidMale = "kid_male"
    case kidFemale = "kid_female"
    case unknown = "unknown"
}`}
        />

        <DocParagraph>
          Categories:
        </DocParagraph>
        <DocList items={[
          'Rooms: bed_room, living_room, dining_room',
          'People: male, female, kidMale, kidFemale',
          'Fallback: unknown',
        ]} />

        <DocHeading level={2}>5. Product Categories Array</DocHeading>
        <CodeBlock
          language="swift"
          filename="TaggerAPIResultCategory.swift"
          code={`var arrProductCategory: [String] {
    switch self {
    case .bed_room:
        return ["beds", "bed", "bedroom"]
    case .living_room:
        return ["sofas", "sofa", "armchair", "armchairs", "living_room"]
    case .dining_room:
        return ["tables", "table", "dining", "dining_room"]
    case .unknown, .male, .female, .kidMale, .kidFemale:
        return []
    }
}`}
        />

        <DocList items={[
          'Maps each room category to product keywords for vendor searches',
          'Person categories return an empty array (not used for product matching)',
        ]} />

        <DocHeading level={2}>Summary</DocHeading>
        <DocList items={[
          'Call the manual service with your selected PHAsset array',
          'Receive a SDKResult with success status, message, and discovered assets',
          'Each PersonalizedAsset contains the photo and its category',
          'Categories include rooms (bedroom, living room, dining room) and people (male, female, kids)',
          'Room categories map to product keywords for vendor searches',
        ]} />

        <DocHeading level={2}>Example usage</DocHeading>
        <CodeBlock
          language="swift"
          filename="ExampleUsage.swift"
          code={`// After getting the result
switch result {
case .success(let sdkResult):
    print("Success: \\(sdkResult.message)")
    
    // Loop through discovered assets
    for asset in sdkResult.arrPersonalizeAsset {
        print("Category: \\(asset.validCategory.rawValue)")
        
        // Get product categories for room types
        let productCategories = asset.validCategory.arrProductCategory
        if !productCategories.isEmpty {
            print("Search for: \\(productCategories)")
            // Use these to search vendor sites (e.g., "sofas", "armchairs" for living room)
        }
    }
    
case .failure(let error):
    print("Error: \\(error.localizedDescription)")
}`}
        />

        <DocParagraph>
          This structure lets you:
        </DocParagraph>
        <DocList items={[
          'Know which photos match which categories',
          'Use room categories to search for relevant products',
          'Handle person categories separately for fashion personalization',
        ]} />
      </DocSection>
    </>
  );
}
