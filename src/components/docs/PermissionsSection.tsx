import { CodeBlock } from '@/components/ui/CodeBlock';
import { DocSection, DocHeading, DocParagraph, DocCallout, DocList, DocTable } from './DocSection';

export function PermissionsSection() {
  return (
    <>
      <DocSection id="gallery-access">
        <span className="phase-badge mb-4">Phase 1</span>
        <DocHeading level={1}>Gallery Access Strategy</DocHeading>
        
        <DocParagraph>
          When your app opens, the first thing you need to do is ask the user for permission to access their photos. 
          HyperPersonalization supports three types of access: <strong>whole gallery access</strong>, <strong>limited access</strong> 
          (where user selects specific images), and <strong>specific folder access</strong> (like Favorites, Screenshots, or WhatsApp folders).
        </DocParagraph>

        <DocHeading level={2}>Step 1: Request Whole Gallery Access</DocHeading>
        <DocParagraph>
          This is the simplest approach. You request permission to access all photos in the user's gallery. 
          If granted, you can scan and analyze all their photos for personalization.
        </DocParagraph>

        <CodeBlock
          language="swift"
          filename="PermissionManager.swift"
          code={`import Photos

class PermissionManager {
    
    /// Step 1: Check current permission status
    func checkPermissionStatus() -> PHAuthorizationStatus {
        return PHPhotoLibrary.authorizationStatus(for: .readWrite)
    }
    
    /// Step 2: Request full gallery access
    /// This will show a system dialog asking the user for permission
    func requestFullGalleryAccess() async -> PHAuthorizationStatus {
        // This is an async function that waits for user's response
        let status = await PHPhotoLibrary.requestAuthorization(for: .readWrite)
        return status
    }
    
    /// Step 3: Handle the permission result
    func handlePermissionResult(_ status: PHAuthorizationStatus) {
        switch status {
        case .authorized:
            // ✅ User granted full access - you can now access all photos
            print("Full gallery access granted!")
            // Now you can fetch all photos from the gallery
            fetchAllPhotos()
            
        case .limited:
            // ⚠️ User selected only specific photos
            print("Limited access - user selected specific photos")
            // You'll need to use PHPicker to let user select photos
            showPhotoPicker()
            
        case .denied:
            // ❌ User denied access
            print("Access denied by user")
            // Show error message and prompt user to upload photos manually
            showPermissionDeniedError()
            
        case .restricted:
            // 🔒 Parental controls or restrictions active
            print("Access restricted (parental controls)")
            showRestrictedAccessError()
            
        case .notDetermined:
            // ⏳ Permission not yet requested
            print("Permission not yet requested")
            // Request permission now
            Task {
                let newStatus = await requestFullGalleryAccess()
                handlePermissionResult(newStatus)
            }
            
        @unknown default:
            print("Unknown permission status")
        }
    }
    
    /// Fetch all photos when full access is granted
    private func fetchAllPhotos() {
        let fetchOptions = PHFetchOptions()
        fetchOptions.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: false)]
        
        // Fetch all images
        let allPhotos = PHAsset.fetchAssets(with: .image, options: fetchOptions)
        print("Found \\(allPhotos.count) photos in gallery")
        
        // Now you can process these photos with HyperPersonalization
    }
}`}
        />

        <DocHeading level={2}>Step 2: Limited Access - User Selects Specific Images</DocHeading>
        <DocParagraph>
          If the user doesn't want to give full gallery access, you can use PHPicker to let them select specific photos. 
          This is more privacy-friendly but limits the number of photos you can analyze.
        </DocParagraph>

        <CodeBlock
          language="swift"
          filename="LimitedAccessPicker.swift"
          code={`import PhotosUI
import UIKit

class LimitedAccessPicker: NSObject, PHPickerViewControllerDelegate {
    weak var viewController: UIViewController?
    
    /// Show the photo picker to let user select images
    func showPhotoPicker(from viewController: UIViewController) {
        self.viewController = viewController
        
        // Configure the picker
        var config = PHPickerConfiguration()
        config.selectionLimit = 50  // Maximum 50 photos user can select
        config.filter = .images     // Only show images, not videos
        config.preferredAssetRepresentationMode = .current
        
        // Create and present the picker
        let picker = PHPickerViewController(configuration: config)
        picker.delegate = self
        viewController.present(picker, animated: true)
    }
    
    /// This function is called when user finishes selecting photos
    func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
        // Dismiss the picker
        picker.dismiss(animated: true)
        
        // Process selected photos
        Task {
            do {
                let images = try await loadSelectedImages(from: results)
                print("User selected \\(images.count) photos")
                
                // Now you can analyze these images with HyperPersonalization
                // analyzeImages(images)
                
            } catch {
                print("Error loading images: \\(error)")
            }
        }
    }
    
    /// Convert PHPickerResult to UIImage array
    private func loadSelectedImages(from results: [PHPickerResult]) async throws -> [UIImage] {
        var images: [UIImage] = []
        
        for result in results {
            // Load the image from the picker result
            if result.itemProvider.canLoadObject(ofClass: UIImage.self) {
                do {
                    let image = try await result.itemProvider.loadObject(ofClass: UIImage.self) as? UIImage
                    if let image = image {
                        images.append(image)
                    }
                } catch {
                    print("Failed to load image: \\(error)")
                }
            }
        }
        
        return images
    }
}`}
        />

        <DocHeading level={2}>Step 3: Access Specific Folders (Favorites, Screenshots, WhatsApp)</DocHeading>
        <DocParagraph>
          When you have full gallery access, you can access specific folders like Favorites, Screenshots, or even third-party app folders like WhatsApp. 
          This is useful when you want to focus on specific types of photos.
        </DocParagraph>

        <CodeBlock
          language="swift"
          filename="SpecificFolderAccess.swift"
          code={`import Photos

class SpecificFolderAccess {
    
    /// Get photos from Favorites folder
    func getFavoritePhotos() -> [PHAsset] {
        // Step 1: Find the Favorites album
        let favoritesCollection = PHAssetCollection.fetchAssetCollections(
            with: .smartAlbum,
            subtype: .smartAlbumFavorites,
            options: nil
        )
        
        guard let favorites = favoritesCollection.firstObject else {
            print("Favorites album not found")
            return []
        }
        
        // Step 2: Fetch all photos from Favorites
        let fetchOptions = PHFetchOptions()
        fetchOptions.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: false)]
        
        let assets = PHAsset.fetchAssets(in: favorites, options: fetchOptions)
        var photos: [PHAsset] = []
        
        assets.enumerateObjects { asset, _, _ in
            if asset.mediaType == .image {
                photos.append(asset)
            }
        }
        
        print("Found \\(photos.count) favorite photos")
        return photos
    }
    
    /// Get photos from Screenshots folder
    func getScreenshotPhotos() -> [PHAsset] {
        let screenshotsCollection = PHAssetCollection.fetchAssetCollections(
            with: .smartAlbum,
            subtype: .smartAlbumScreenshots,
            options: nil
        )
        
        guard let screenshots = screenshotsCollection.firstObject else {
            return []
        }
        
        let assets = PHAsset.fetchAssets(in: screenshots, options: nil)
        var photos: [PHAsset] = []
        
        assets.enumerateObjects { asset, _, _ in
            if asset.mediaType == .image {
                photos.append(asset)
            }
        }
        
        print("Found \\(photos.count) screenshots")
        return photos
    }
    
    /// Get photos from Selfies folder
    func getSelfiePhotos() -> [PHAsset] {
        let selfiesCollection = PHAssetCollection.fetchAssetCollections(
            with: .smartAlbum,
            subtype: .smartAlbumSelfPortraits,
            options: nil
        )
        
        guard let selfies = selfiesCollection.firstObject else {
            return []
        }
        
        let assets = PHAsset.fetchAssets(in: selfies, options: nil)
        var photos: [PHAsset] = []
        
        assets.enumerateObjects { asset, _, _ in
            if asset.mediaType == .image {
                photos.append(asset)
            }
        }
        
        print("Found \\(photos.count) selfies")
        return photos
    }
    
    /// Get photos from WhatsApp folder (or any third-party app folder)
    func getWhatsAppPhotos() -> [PHAsset] {
        // Step 1: Fetch all regular albums (not smart albums)
        let allAlbums = PHAssetCollection.fetchAssetCollections(
            with: .album,
            subtype: .albumRegular,
            options: nil
        )
        
        var whatsappPhotos: [PHAsset] = []
        
        // Step 2: Find the WhatsApp album by name
        allAlbums.enumerateObjects { collection, _, _ in
            // Check if this is the WhatsApp album
            if let title = collection.localizedTitle?.lowercased(),
               title.contains("whatsapp") {
                
                // Step 3: Fetch photos from this album
                let assets = PHAsset.fetchAssets(in: collection, options: nil)
                assets.enumerateObjects { asset, _, _ in
                    if asset.mediaType == .image {
                        whatsappPhotos.append(asset)
                    }
                }
                
                print("Found \\(whatsappPhotos.count) WhatsApp photos")
            }
        }
        
        return whatsappPhotos
    }
    
    /// Get photos from multiple specific folders
    func getPhotosFromMultipleFolders(folderTypes: [FolderType]) -> [PHAsset] {
        var allPhotos: [PHAsset] = []
        
        for folderType in folderTypes {
            switch folderType {
            case .favorites:
                allPhotos.append(contentsOf: getFavoritePhotos())
            case .screenshots:
                allPhotos.append(contentsOf: getScreenshotPhotos())
            case .selfies:
                allPhotos.append(contentsOf: getSelfiePhotos())
            case .whatsapp:
                allPhotos.append(contentsOf: getWhatsAppPhotos())
            }
        }
        
        return allPhotos
    }
}

enum FolderType {
    case favorites
    case screenshots
    case selfies
    case whatsapp
}`}
        />

        <DocCallout type="info" title="Important Notes">
          <ul>
            <li><strong>Full Gallery Access:</strong> Requires user to grant permission. Best for comprehensive personalization.</li>
            <li><strong>Limited Access:</strong> User selects photos manually. More privacy-friendly but limited photos.</li>
            <li><strong>Specific Folders:</strong> Only works with full gallery access. Useful for targeted analysis.</li>
            <li><strong>WhatsApp/Third-party folders:</strong> These are regular albums, so you need to search by album name.</li>
          </ul>
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
            Task { try await HyperPersonalizationSDK.shared.resumeScanning() }
            
        case .limited:
            // Prompt for additional photo selection
            showLimitedAccessPrompt()
            
        case .denied:
            // User revoked access
            HyperPersonalizationSDK.shared.pauseScanning()
            
        default:
            break
        }
    }
}`}
        />
      </DocSection>

      <DocSection id="denial-flow">
        <DocHeading level={1}>What Happens When User Denies Access?</DocHeading>
        
        <DocParagraph>
          When a user denies photo access, you need to handle this gracefully. This section shows you:
          <strong>what error the developer sees</strong> and <strong>what message to show the user in the UI</strong>.
        </DocParagraph>

        <DocHeading level={2}>Step 1: Detect Permission Denial</DocHeading>
        <DocParagraph>
          When you check the permission status and it's denied, you'll get a specific error. 
          Here's how to detect and handle it:
        </DocParagraph>

        <CodeBlock
          language="swift"
          filename="PermissionErrorHandling.swift"
          code={`import Photos

