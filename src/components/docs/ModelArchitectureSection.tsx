import { CodeBlock } from '@/components/ui/CodeBlock';
import { DocSection, DocHeading, DocParagraph, DocCallout, DocList, DocTable } from './DocSection';

export function ModelArchitectureSection() {
  return (
    <>
      <DocSection id="model-inventory">
        <span className="phase-badge mb-4">Phase 2</span>
        <DocHeading level={1}>Model Inventory</DocHeading>
        
        <DocParagraph>
          HyperPersonalization bundles several optimized CoreML models for on-device inference. 
          All models are quantized for efficient execution on Apple Neural Engine.
        </DocParagraph>

        <DocTable
          headers={['Model', 'Purpose', 'Input Size', 'Output']}
          rows={[
            ['GenderClassifier.mlmodel', 'Classify detected faces by gender', '224×224', 'male/female + confidence'],
            ['AgeClassifier.mlmodel', 'Estimate age range from face', '224×224', 'age bracket + confidence'],
            ['RoomClassifier.mlmodel', 'Identify room type from scene', '299×299', 'room label + confidence'],
            ['ObjectDetector.mlmodel', 'Detect furniture/objects in rooms', '416×416', 'bounding boxes + labels'],
            ['FaceEmbedding.mlmodel', 'Generate 512-dim face embeddings', '112×112', 'Float32[512] vector'],
          ]}
        />

        <DocHeading level={2}>Model Specifications</DocHeading>
        
        <CodeBlock
          language="swift"
          filename="ModelSpecs.swift"
          code={`import CoreML

/// Model specifications and metadata
enum PersonaLensModels {
    
    case genderClassifier
    case ageClassifier
    case roomClassifier
    case objectDetector
    case faceEmbedding
    
    var inputSize: CGSize {
        switch self {
        case .genderClassifier, .ageClassifier:
            return CGSize(width: 224, height: 224)
        case .roomClassifier:
            return CGSize(width: 299, height: 299)
        case .objectDetector:
            return CGSize(width: 416, height: 416)
        case .faceEmbedding:
            return CGSize(width: 112, height: 112)
        }
    }
    
    var colorSpace: CGColorSpace {
        return CGColorSpaceCreateDeviceRGB()
    }
    
    var pixelFormat: OSType {
        return kCVPixelFormatType_32BGRA
    }
    
    /// Expected inference time on A14 Bionic (ms)
    var benchmarkTime: Double {
        switch self {
        case .genderClassifier:  return 2.1
        case .ageClassifier:     return 2.3
        case .roomClassifier:    return 4.8
        case .objectDetector:    return 12.5
        case .faceEmbedding:     return 3.2
        }
    }
}`}
        />

        <DocCallout type="info" title="Neural Engine Optimization">
          All models are compiled with <code>MLComputeUnits.all</code> to leverage 
          the Apple Neural Engine when available, falling back to GPU/CPU on older devices.
        </DocCallout>
      </DocSection>

      <DocSection id="coreml-implementation">
        <DocHeading level={1}>CoreML Implementation</DocHeading>
        
        <DocParagraph>
          Access and interact with bundled CoreML models directly for custom implementations 
          or advanced use cases beyond the standard SDK pipeline.
        </DocParagraph>

        <CodeBlock
          language="swift"
          filename="ModelManager.swift"
          code={`import CoreML
import Vision

class ModelManager {
    
    // Lazy-loaded model instances
    private lazy var genderModel: VNCoreMLModel = {
        let config = MLModelConfiguration()
        config.computeUnits = .all
        
        let model = try! GenderClassifier(configuration: config)
        return try! VNCoreMLModel(for: model.model)
    }()
    
    private lazy var roomModel: VNCoreMLModel = {
        let config = MLModelConfiguration()
        config.computeUnits = .all
        
        let model = try! RoomClassifier(configuration: config)
        return try! VNCoreMLModel(for: model.model)
    }()
    
    /// Classify gender from a face image
    func classifyGender(faceImage: CGImage) async throws -> GenderResult {
        let request = VNCoreMLRequest(model: genderModel)
        request.imageCropAndScaleOption = .centerCrop
        
        let handler = VNImageRequestHandler(cgImage: faceImage)
        try handler.perform([request])
        
        guard let observations = request.results as? [VNClassificationObservation],
              let topResult = observations.first else {
            throw ModelError.noResults
        }
        
        return GenderResult(
            label: topResult.identifier,
            confidence: topResult.confidence
        )
    }
    
    /// Classify room type from scene image
    func classifyRoom(sceneImage: CGImage) async throws -> RoomResult {
        let request = VNCoreMLRequest(model: roomModel)
        request.imageCropAndScaleOption = .scaleFill
        
        let handler = VNImageRequestHandler(cgImage: sceneImage)
        try handler.perform([request])
        
        guard let observations = request.results as? [VNClassificationObservation] else {
            throw ModelError.noResults
        }
        
        // Return top 3 predictions
        let predictions = observations.prefix(3).map { obs in
            RoomPrediction(label: obs.identifier, confidence: obs.confidence)
        }
        
        return RoomResult(predictions: Array(predictions))
    }
}

struct GenderResult {
    let label: String      // "male" or "female"
    let confidence: Float  // 0.0 - 1.0
}

struct RoomResult {
    let predictions: [RoomPrediction]
    
    var topPrediction: RoomPrediction? {
        predictions.first
    }
}

struct RoomPrediction {
    let label: String      // "living_room", "bedroom", etc.
    let confidence: Float
}`}
        />
      </DocSection>

      <DocSection id="image-pipeline">
        <DocHeading level={1}>Image Input Pipeline</DocHeading>
        
        <DocParagraph>
          The SDK converts PHAsset and UIImage inputs into the specific formats required 
          by each CoreML model. Understanding this pipeline helps with debugging and 
          custom implementations.
        </DocParagraph>

        <DocHeading level={2}>PHAsset to Model Input</DocHeading>

        <CodeBlock
          language="swift"
          filename="ImagePipeline.swift"
          code={`import Photos
import CoreML
import Accelerate

class ImagePipeline {
    
    private let imageManager = PHImageManager.default()
    
    /// Convert PHAsset to model-ready CVPixelBuffer
    func prepareInput(
        asset: PHAsset,
        targetSize: CGSize,
        colorSpace: CGColorSpace
    ) async throws -> CVPixelBuffer {
        
        // 1. Fetch high-quality image from Photos
        let image = try await fetchImage(asset: asset, targetSize: targetSize)
        
        // 2. Normalize orientation (handle EXIF rotation)
        let normalizedImage = normalizeOrientation(image)
        
        // 3. Resize with high-quality interpolation
        let resizedImage = resize(normalizedImage, to: targetSize)
        
        // 4. Convert to CVPixelBuffer
        let pixelBuffer = try createPixelBuffer(
            from: resizedImage,
            colorSpace: colorSpace
        )
        
        return pixelBuffer
    }
    
    private func fetchImage(asset: PHAsset, targetSize: CGSize) async throws -> UIImage {
        let options = PHImageRequestOptions()
        options.deliveryMode = .highQualityFormat
        options.resizeMode = .exact
        options.isSynchronous = false
        
        return try await withCheckedThrowingContinuation { continuation in
            imageManager.requestImage(
                for: asset,
                targetSize: targetSize,
                contentMode: .aspectFill,
                options: options
            ) { image, info in
                if let error = info?[PHImageErrorKey] as? Error {
                    continuation.resume(throwing: error)
                } else if let image = image {
                    continuation.resume(returning: image)
                } else {
                    continuation.resume(throwing: PipelineError.imageFetchFailed)
                }
            }
        }
    }
    
    private func normalizeOrientation(_ image: UIImage) -> UIImage {
        guard image.imageOrientation != .up else { return image }
        
        UIGraphicsBeginImageContextWithOptions(image.size, false, image.scale)
        image.draw(in: CGRect(origin: .zero, size: image.size))
        let normalizedImage = UIGraphicsGetImageFromCurrentImageContext()!
        UIGraphicsEndImageContext()
        
        return normalizedImage
    }
    
    private func createPixelBuffer(
        from image: UIImage,
        colorSpace: CGColorSpace
    ) throws -> CVPixelBuffer {
        
        guard let cgImage = image.cgImage else {
            throw PipelineError.cgImageConversionFailed
        }
        
        let width = cgImage.width
        let height = cgImage.height
        
        var pixelBuffer: CVPixelBuffer?
        let attrs: [CFString: Any] = [
            kCVPixelBufferCGImageCompatibilityKey: true,
            kCVPixelBufferCGBitmapContextCompatibilityKey: true
        ]
        
        CVPixelBufferCreate(
            kCFAllocatorDefault,
            width, height,
            kCVPixelFormatType_32BGRA,
            attrs as CFDictionary,
            &pixelBuffer
        )
        
        guard let buffer = pixelBuffer else {
            throw PipelineError.pixelBufferCreationFailed
        }
        
        CVPixelBufferLockBaseAddress(buffer, [])
        defer { CVPixelBufferUnlockBaseAddress(buffer, []) }
        
        let context = CGContext(
            data: CVPixelBufferGetBaseAddress(buffer),
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: CVPixelBufferGetBytesPerRow(buffer),
            space: colorSpace,
            bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | 
                        CGBitmapInfo.byteOrder32Little.rawValue
        )
        
        context?.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
        
        return buffer
    }
}`}
        />

        <DocCallout type="warning" title="Color Space Handling">
          Always ensure proper color space conversion. Models trained on sRGB data will 
          produce incorrect results if given Display P3 or Adobe RGB inputs without conversion.
        </DocCallout>
      </DocSection>

      <DocSection id="response-structure">
        <DocHeading level={1}>Model Response Structure</DocHeading>
        
        <DocParagraph>
          Each model returns structured data with predictions, confidence scores, and 
          additional metadata. Here are the complete response types:
        </DocParagraph>

        <CodeBlock
          language="swift"
          filename="ModelResponses.swift"
          code={`import Foundation

// MARK: - Classification Responses

struct ClassificationResult: Codable {
    let label: String
    let confidence: Float
    let allPredictions: [Prediction]
    let inferenceTimeMs: Double
    
    struct Prediction: Codable {
        let label: String
        let confidence: Float
    }
}

// MARK: - Gender Classification

struct GenderClassificationResult: Codable {
    let gender: Gender
    let confidence: Float
    let rawProbabilities: GenderProbabilities
    
    enum Gender: String, Codable {
        case male
        case female
    }
    
    struct GenderProbabilities: Codable {
        let male: Float
        let female: Float
    }
}

// MARK: - Age Classification

struct AgeClassificationResult: Codable {
    let ageRange: AgeRange
    let confidence: Float
    let estimatedAge: Int  // Midpoint of range
    
    enum AgeRange: String, Codable {
        case child = "0-12"
        case teen = "13-19"
        case youngAdult = "20-35"
        case adult = "36-55"
        case senior = "56+"
    }
}

// MARK: - Room Classification

struct RoomClassificationResult: Codable {
    let roomType: RoomType
    let confidence: Float
    let alternativePredictions: [RoomPrediction]
    let sceneAttributes: SceneAttributes
    
    enum RoomType: String, Codable, CaseIterable {
        case livingRoom = "living_room"
        case bedroom = "bedroom"
        case kitchen = "kitchen"
        case bathroom = "bathroom"
        case diningRoom = "dining_room"
        case office = "office"
        case outdoor = "outdoor"
        case other = "other"
    }
    
    struct RoomPrediction: Codable {
        let roomType: RoomType
        let confidence: Float
    }
    
    struct SceneAttributes: Codable {
        let brightness: Float      // 0-1, dark to bright
        let clutterLevel: Float    // 0-1, minimal to cluttered
        let estimatedArea: String  // "small", "medium", "large"
    }
}

// MARK: - Object Detection

struct ObjectDetectionResult: Codable {
    let detections: [Detection]
    let frameSize: CGSize
    
    struct Detection: Codable {
        let label: String
        let confidence: Float
        let boundingBox: BoundingBox
    }
    
    struct BoundingBox: Codable {
        let x: Float      // Normalized 0-1
        let y: Float      // Normalized 0-1
        let width: Float  // Normalized 0-1
        let height: Float // Normalized 0-1
        
        func toCGRect(in size: CGSize) -> CGRect {
            return CGRect(
                x: CGFloat(x) * size.width,
                y: CGFloat(y) * size.height,
                width: CGFloat(width) * size.width,
                height: CGFloat(height) * size.height
            )
        }
    }
}

// MARK: - Face Embedding

struct FaceEmbeddingResult: Codable {
    let embedding: [Float]  // 512-dimensional vector
    let faceQuality: Float  // 0-1, quality score
    let landmarks: FaceLandmarks?
    
    struct FaceLandmarks: Codable {
        let leftEye: CGPoint
        let rightEye: CGPoint
        let nose: CGPoint
        let leftMouth: CGPoint
        let rightMouth: CGPoint
    }
}`}
        />
      </DocSection>

      <DocSection id="confidence-scores">
        <DocHeading level={1}>Confidence Score Standards</DocHeading>
        
        <DocParagraph>
          Understanding confidence thresholds is critical for making reliable personalization 
          decisions. The SDK provides recommended thresholds based on extensive testing.
        </DocParagraph>

        <DocHeading level={2}>Recommended Thresholds</DocHeading>

        <DocTable
          headers={['Model', 'High Confidence', 'Acceptable', 'Reject']}
          rows={[
            ['Gender Classifier', '≥ 0.90', '0.75 - 0.90', '< 0.75'],
            ['Age Classifier', '≥ 0.85', '0.70 - 0.85', '< 0.70'],
            ['Room Classifier', '≥ 0.80', '0.60 - 0.80', '< 0.60'],
            ['Object Detector', '≥ 0.70', '0.50 - 0.70', '< 0.50'],
            ['Face Quality', '≥ 0.80', '0.65 - 0.80', '< 0.65'],
          ]}
        />

        <DocHeading level={2}>Implementing Threshold Logic</DocHeading>

        <CodeBlock
          language="swift"
          filename="ConfidenceManager.swift"
          code={`import PersonaLens

struct ConfidenceThresholds {
    /// Minimum confidence to accept a result
    let acceptanceThreshold: Float
    
    /// Minimum confidence to use for high-priority features
    let highConfidenceThreshold: Float
    
    /// Below this, the result should be discarded
    let rejectionThreshold: Float
    
    static let gender = ConfidenceThresholds(
        acceptanceThreshold: 0.75,
        highConfidenceThreshold: 0.90,
        rejectionThreshold: 0.75
    )
    
    static let room = ConfidenceThresholds(
        acceptanceThreshold: 0.60,
        highConfidenceThreshold: 0.80,
        rejectionThreshold: 0.60
    )
    
    static let faceQuality = ConfidenceThresholds(
        acceptanceThreshold: 0.65,
        highConfidenceThreshold: 0.80,
        rejectionThreshold: 0.65
    )
}

enum ConfidenceLevel {
    case high
    case acceptable
    case rejected
    
    init(score: Float, thresholds: ConfidenceThresholds) {
        if score >= thresholds.highConfidenceThreshold {
            self = .high
        } else if score >= thresholds.acceptanceThreshold {
            self = .acceptable
        } else {
            self = .rejected
        }
    }
}

// Usage example
func evaluateResult(_ result: GenderClassificationResult) -> ConfidenceLevel {
    return ConfidenceLevel(
        score: result.confidence,
        thresholds: .gender
    )
}`}
        />

        <DocCallout type="warning" title="Rejection Threshold">
          Images below the rejection threshold (typically <code>0.75</code> for faces, 
          <code>0.60</code> for rooms) should be excluded from personalization entirely. 
          Using low-confidence results degrades the user experience significantly.
        </DocCallout>
      </DocSection>
    </>
  );
}
