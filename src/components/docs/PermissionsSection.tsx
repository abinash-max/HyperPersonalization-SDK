import { CodeBlock } from '@/components/ui/CodeBlock';
import { DocSection, DocHeading, DocParagraph, DocCallout, DocList, DocTable } from './DocSection';

export function PermissionsSection() {
  return (
    <>
      <DocSection id="gallery-access">
        <span className="phase-badge mb-4">Phase 1</span>
        <DocHeading level={1}>Gallery Access Strategy</DocHeading>
        
        <DocParagraph>
          HyperPersonalization provides flexible photo access strategies to balance functionality 
          with user privacy preferences. Choose between full library access for comprehensive 
          analysis or limited access using iOS's PHPicker for user-selected photos only.
        </DocParagraph>

        <DocHeading level={2}>Full Gallery Access</DocHeading>
        <DocParagraph>
          Request complete access to the user's photo library for background scanning and 
          comprehensive personalization. This is recommended for the best user experience.
        </DocParagraph>

        <CodeBlock
          language="swift"
          filename="PermissionManager.swift"
          code={`import Photos
import PersonaLens

class PermissionManager {
    let sdk: PersonaLensSDK
    
    /// Request full gallery access for comprehensive scanning
    func requestFullAccess() async throws -> PHAuthorizationStatus {
        let status = await PHPhotoLibrary.requestAuthorization(for: .readWrite)
        
        switch status {
        case .authorized:
            // Full access granted - can scan entire library
            try await sdk.enableBackgroundScanning()
            return status
            
        case .limited:
            // User chose limited access via PHPicker
            return status
            
        case .denied, .restricted:
            // Access denied - show settings prompt
            throw PermissionError.accessDenied(status)
            
        case .notDetermined:
            // Should not reach here after request
            throw PermissionError.undetermined
            
        @unknown default:
            throw PermissionError.unknown
        }
    }
}`}
        />

        <DocHeading level={2}>Limited Access (PHPicker)</DocHeading>
        <DocParagraph>
          For users who prefer not to grant full library access, use iOS's PHPicker to let 
          them select specific photos. This provides a privacy-first alternative with 
          reduced personalization capabilities.
        </DocParagraph>

        <CodeBlock
          language="swift"
          filename="LimitedAccessPicker.swift"
          code={`import PhotosUI
import PersonaLens

class LimitedAccessPicker: PHPickerViewControllerDelegate {
    
    /// Present PHPicker for user-selected photos
    func presentPicker(from viewController: UIViewController) {
        var config = PHPickerConfiguration()
        config.selectionLimit = 50  // Limit for personalization
        config.filter = .images
        config.preferredAssetRepresentationMode = .current
        
        let picker = PHPickerViewController(configuration: config)
        picker.delegate = self
        viewController.present(picker, animated: true)
    }
    
    func picker(_ picker: PHPickerViewController, 
                didFinishPicking results: [PHPickerResult]) {
        picker.dismiss(animated: true)
        
        Task {
            let images = try await loadImages(from: results)
            let analysis = try await sdk.analyzeSelectedPhotos(images)
            // Process limited results
        }
    }
    
    private func loadImages(from results: [PHPickerResult]) async throws -> [UIImage] {
        var images: [UIImage] = []
        
        for result in results {
            if let image = try await result.itemProvider.loadImage() {
                images.append(image)
            }
        }
        
        return images
    }
}`}
        />

        <DocHeading level={2}>Accessing Specific Albums</DocHeading>
        <DocParagraph>
          When full access is granted, you can target specific albums for focused analysis:
        </DocParagraph>

        <CodeBlock
          language="swift"
          filename="AlbumAccess.swift"
          code={`import Photos

extension PersonaLensSDK {
    
    /// Fetch assets from specific album types
    func fetchAlbumAssets(types: [AlbumType]) async throws -> [PHAsset] {
        var assets: [PHAsset] = []
        
        for type in types {
            let collection = fetchCollection(for: type)
            let fetchResult = PHAsset.fetchAssets(
                in: collection,
                options: assetFetchOptions
            )
            
            fetchResult.enumerateObjects { asset, _, _ in
                assets.append(asset)
            }
        }
        
        return assets
    }
    
    private func fetchCollection(for type: AlbumType) -> PHAssetCollection {
        let subtype: PHAssetCollectionSubtype = switch type {
        case .favorites:    .smartAlbumFavorites
        case .screenshots:  .smartAlbumScreenshots
        case .selfies:      .smartAlbumSelfPortraits
        case .recents:      .smartAlbumRecentlyAdded
        }
        
        return PHAssetCollection.fetchAssetCollections(
            with: .smartAlbum,
            subtype: subtype,
            options: nil
        ).firstObject!
    }
}

enum AlbumType {
    case favorites
    case screenshots
    case selfies
    case recents
}`}
        />

        <DocCallout type="info" title="WhatsApp & Third-Party Albums">
          Third-party app albums (WhatsApp, Instagram, etc.) can be accessed via 
          <code>PHAssetCollectionSubtype.albumRegular</code> and filtering by album title. 
          These albums are only available with full library access.
        </DocCallout>
      </DocSection>

      <DocSection id="permission-handling">
        <DocHeading level={1}>Permission Handling</DocHeading>
        
        <DocParagraph>
          Proper permission handling is critical for a smooth user experience. The SDK provides 
          detailed callbacks and error types to handle all permission states gracefully.
        </DocParagraph>

        <DocHeading level={2}>Permission States</DocHeading>
        
        <DocTable
          headers={['State', 'Description', 'SDK Behavior']}
          rows={[
            ['authorized', 'Full library access granted', 'Full scanning enabled'],
            ['limited', 'User selected specific photos', 'Analyze selected photos only'],
            ['denied', 'User denied access', 'Show settings redirect'],
            ['restricted', 'Parental controls active', 'Feature unavailable'],
            ['notDetermined', 'Not yet requested', 'Request permission'],
          ]}
        />

        <DocHeading level={2}>Permission Observer</DocHeading>
        <DocParagraph>
          Monitor permission changes to react when users modify access in Settings:
        </DocParagraph>

        <CodeBlock
          language="swift"
          filename="PermissionObserver.swift"
          code={`import Photos
import Combine

class PermissionObserver: ObservableObject {
    @Published var currentStatus: PHAuthorizationStatus = .notDetermined
    
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        // Check initial status
        currentStatus = PHPhotoLibrary.authorizationStatus(for: .readWrite)
        
        // Observe changes when app becomes active
        NotificationCenter.default.publisher(for: UIApplication.didBecomeActiveNotification)
            .sink { [weak self] _ in
                self?.refreshStatus()
            }
            .store(in: &cancellables)
    }
    
    func refreshStatus() {
        let newStatus = PHPhotoLibrary.authorizationStatus(for: .readWrite)
        
        if newStatus != currentStatus {
            currentStatus = newStatus
            handleStatusChange(newStatus)
        }
    }
    
    private func handleStatusChange(_ status: PHAuthorizationStatus) {
        switch status {
        case .authorized:
            // Re-enable scanning
            Task { try await PersonaLensSDK.shared.resumeScanning() }
            
        case .limited:
            // Prompt for additional photo selection
            showLimitedAccessPrompt()
            
        case .denied:
            // User revoked access
            PersonaLensSDK.shared.pauseScanning()
            
        default:
            break
        }
    }
}`}
        />
      </DocSection>

      <DocSection id="denial-flow">
        <DocHeading level={1}>Permission Denial Flow</DocHeading>
        
        <DocParagraph>
          When users deny photo access, provide a clear path to enable it manually. 
          The SDK includes helpers for building compelling permission prompts.
        </DocParagraph>

        <DocHeading level={2}>Error Callbacks</DocHeading>

        <CodeBlock
          language="swift"
          filename="PermissionErrors.swift"
          code={`import PersonaLens

enum PermissionError: Error {
    case accessDenied(PHAuthorizationStatus)
    case undetermined
    case unknown
    case restrictedByParent
    
    var userMessage: String {
        switch self {
        case .accessDenied:
            return "Photo access is required for personalized recommendations. " +
                   "Enable it in Settings to continue."
        case .restrictedByParent:
            return "Photo access is restricted on this device."
        case .undetermined:
            return "Please grant photo access to enable personalization."
        case .unknown:
            return "An unexpected error occurred. Please try again."
        }
    }
    
    var canRedirectToSettings: Bool {
        if case .accessDenied = self { return true }
        return false
    }
}`}
        />

        <DocHeading level={2}>Settings Redirect UI</DocHeading>

        <CodeBlock
          language="swift"
          filename="PermissionPromptView.swift"
          code={`import SwiftUI

struct PermissionPromptView: View {
    let error: PermissionError
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        VStack(spacing: 24) {
            // Icon
            Image(systemName: "photo.on.rectangle.angled")
                .font(.system(size: 64))
                .foregroundStyle(.secondary)
            
            // Title
            Text("Enable Photo Access")
                .font(.title2.bold())
            
            // Description
            Text(error.userMessage)
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            // Benefits list
            VStack(alignment: .leading, spacing: 12) {
                BenefitRow(icon: "sparkles", text: "Personalized product recommendations")
                BenefitRow(icon: "camera.viewfinder", text: "Virtual try-on experiences")
                BenefitRow(icon: "house", text: "Room visualization features")
            }
            .padding()
            .background(.quaternary, in: RoundedRectangle(cornerRadius: 12))
            
            Spacer()
            
            // Action buttons
            if error.canRedirectToSettings {
                Button("Open Settings") {
                    openSettings()
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
            }
            
            Button("Maybe Later") {
                dismiss()
            }
            .foregroundStyle(.secondary)
        }
        .padding(32)
    }
    
    private func openSettings() {
        guard let url = URL(string: UIApplication.openSettingsURLString) else { return }
        UIApplication.shared.open(url)
    }
}

struct BenefitRow: View {
    let icon: String
    let text: String
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(.tint)
            Text(text)
                .font(.subheadline)
        }
    }
}`}
        />

        <DocCallout type="warning" title="Best Practice">
          Always explain <em>why</em> you need photo access before requesting it. 
          Users are 3x more likely to grant access when they understand the benefits.
          Consider showing a pre-permission screen before the system dialog.
        </DocCallout>
      </DocSection>
    </>
  );
}
