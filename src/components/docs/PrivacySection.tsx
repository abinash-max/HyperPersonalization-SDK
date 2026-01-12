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

  const cachingMechanismCode = `import PersonaLens

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

  const imageNormalizationCode = `import PersonaLens

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
    
    /// Convert image to RGB color space (CoreML requires RGB, not BGR)
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
    
    /// Create CVPixelBuffer for CoreML input
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
        PersonaLens is designed with privacy-first principles. All analysis happens on-device, 
        and only anonymized embeddings are sent to cloud services when required.
      </DocParagraph>

      <DocHeading level={2} id="privacy-manifest">Apple Privacy Manifest</DocHeading>
      <DocParagraph>
        Starting iOS 17, apps must include a Privacy Manifest declaring data usage. 
        Copy this configuration to your project's <code>PrivacyInfo.xcprivacy</code> file.
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
        PersonaLens caches analysis results locally to avoid re-scanning the entire library 
        on every app launch.
      </DocParagraph>

      <CodeBlock 
        code={cachingMechanismCode} 
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
        Proper image normalization ensures consistent model accuracy across different 
        image sources and orientations.
      </DocParagraph>

      <CodeBlock 
        code={imageNormalizationCode} 
        filename="PLImageNormalizer.swift"
        language="swift"
      />

      <DocCallout type="info" title="Color Space">
        CoreML models expect RGB color space. Images captured in alternative color spaces 
        (including BGR from some sources) are automatically converted during normalization.
      </DocCallout>

      <DocTable 
        headers={['Processing Step', 'Purpose', 'Impact']}
        rows={[
          ['EXIF Orientation', 'Normalize rotation/flip', 'Correct face detection orientation'],
          ['Resize', 'Match model input size', 'Memory efficiency, consistent input'],
          ['RGB Conversion', 'Standardize color space', 'Model compatibility and accuracy'],
          ['Pixel Buffer', 'CoreML input format', 'Hardware acceleration support'],
        ]}
      />
    </DocSection>
  );
};
