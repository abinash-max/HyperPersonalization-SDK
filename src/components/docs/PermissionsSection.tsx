import { CodeBlock } from '@/components/ui/CodeBlock';
import { DocSection, DocHeading, DocParagraph, DocCallout, DocList, DocTable } from './DocSection';

export function PermissionsSection() {
  return (
    <>
      <DocSection id="gallery-access">
        <span className="phase-badge mb-4">Phase 1</span>
        <DocHeading level={1}>Gallery Access Strategy</DocHeading>
        
        <DocParagraph>
          HyperPersonalization provides flexible photo access strategies to balance functionality with user privacy preferences. 
          Choose between full library access for comprehensive analysis or limited access using iOS's PHPhotoLibrary for user-selected photos only.
        </DocParagraph>

        <DocHeading level={2} id="permission-status">Understanding Permission Status</DocHeading>
        <DocParagraph>
          Before requesting access, you need to understand the different permission states iOS can return. 
          The PHAuthorizationStatus enum defines all possible states.
        </DocParagraph>

        <CodeBlock
          language="swift"
          filename="PHAuthorizationStatus.swift"
          code={`@available(iOS 8, iOS 8, *)
public enum PHAuthorizationStatus : Int, @unchecked Sendable {
    @available(iOS 8, *)
    case notDetermined = 0
    
    @available(iOS 8, *)
    case restricted = 1
    
    @available(iOS 8, *)
    case denied = 2
    
    @available(iOS 8, *)
    case authorized = 3
    
    @available(iOS 14, *)
    case limited = 4
}`}
        />

        <DocParagraph>
          Code breakdown:
        </DocParagraph>
        <DocList items={[
          'notDetermined (0): Permission not requested yet',
          'restricted (1): Restricted by parental controls',
          'denied (2): User denied access',
          'authorized (3): Full access granted',
          'limited (4): Limited access (iOS 14+), user selected specific photos',
        ]} />

        <DocHeading level={2} id="fetching-photos">Fetching All Photos</DocHeading>
        <DocParagraph>
          Once you have permission, you can fetch all photos from the user's gallery. 
          This function requests authorization and then fetches all available photos.
        </DocParagraph>

        <CodeBlock
          language="swift"
          filename="PhotoFetcher.swift"
          code={`func fetchAllPHAssets() async throws -> [PHAsset] {
    // Request authorization (using older API for read-only access)
    let status = await withCheckedContinuation { continuation in
        PHPhotoLibrary.requestAuthorization { status in
            continuation.resume(returning: status)
        }
    }
    
    guard status == .authorized || status == .limited else {
        throw PhotoClusterError.authorizationDenied
    }
    
    // Combine gallery assets with additionally selected assets
    var allAssets: [PHAsset] = []
    
    // Fetch assets from gallery
    let fetchOptions = PHFetchOptions()
    fetchOptions.fetchLimit = 1000
    fetchOptions.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: false)]
    
    let assets = PHAsset.fetchAssets(with: .image, options: fetchOptions)
    allAssets = Array(_immutableCocoaArray: assets)
    return allAssets
}`}
        />

        <DocParagraph>
          Code breakdown:
        </DocParagraph>
        <DocList items={[
          '1. Request authorization: withCheckedContinuation converts the callback-based API to async/await. PHPhotoLibrary.requestAuthorization shows the system permission dialog. The closure receives the user\'s choice. continuation.resume(returning: status) returns the status to the async function',
          '2. Check authorization status: Proceeds only if status is .authorized or .limited. Throws an error if denied, restricted, or not determined',
          '3. Fetch all photos: PHFetchOptions() configures the fetch. fetchLimit = 1000 limits to 1000 photos. sortDescriptors sorts by creation date (newest first). PHAsset.fetchAssets(with: .image, options: fetchOptions) fetches image assets. Converts the immutable array to a Swift array',
        ]} />

        <DocParagraph>
          Summary:
        </DocParagraph>
        <DocList items={[
          'Request permission using PHPhotoLibrary.requestAuthorization',
          'Check the status (authorized or limited)',
          'If granted, fetch photos using PHAsset.fetchAssets',
          'Configure fetch options (limit, sorting)',
          'Convert the result to a Swift array',
        ]} />

        <DocParagraph>
          Differences: authorized vs limited
        </DocParagraph>
        <DocList items={[
          'Authorized: Access to all photos',
          'Limited: Access only to photos the user selected',
        ]} />
      </DocSection>
    </>
  );
}