enum PermissionError: Error {
    case accessDenied
    case restrictedByParent
    case notDetermined
    
    /// This is what the DEVELOPER sees in console/logs
    var developerMessage: String {
        switch self {
        case .accessDenied:
            return "PermissionError.accessDenied - User denied photo library access"
        case .restrictedByParent:
            return "PermissionError.restrictedByParent - Parental controls are active"
        case .notDetermined:
            return "PermissionError.notDetermined - Permission not yet requested"
        }
    }
    
    /// This is what the USER sees in the UI
    var userFriendlyMessage: String {
        switch self {
        case .accessDenied:
            return "We need access to your photos to personalize your shopping experience. " +
                   "Please upload a photo for personalization, or enable photo access in Settings."
        case .restrictedByParent:
            return "Photo access is restricted on this device. Please contact the device administrator."
        case .notDetermined:
            return "Please grant photo access to enable personalization features."
        }
    }
}

class PermissionErrorHandler {
    
    /// Check permission and handle denial
    func checkAndHandlePermission() {
        let status = PHPhotoLibrary.authorizationStatus(for: .readWrite)
        
        switch status {
        case .denied:
            // ❌ User denied access
            let error = PermissionError.accessDenied
            
            // Log error for developer (in console/debugging)
            print("❌ DEVELOPER ERROR: \\(error.developerMessage)")
            
            // Show user-friendly message in UI
            showPermissionDeniedUI(error: error)
            
        case .restricted:
            // 🔒 Restricted by parental controls
            let error = PermissionError.restrictedByParent
            print("❌ DEVELOPER ERROR: \\(error.developerMessage)")
            showPermissionDeniedUI(error: error)
            
        case .notDetermined:
            // ⏳ Not yet requested
            let error = PermissionError.notDetermined
            print("⚠️ DEVELOPER WARNING: \\(error.developerMessage)")
            // Request permission
            requestPermission()
            
        case .authorized, .limited:
            // ✅ Access granted
            print("✅ Permission granted - proceeding with photo analysis")
            // Continue with normal flow
            
        @unknown default:
            print("❌ DEVELOPER ERROR: Unknown permission status")
        }
    }
    
