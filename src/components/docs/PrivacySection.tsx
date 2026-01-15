import { CodeBlock } from '@/components/ui/CodeBlock';
import { DocSection, DocHeading, DocParagraph, DocList, DocCallout, DocTable } from './DocSection';

export const PrivacySection = () => {
  const privacyManifestCode = `<!-- PrivacyInfo.xcprivacy -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" 
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSPrivacyTracking</key>
    <false/>
    
    <key>NSPrivacyTrackingDomains</key>
    <array/>
    
    <key>NSPrivacyCollectedDataTypes</key>
    <array>
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypePhotosorVideos</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <false/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
            </array>
        </dict>
    </array>
    
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryFileTimestamp</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>C617.1</string>
            </array>
        </dict>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryDiskSpace</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>E174.1</string>
            </array>
        </dict>
    </array>
</dict>
</plist>`;

  const cachingMechanismCode = `import HyperPersonalization

/// Local caching for analysis results
class PLResultCache {
    private let cacheDirectory: URL
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()
    
    /// Cache key based on asset local identifier
    private func cacheKey(for assetId: String) -> String {
        // Hash the identifier for filesystem safety
        return assetId.sha256Hash
    }
    
    /// Store analysis result for an asset
    func cache(
        result: AnalysisResult,
        for assetId: String
    ) async throws {
        let key = cacheKey(for: assetId)
        let fileURL = cacheDirectory.appendingPathComponent("\\(key).json")
        
        let data = try encoder.encode(CachedResult(
            assetId: assetId,
            result: result,
            cachedAt: Date(),
            sdkVersion: PLVersion.current
        ))
        
        try data.write(to: fileURL, options: .atomic)
    }
    
    /// Retrieve cached result if available and valid
    func getCachedResult(for assetId: String) async -> AnalysisResult? {
        let key = cacheKey(for: assetId)
        let fileURL = cacheDirectory.appendingPathComponent("\\(key).json")
        
        guard let data = try? Data(contentsOf: fileURL),
              let cached = try? decoder.decode(CachedResult.self, from: data) else {
            return nil
        }
        
        // Invalidate if SDK version changed (models may differ)
        guard cached.sdkVersion == PLVersion.current else {
            try? FileManager.default.removeItem(at: fileURL)
            return nil
        }
        
        // Invalidate if cache is too old (30 days)
        guard cached.cachedAt.timeIntervalSinceNow > -30 * 24 * 60 * 60 else {
            try? FileManager.default.removeItem(at: fileURL)
            return nil
        }
        
        return cached.result
    }
    
    /// Check if asset needs re-analysis
    func needsAnalysis(assetId: String, modificationDate: Date) async -> Bool {
        guard let cached = await getCachedResult(for: assetId) else {
            return true
        }
        
        // Re-analyze if photo was modified after caching
        return modificationDate > cached.cachedAt
    }
}

struct CachedResult: Codable {
    let assetId: String
    let result: AnalysisResult
    let cachedAt: Date
    let sdkVersion: String
}`;

  const imageNormalizationCode = `import HyperPersonalization

/// Image normalization for consistent model input
class PLImageNormalizer {
    
    /// Normalize image for model input
    func normalize(
        image: UIImage,
        targetSize: CGSize = CGSize(width: 224, height: 224)
    ) throws -> CVPixelBuffer {
        // Step 1: Handle EXIF orientation
        let orientedImage = applyEXIFOrientation(image)
        
        // Step 2: Resize to target dimensions
        let resizedImage = resize(orientedImage, to: targetSize)
        
        // Step 3: Convert color space to RGB
        guard let rgbImage = convertToRGB(resizedImage) else {
            throw PLError.colorSpaceConversionFailed
        }
        
        // Step 4: Create pixel buffer
        return try createPixelBuffer(from: rgbImage, size: targetSize)
    }
    
    /// Apply EXIF orientation to normalize image orientation
    private func applyEXIFOrientation(_ image: UIImage) -> UIImage {
        guard image.imageOrientation != .up else { return image }
        
        UIGraphicsBeginImageContextWithOptions(image.size, false, image.scale)
        image.draw(in: CGRect(origin: .zero, size: image.size))
        let normalizedImage = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()
        
        return normalizedImage ?? image
    }
    
    /// Convert image to RGB color space (AI models require RGB, not BGR)
    private func convertToRGB(_ image: UIImage) -> UIImage? {
        guard let cgImage = image.cgImage else { return nil }
        
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        let bitmapInfo = CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue)
        
        guard let context = CGContext(
            data: nil,
            width: cgImage.width,
            height: cgImage.height,
            bitsPerComponent: 8,
            bytesPerRow: cgImage.width * 4,
            space: colorSpace,
            bitmapInfo: bitmapInfo.rawValue
        ) else { return nil }
        
        context.draw(cgImage, in: CGRect(
            x: 0, y: 0,
            width: cgImage.width,
            height: cgImage.height
        ))
        
        guard let outputCGImage = context.makeImage() else { return nil }
        return UIImage(cgImage: outputCGImage)
    }
    
    /// Create CVPixelBuffer for AI models input
    private func createPixelBuffer(
        from image: UIImage,
        size: CGSize
    ) throws -> CVPixelBuffer {
        let attrs: [CFString: Any] = [
            kCVPixelBufferCGImageCompatibilityKey: true,
            kCVPixelBufferCGBitmapContextCompatibilityKey: true
        ]
        
        var pixelBuffer: CVPixelBuffer?
        let status = CVPixelBufferCreate(
            kCFAllocatorDefault,
            Int(size.width),
            Int(size.height),
            kCVPixelFormatType_32ARGB,
            attrs as CFDictionary,
            &pixelBuffer
        )
        
        guard status == kCVReturnSuccess, let buffer = pixelBuffer else {
            throw PLError.pixelBufferCreationFailed
        }
        
        CVPixelBufferLockBaseAddress(buffer, [])
        defer { CVPixelBufferUnlockBaseAddress(buffer, []) }
        
        guard let context = CGContext(
            data: CVPixelBufferGetBaseAddress(buffer),
            width: Int(size.width),
            height: Int(size.height),
            bitsPerComponent: 8,
            bytesPerRow: CVPixelBufferGetBytesPerRow(buffer),
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue
        ) else {
            throw PLError.contextCreationFailed
        }
        
        guard let cgImage = image.cgImage else {
            throw PLError.invalidImage
        }
        
        context.draw(cgImage, in: CGRect(origin: .zero, size: size))
        
        return buffer
    }
}`;

  return (
    <DocSection id="privacy">
      <DocHeading level={1}>Phase 7: Data Handling & Privacy</DocHeading>
      <DocParagraph>
        HyperPersonalization is designed with privacy-first principles. All analysis happens on-device, 
        and only anonymized embeddings are sent to cloud services when required.
      </DocParagraph>

      <DocHeading level={2} id="privacy-manifest">Apple Privacy Manifest</DocHeading>
      <DocParagraph>
        Starting with iOS 17, Apple requires all apps to include a Privacy Manifest file. This file tells Apple 
        (and users) what data your app accesses and why. If you're using HyperPersonalization, you need to add 
        this file to your project. Copy the configuration below to a file called <code>PrivacyInfo.xcprivacy</code> 
        in your Xcode project.
      </DocParagraph>

      <CodeBlock 
        code={privacyManifestCode} 
        filename="PrivacyInfo.xcprivacy"
        language="xml"
      />

      <DocCallout type="warning" title="App Store Requirement">
        As of Spring 2024, Apple requires all apps using photo access to include a valid 
        Privacy Manifest. Missing or incorrect manifests will result in App Store rejection.
      </DocCallout>

      <DocTable 
        headers={['Data Type', 'Purpose', 'Linked to User', 'Tracking']}
        rows={[
          ['Photos/Videos', 'App Functionality', 'No', 'No'],
          ['Face Embeddings', 'Personalization', 'No', 'No'],
          ['Room Classifications', 'App Functionality', 'No', 'No'],
        ]}
      />

      <DocHeading level={2} id="caching">Caching Mechanism</DocHeading>
      <DocParagraph>
        Caching means saving results so you don't have to do the same work twice. HyperPersonalization saves 
        the results of analyzing photos (like "this is a living room" or "this person is male") on your device. 
        This way, when you open the app again, it doesn't need to re-analyze all your photos - it just uses 
        the saved results. This makes the app much faster and uses less battery.
      </DocParagraph>

      <DocParagraph>
        Here's what the code below does, step by step:
      </DocParagraph>
      <DocList items={[
        '1. Create cache key: Hash the asset ID (SHA-256) to create a safe filename',
        '2. Store results: Save analysis results to disk as JSON files',
        '3. Retrieve cached results: Load previously saved results from disk',
        '4. Validate cache: Check if cache is still valid (same SDK version, not too old)',
        '5. Check if re-analysis needed: Compare photo modification date with cache date',
        '6. Auto-invalidate: Delete cache if SDK version changed or cache is older than 30 days',
      ]} />

      <DocHeading level={3}>Part 1: Store and Retrieve Cache</DocHeading>
      <CodeBlock 
        code={`import HyperPersonalization

/// Local caching for analysis results
class PLResultCache {
    private let cacheDirectory: URL
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()
    
    /// Cache key based on asset local identifier
    private func cacheKey(for assetId: String) -> String {
        // Hash the identifier for filesystem safety
        return assetId.sha256Hash
    }
    
    /// Store analysis result for an asset
    func cache(
        result: AnalysisResult,
        for assetId: String
    ) async throws {
        let key = cacheKey(for: assetId)
        let fileURL = cacheDirectory.appendingPathComponent("\\(key).json")
        
        let data = try encoder.encode(CachedResult(
            assetId: assetId,
            result: result,
            cachedAt: Date(),
            sdkVersion: PLVersion.current
        ))
        
        try data.write(to: fileURL, options: .atomic)
    }`} 
        filename="PLResultCache.swift"
        language="swift"
      />

      <DocHeading level={3}>Part 2: Validate and Check Cache</DocHeading>
      <CodeBlock 
        code={`    /// Retrieve cached result if available and valid
    func getCachedResult(for assetId: String) async -> AnalysisResult? {
        let key = cacheKey(for: assetId)
        let fileURL = cacheDirectory.appendingPathComponent("\\(key).json")
        
        guard let data = try? Data(contentsOf: fileURL),
              let cached = try? decoder.decode(CachedResult.self, from: data) else {
            return nil
        }
        
        // Invalidate if SDK version changed (models may differ)
        guard cached.sdkVersion == PLVersion.current else {
            try? FileManager.default.removeItem(at: fileURL)
            return nil
        }
        
        // Invalidate if cache is too old (30 days)
        guard cached.cachedAt.timeIntervalSinceNow > -30 * 24 * 60 * 60 else {
            try? FileManager.default.removeItem(at: fileURL)
            return nil
        }
        
        return cached.result
    }
    
    /// Check if asset needs re-analysis
    func needsAnalysis(assetId: String, modificationDate: Date) async -> Bool {
        guard let cached = await getCachedResult(for: assetId) else {
            return true
        }
        
        // Re-analyze if photo was modified after caching
        return modificationDate > cached.cachedAt
    }
}

struct CachedResult: Codable {
    let assetId: String
    let result: AnalysisResult
    let cachedAt: Date
    let sdkVersion: String
}`} 
        filename="PLResultCache.swift"
        language="swift"
      />

      <DocList items={[
        'Cache keys are SHA-256 hashes of asset local identifiers',
        'Cached results are invalidated when SDK version changes',
        'Results older than 30 days are automatically purged',
        'Modified photos trigger re-analysis based on modification date',
      ]} />

      <DocHeading level={2} id="image-normalization">Image Normalization</DocHeading>
      <DocParagraph>
        Image normalization means preparing photos so they're in the right format for the AI models. 
        Photos can have different sizes, orientations (some are rotated), and color settings. Before analyzing a photo, 
        HyperPersonalization normalizes it (resizes, rotates, adjusts colors) so the models can process it correctly. 
        This ensures the models work accurately regardless of how the photo was taken or stored.
      </DocParagraph>

      <DocParagraph>
        Here's what the code below does, step by step:
      </DocParagraph>
      <DocList items={[
        '1. Handle EXIF orientation: Fix image rotation based on EXIF data (some photos are rotated)',
        '2. Resize image: Resize to target size (e.g., 224×224 for gender/age models)',
        '3. Convert to RGB: Convert image to RGB color space (AI models require RGB, not BGR)',
        '4. Create pixel buffer: Convert UIImage to CVPixelBuffer which AI models need',
        '5. Lock buffer: Lock pixel buffer for writing, draw image, then unlock',
        '6. Return buffer: Return CVPixelBuffer ready to pass to model',
      ]} />

      <DocHeading level={3}>Part 1: Main Normalization Function</DocHeading>
      <CodeBlock 
        code={`import HyperPersonalization

/// Image normalization for consistent model input
class PLImageNormalizer {
    
    /// Normalize image for model input
    func normalize(
        image: UIImage,
        targetSize: CGSize = CGSize(width: 224, height: 224)
    ) throws -> CVPixelBuffer {
        // Step 1: Handle EXIF orientation
        let orientedImage = applyEXIFOrientation(image)
        
        // Step 2: Resize to target dimensions
        let resizedImage = resize(orientedImage, to: targetSize)
        
        // Step 3: Convert color space to RGB
        guard let rgbImage = convertToRGB(resizedImage) else {
            throw PLError.colorSpaceConversionFailed
        }
        
        // Step 4: Create pixel buffer
        return try createPixelBuffer(from: rgbImage, size: targetSize)
    }`} 
        filename="PLImageNormalizer.swift"
        language="swift"
      />

      <DocHeading level={3}>Part 2: Orientation and Color Space</DocHeading>
      <CodeBlock 
        code={`    /// Apply EXIF orientation to normalize image orientation
    private func applyEXIFOrientation(_ image: UIImage) -> UIImage {
        guard image.imageOrientation != .up else { return image }
        
        UIGraphicsBeginImageContextWithOptions(image.size, false, image.scale)
        image.draw(in: CGRect(origin: .zero, size: image.size))
        let normalizedImage = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()
        
        return normalizedImage ?? image
    }
    
    /// Convert image to RGB color space (AI models require RGB, not BGR)
    private func convertToRGB(_ image: UIImage) -> UIImage? {
        guard let cgImage = image.cgImage else { return nil }
        
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        let bitmapInfo = CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue)
        
        guard let context = CGContext(
            data: nil,
            width: cgImage.width,
            height: cgImage.height,
            bitsPerComponent: 8,
            bytesPerRow: cgImage.width * 4,
            space: colorSpace,
            bitmapInfo: bitmapInfo.rawValue
        ) else { return nil }
        
        context.draw(cgImage, in: CGRect(
            x: 0, y: 0,
            width: cgImage.width,
            height: cgImage.height
        ))
        
        guard let outputCGImage = context.makeImage() else { return nil }
        return UIImage(cgImage: outputCGImage)
    }`} 
        filename="PLImageNormalizer.swift"
        language="swift"
      />

      <DocHeading level={3}>Part 3: Create Pixel Buffer</DocHeading>
      <CodeBlock 
        code={`    /// Create CVPixelBuffer for AI models input
    private func createPixelBuffer(
        from image: UIImage,
        size: CGSize
    ) throws -> CVPixelBuffer {
        let attrs: [CFString: Any] = [
            kCVPixelBufferCGImageCompatibilityKey: true,
            kCVPixelBufferCGBitmapContextCompatibilityKey: true
        ]
        
        var pixelBuffer: CVPixelBuffer?
        let status = CVPixelBufferCreate(
            kCFAllocatorDefault,
            Int(size.width),
            Int(size.height),
            kCVPixelFormatType_32ARGB,
            attrs as CFDictionary,
            &pixelBuffer
        )
        
        guard status == kCVReturnSuccess, let buffer = pixelBuffer else {
            throw PLError.pixelBufferCreationFailed
        }
        
        CVPixelBufferLockBaseAddress(buffer, [])
        defer { CVPixelBufferUnlockBaseAddress(buffer, []) }
        
        guard let context = CGContext(
            data: CVPixelBufferGetBaseAddress(buffer),
            width: Int(size.width),
            height: Int(size.height),
            bitsPerComponent: 8,
            bytesPerRow: CVPixelBufferGetBytesPerRow(buffer),
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue
        ) else {
            throw PLError.contextCreationFailed
        }
        
        guard let cgImage = image.cgImage else {
            throw PLError.invalidImage
        }
        
        context.draw(cgImage, in: CGRect(origin: .zero, size: size))
        
        return buffer
    }
}`} 
        filename="PLImageNormalizer.swift"
        language="swift"
      />

      <DocCallout type="info" title="Color Space">
        AI models expect RGB color space. Images captured in alternative color spaces 
        (including BGR from some sources) are automatically converted during normalization.
      </DocCallout>

      <DocTable 
        headers={['Processing Step', 'Purpose', 'Impact']}
        rows={[
          ['EXIF Orientation', 'Normalize rotation/flip', 'Correct face detection orientation'],
          ['Resize', 'Match model input size', 'Memory efficiency, consistent input'],
          ['RGB Conversion', 'Standardize color space', 'Model compatibility and accuracy'],
          ['Pixel Buffer', 'AI models input format', 'Hardware acceleration support'],
        ]}
      />
    </DocSection>
  );
};