    /// Show user-friendly error UI
    private func showPermissionDeniedUI(error: PermissionError) {
        // This will be shown to the user
        // See the UI implementation below
    }
}`}
        />

        <DocHeading level={2}>Step 2: Show User-Friendly Error Message in UI</DocHeading>
        <DocParagraph>
          When access is denied, show a friendly message asking the user to upload a photo manually. 
          This is what the user sees in your app:
        </DocParagraph>

        <CodeBlock
          language="swift"
          filename="PermissionDeniedView.swift"
          code={`import SwiftUI

/// This is the UI that users see when they deny photo access
struct PermissionDeniedView: View {
    let error: PermissionError
    @State private var showImagePicker = false
    
    var body: some View {
        VStack(spacing: 24) {
            // Icon
            Image(systemName: "photo.badge.plus")
                .font(.system(size: 64))
                .foregroundColor(.blue)
            
            // Title
            Text("Photo Access Needed")
                .font(.title2)
                .fontWeight(.bold)
            
            // User-friendly message
            Text(error.userFriendlyMessage)
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            // Alternative: Manual upload option
            VStack(spacing: 16) {
                Text("Or upload a photo manually:")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Button(action: {
                    showImagePicker = true
                }) {
                    HStack {
                        Image(systemName: "photo.on.rectangle")
                        Text("Upload Photo for Personalization")
                    }
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
            }
            .padding()
            .background(Color.gray.opacity(0.1))
            .cornerRadius(12)
            
            // Option to open Settings
            Button("Open Settings to Enable Access") {
                openSettings()
            }
            .font(.subheadline)
            .foregroundColor(.blue)
        }
        .padding(32)
        .sheet(isPresented: $showImagePicker) {
            // Show image picker for manual upload
            ImagePickerView { image in
                // Handle uploaded image
                handleUploadedImage(image)
            }
        }
    }
    
    /// Open iOS Settings app
    private func openSettings() {
        if let url = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(url)
        }
    }
    
    /// Handle manually uploaded image
    private func handleUploadedImage(_ image: UIImage) {
        print("User uploaded image manually")
        // Process this image with HyperPersonalization
        // analyzeImage(image)
    }
}

/// Simple image picker for manual upload
struct ImagePickerView: UIViewControllerRepresentable {
    let onImageSelected: (UIImage) -> Void
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .photoLibrary
        picker.delegate = context.coordinator
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(onImageSelected: onImageSelected)
    }
    
    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let onImageSelected: (UIImage) -> Void
        
        init(onImageSelected: @escaping (UIImage) -> Void) {
            self.onImageSelected = onImageSelected
        }
        
        func imagePickerController(_ picker: UIImagePickerController, 
                                  didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            if let image = info[.originalImage] as? UIImage {
                onImageSelected(image)
            }
            picker.dismiss(animated: true)
        }
    }
}`}
        />

        <DocHeading level={2}>Step 3: Complete Error Handling Example</DocHeading>
        <DocParagraph>
          Here's a complete example showing how to handle permission denial from start to finish:
        </DocParagraph>

        <CodeBlock
          language="swift"
          filename="CompletePermissionFlow.swift"
          code={`import Photos
import SwiftUI

class PermissionFlowManager: ObservableObject {
    @Published var permissionStatus: PHAuthorizationStatus = .notDetermined
    @Published var showPermissionDeniedView = false
    @Published var showManualUpload = false
    
    /// Complete permission flow
    func handlePermissionFlow() {
        // Step 1: Check current status
        let status = PHPhotoLibrary.authorizationStatus(for: .readWrite)
        permissionStatus = status
        
        switch status {
        case .notDetermined:
            // Step 2: Request permission
            Task {
                let newStatus = await PHPhotoLibrary.requestAuthorization(for: .readWrite)
                await MainActor.run {
                    permissionStatus = newStatus
                    handlePermissionResult(newStatus)
                }
            }
            
        case .denied, .restricted:
            // Step 3: Show error UI
            showPermissionDeniedView = true
            
        case .authorized, .limited:
            // Step 4: Proceed with photo analysis
            proceedWithPhotoAnalysis()
        }
    }
    
    /// Handle permission result
    private func handlePermissionResult(_ status: PHAuthorizationStatus) {
        switch status {
        case .denied:
            // DEVELOPER: Log error
            print("❌ DEVELOPER ERROR: Permission denied by user")
            print("   Error Code: PermissionError.accessDenied")
            print("   Solution: Show manual upload UI or redirect to Settings")
            
            // USER: Show friendly message
            showPermissionDeniedView = true
            
        case .restricted:
            print("❌ DEVELOPER ERROR: Permission restricted")
            print("   Error Code: PermissionError.restrictedByParent")
            showPermissionDeniedView = true
            
        case .authorized, .limited:
            print("✅ Permission granted")
            proceedWithPhotoAnalysis()
            
        default:
            break
        }
    }
    
    /// Proceed with normal photo analysis
    private func proceedWithPhotoAnalysis() {
        print("Starting photo analysis...")
        // Your normal HyperPersonalization flow here
    }
}

/// Usage in SwiftUI View
struct ContentView: View {
    @StateObject private var permissionManager = PermissionFlowManager()
    
    var body: some View {
        VStack {
            if permissionManager.showPermissionDeniedView {
                PermissionDeniedView(error: .accessDenied)
            } else {
                // Your main app content
                Text("App Content")
            }
        }
        .onAppear {
            permissionManager.handlePermissionFlow()
        }
    }
}`}
        />

        <DocTable
          headers={['Situation', 'Developer Sees (Console)', 'User Sees (UI)']}
          rows={[
            ['Permission Denied', 'PermissionError.accessDenied', 'Please upload a photo for personalization'],
            ['Restricted by Parent', 'PermissionError.restrictedByParent', 'Photo access is restricted on this device'],
            ['Permission Granted', '✅ Permission granted', 'Normal app flow continues'],
          ]}
        />

        <DocCallout type="warning" title="Important">
          <strong>Always provide a fallback:</strong> When users deny access, give them the option to upload photos manually. 
          Never just show an error - always provide a way forward for the user.
        </DocCallout>
      </DocSection>
    </>
  );
}
