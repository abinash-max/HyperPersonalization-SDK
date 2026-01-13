import { CodeBlock } from '@/components/ui/CodeBlock';
import { DocSection, DocHeading, DocParagraph, DocCallout, DocList, DocTable } from './DocSection';

export function ModelArchitectureSection() {
  return (
    <>
      <DocSection id="model-inventory">
        <span className="phase-badge mb-4">Phase 2</span>
        <DocHeading level={1}>List of On-Device AI Models</DocHeading>
        
        <DocParagraph>
          HyperPersonalization uses several CoreML models (CoreML is Apple's machine learning framework) that run directly on the device. 
          All models are in CoreML format (.mlmodel files). Here's the complete list:
        </DocParagraph>

        <DocTable
          headers={['Model Name', 'What It Does', 'Input Image Size', 'What It Returns']}
          rows={[
            ['GenderClassifier.mlmodel', 'Looks at a face and determines if it\'s male or female', '224×224 pixels', 'Gender (male/female) + confidence score (0.0 to 1.0)'],
            ['AgeClassifier.mlmodel', 'Looks at a face and estimates the age range', '224×224 pixels', 'Age range (child/teen/adult/senior) + confidence score'],
            ['RoomClassifier.mlmodel', 'Looks at a room photo and identifies the room type', '299×299 pixels', 'Room type (living room/bedroom/kitchen/etc.) + confidence score'],
            ['ObjectDetector.mlmodel', 'Detects furniture and objects in room photos', '416×416 pixels', 'List of detected objects with bounding boxes'],
            ['FaceEmbedding.mlmodel', 'Creates a unique "fingerprint" (embedding) of a face', '112×112 pixels', '512 numbers (vector) representing the face'],
          ]}
        />

        <DocCallout type="info" title="What is CoreML?">
          CoreML is Apple's framework for running machine learning models on iOS devices. 
          These models run on the device (not in the cloud), so they're fast and private. 
          All models are already included in the HyperPersonalization SDK - you don't need to download them separately.
        </DocCallout>

        <DocHeading level={2}>Model Specifications</DocHeading>
        
        <DocParagraph>
          Here's what the code below does, step by step:
        </DocParagraph>
        <DocList items={[
          '1. Define model enum: Create an enum listing all available CoreML models (gender, age, room, etc.)',
          '2. Specify input sizes: Each model needs images in a specific size (e.g., 224×224 for gender, 299×299 for room)',
          '3. Set color space: All models use RGB color space for consistent processing',
          '4. Define pixel format: Models expect images in BGRA format (Blue-Green-Red-Alpha)',
          '5. Benchmark times: Shows expected processing time for each model on A14 Bionic chip',
        ]} />

        <CodeBlock
          language="swift"
          filename="ModelSpecs.swift"
          code={`import CoreML

/// Model specifications and metadata
enum HyperPersonalizationModels {
    
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
        <DocHeading level={1}>How to Use CoreML Models - Step by Step</DocHeading>
        
        <DocParagraph>
          This section shows you exactly how to use each CoreML model. We'll start with the simplest example and build up.
        </DocParagraph>

        <DocHeading level={2}>Step 1: Load a CoreML Model</DocHeading>
        <DocParagraph>
          First, you need to load the model. The model files are already in the HyperPersonalization SDK.
        </DocParagraph>

        <DocParagraph>
          Here's what the code below does, step by step:
        </DocParagraph>
        <DocList items={[
          '1. Create model configuration: Use MLModelConfiguration() to set up how the model runs',
          '2. Set compute units: Use .all to use Neural Engine if available, falling back to GPU/CPU',
          '3. Load the model: Initialize the model class (e.g., GenderClassifier) which loads the .mlmodel file',
          '4. Wrap in Vision framework: Convert to VNCoreMLModel for easier use with Vision framework',
          '5. Return wrapped model: Return the model ready to use for image classification',
        ]} />

        <CodeBlock
          language="swift"
          filename="LoadModel.swift"
          code={`import CoreML
import Vision

class ModelLoader {
    
    /// Step 1: Load the Gender Classifier model
    /// This model is already included in HyperPersonalization SDK
    func loadGenderModel() throws -> VNCoreMLModel {
        // Create model configuration
        let config = MLModelConfiguration()
        config.computeUnits = .all  // Use Neural Engine if available
        
        // Load the model (GenderClassifier is auto-generated from .mlmodel file)
        let model = try GenderClassifier(configuration: config)
        
        // Wrap it in Vision framework for easier use
        let visionModel = try VNCoreMLModel(for: model.model)
        
        return visionModel
    }
    
    /// Step 2: Load the Room Classifier model
    func loadRoomModel() throws -> VNCoreMLModel {
        let config = MLModelConfiguration()
        config.computeUnits = .all
        
        let model = try RoomClassifier(configuration: config)
        return try VNCoreMLModel(for: model.model)
    }
    
    /// Step 3: Load the Age Classifier model
    func loadAgeModel() throws -> VNCoreMLModel {
        let config = MLModelConfiguration()
        config.computeUnits = .all
        
        let model = try AgeClassifier(configuration: config)
        return try VNCoreMLModel(for: model.model)
    }
}`}
        />

        <DocHeading level={2}>Step 2: Prepare Your Image for the Model</DocHeading>
        <DocParagraph>
          Models need images in a specific format. You need to resize the image to the exact size the model expects.
        </DocParagraph>

        <DocParagraph>
          Here's what the code below does, step by step:
        </DocParagraph>
        <DocList items={[
          '1. Resize for specific model: Each model needs a different size (224×224 for gender/age, 299×299 for room)',
          '2. Create graphics context: Use UIGraphicsBeginImageContextWithOptions() to create a drawing context',
          '3. Draw image at new size: Draw the original image scaled to the target size',
          '4. Get resized image: Extract the resized image from the graphics context',
          '5. Convert to CGImage: Convert UIImage to CGImage which Vision framework needs',
        ]} />

        <CodeBlock
          language="swift"
          filename="PrepareImage.swift"
          code={`import UIKit
import CoreML

class ImagePreparer {
    
    /// Resize image to the exact size the model needs
    /// Gender and Age models need 224×224 pixels
    func prepareImageForGenderModel(_ image: UIImage) -> UIImage? {
        return resizeImage(image, to: CGSize(width: 224, height: 224))
    }
    
    /// Room model needs 299×299 pixels
    func prepareImageForRoomModel(_ image: UIImage) -> UIImage? {
        return resizeImage(image, to: CGSize(width: 299, height: 299))
    }
    
    /// Helper function to resize any image
    private func resizeImage(_ image: UIImage, to size: CGSize) -> UIImage? {
        // Create a graphics context
        UIGraphicsBeginImageContextWithOptions(size, false, 1.0)
        defer { UIGraphicsEndImageContext() }
        
        // Draw the image in the new size
        image.draw(in: CGRect(origin: .zero, size: size))
        
        // Get the resized image
        return UIGraphicsGetImageFromCurrentImageContext()
    }
    
    /// Convert UIImage to CGImage (needed for Vision framework)
    func convertToCGImage(_ uiImage: UIImage) -> CGImage? {
        return uiImage.cgImage
    }
}`}
        />

        <DocHeading level={2}>Step 3: Run the Model on Your Image</DocHeading>
        <DocParagraph>
          Now you can pass the prepared image to the model and get results. Here's how to use each model:
        </DocParagraph>

        <DocParagraph>
          Here's what the code below does, step by step:
        </DocParagraph>
        <DocList items={[
          '1. Load models on init: When the class is created, load all models (gender, age, room)',
          '2. Prepare image: Resize the input image to the exact size the model needs (224×224 or 299×299)',
          '3. Create Vision request: Use VNCoreMLRequest to create a request with your loaded model',
          '4. Set crop option: Choose how to handle image (center crop, scale fill, etc.)',
          '5. Create handler: Use VNImageRequestHandler to process the image',
          '6. Run the model: Call handler.perform([request]) to run inference',
          '7. Get results: Extract VNClassificationObservation which contains label and confidence',
          '8. Return result: Create a result struct with the classification (e.g., "male", "living_room") and confidence score',
        ]} />

        <DocHeading level={3}>Part 1: Initialize Models</DocHeading>
        <CodeBlock
          language="swift"
          filename="UseModels.swift"
          code={`import CoreML
import Vision

class ModelUser {
    private let genderModel: VNCoreMLModel
    private let roomModel: VNCoreMLModel
    private let ageModel: VNCoreMLModel
    
    init() throws {
        // Load all models when this class is created
        self.genderModel = try ModelLoader().loadGenderModel()
        self.roomModel = try ModelLoader().loadRoomModel()
        self.ageModel = try ModelLoader().loadAgeModel()
    }`}
        />

        <DocHeading level={3}>Part 2: Classify Gender</DocHeading>
        <CodeBlock
          language="swift"
          filename="UseModels.swift"
          code={`    /// Use Gender Classifier Model
    /// Input: A face image (224×224 pixels)
    /// Output: Gender (male/female) + confidence score
    func classifyGender(faceImage: UIImage) async throws -> GenderResult {
        // Step 1: Prepare the image
        guard let resizedImage = ImagePreparer().prepareImageForGenderModel(faceImage),
              let cgImage = resizedImage.cgImage else {
            throw ModelError.invalidImage
        }
        
        // Step 2: Create a Vision request
        let request = VNCoreMLRequest(model: genderModel)
        request.imageCropAndScaleOption = .centerCrop
        
        // Step 3: Create a handler and run the model
        let handler = VNImageRequestHandler(cgImage: cgImage)
        try handler.perform([request])
        
        // Step 4: Get the results
        guard let observations = request.results as? [VNClassificationObservation],
              let topResult = observations.first else {
            throw ModelError.noResults
        }
        
        // Step 5: Return the result
        return GenderResult(
            label: topResult.identifier,        // "male" or "female"
            confidence: topResult.confidence     // 0.0 to 1.0
        )
    }`}
        />

        <DocHeading level={3}>Part 3: Classify Room</DocHeading>
        <CodeBlock
          language="swift"
          filename="UseModels.swift"
          code={`    /// Use Room Classifier Model
    /// Input: A room image (299×299 pixels)
    /// Output: Room type + confidence score
    func classifyRoom(roomImage: UIImage) async throws -> RoomResult {
        // Step 1: Prepare the image
        guard let resizedImage = ImagePreparer().prepareImageForRoomModel(roomImage),
              let cgImage = resizedImage.cgImage else {
            throw ModelError.invalidImage
        }
        
        // Step 2: Create request
        let request = VNCoreMLRequest(model: roomModel)
        request.imageCropAndScaleOption = .scaleFill
        
        // Step 3: Run the model
        let handler = VNImageRequestHandler(cgImage: cgImage)
        try handler.perform([request])
        
        // Step 4: Get results (top 3 predictions)
        guard let observations = request.results as? [VNClassificationObservation] else {
            throw ModelError.noResults
        }
        
        // Get top 3 predictions
        let predictions = observations.prefix(3).map { observation in
            RoomPrediction(
                label: observation.identifier,      // "living_room", "bedroom", etc.
                confidence: observation.confidence  // 0.0 to 1.0
            )
        }
        
        return RoomResult(predictions: Array(predictions))
    }`}
        />

        <DocHeading level={3}>Part 4: Classify Age</DocHeading>
        <CodeBlock
          language="swift"
          filename="UseModels.swift"
          code={`    /// Use Age Classifier Model
    /// Input: A face image (224×224 pixels)
    /// Output: Age range + confidence score
    func classifyAge(faceImage: UIImage) async throws -> AgeResult {
        guard let resizedImage = ImagePreparer().prepareImageForGenderModel(faceImage),
              let cgImage = resizedImage.cgImage else {
            throw ModelError.invalidImage
        }
        
        let request = VNCoreMLRequest(model: ageModel)
        request.imageCropAndScaleOption = .centerCrop
        
        let handler = VNImageRequestHandler(cgImage: cgImage)
        try handler.perform([request])
        
        guard let observations = request.results as? [VNClassificationObservation],
              let topResult = observations.first else {
            throw ModelError.noResults
        }
        
        return AgeResult(
            ageRange: topResult.identifier,      // "child", "teen", "adult", "senior"
            confidence: topResult.confidence      // 0.0 to 1.0
        )
    }
}

// Error types
enum ModelError: Error {
    case invalidImage
    case noResults
    case modelLoadFailed
}`}
        />

        <DocCallout type="info" title="Understanding the Code">
          <ul>
            <li><strong>VNCoreMLRequest:</strong> This is how you tell Vision framework to use your CoreML model</li>
            <li><strong>VNImageRequestHandler:</strong> This handles running the model on your image</li>
            <li><strong>VNClassificationObservation:</strong> This contains the results (label + confidence)</li>
            <li><strong>async/await:</strong> Model inference can take time, so we use async functions</li>
          </ul>
        </DocCallout>
      </DocSection>

      <DocSection id="image-pipeline">
        <DocHeading level={1}>Image Input Pipeline</DocHeading>
        
        <DocParagraph>
          The SDK converts PHAsset and UIImage inputs into the specific formats required 
          by each CoreML model. Understanding this pipeline helps with debugging and 
          custom implementations.
        </DocParagraph>

        <DocHeading level={2}>PHAsset to Model Input</DocHeading>

        <DocParagraph>
          Here's what the code below does, step by step:
        </DocParagraph>
        <DocList items={[
          '1. Fetch image from Photos: Use PHImageManager to load the image from PHAsset',
          '2. Normalize orientation: Fix image rotation based on EXIF data (some photos are rotated)',
          '3. Resize image: Resize to the exact size the model needs (e.g., 299×299 for room classifier)',
          '4. Create pixel buffer: Convert UIImage to CVPixelBuffer which CoreML models require',
          '5. Set color space: Ensure proper RGB color space conversion',
          '6. Lock buffer: Lock the pixel buffer for writing, draw the image, then unlock',
          '7. Return buffer: Return the CVPixelBuffer ready to pass to the model',
        ]} />

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
        <DocHeading level={1}>What Each Model Returns (Response Structure)</DocHeading>
        
        <DocParagraph>
          When you run a model on an image, it returns a result. This section shows you exactly what data structure you get back from each model.
        </DocParagraph>

        <DocHeading level={2}>Gender Classifier Response</DocHeading>
        <DocParagraph>
          When you run the Gender Classifier, you get back:
        </DocParagraph>

        <DocParagraph>
          Here's what the code below does, step by step:
        </DocParagraph>
        <DocList items={[
          '1. Define result structures: Create structs to hold model results (GenderResult, AgeResult, RoomResult)',
          '2. Gender result: Contains label ("male" or "female") and confidence (0.0-1.0)',
          '3. Age result: Contains ageRange ("child", "teen", "adult", "senior") and confidence',
          '4. Room result: Contains array of top 3 predictions, each with label and confidence',
          '5. Object detection: Returns list of detected objects with bounding boxes (where objects are in image)',
          '6. Face embedding: Returns 512 numbers (vector) representing the face, plus quality score',
        ]} />

        <CodeBlock
          language="swift"
          filename="ModelResponses.swift"
          code={`import Foundation

// MARK: - Gender Classification Result
// Example: { gender: "male", confidence: 0.95 }

struct GenderResult {
    let label: String      // "male" or "female"
    let confidence: Float  // 0.0 to 1.0 (e.g., 0.95 = 95% confident it's male)
}

// Example usage:
// let result = GenderResult(label: "male", confidence: 0.95)
// print(result.label)        // Prints: "male"
// print(result.confidence)   // Prints: 0.95

// MARK: - Age Classification Result
// Example: { ageRange: "adult", confidence: 0.87 }

struct AgeResult {
    let ageRange: String   // "child", "teen", "adult", or "senior"
    let confidence: Float  // 0.0 to 1.0
}

// Example usage:
// let result = AgeResult(ageRange: "adult", confidence: 0.87)
// print(result.ageRange)     // Prints: "adult"
// print(result.confidence)   // Prints: 0.87

// MARK: - Room Classification Result
// Example: { roomType: "living_room", confidence: 0.92, alternatives: [...] }

struct RoomResult {
    let predictions: [RoomPrediction]  // Top 3 predictions
    
    // The best prediction (highest confidence)
    var topPrediction: RoomPrediction? {
        return predictions.first
    }
}

struct RoomPrediction {
    let label: String      // "living_room", "bedroom", "kitchen", "dining_room", etc.
    let confidence: Float  // 0.0 to 1.0
}

// Example usage:
// let prediction1 = RoomPrediction(label: "living_room", confidence: 0.92)
// let prediction2 = RoomPrediction(label: "bedroom", confidence: 0.05)
// let prediction3 = RoomPrediction(label: "kitchen", confidence: 0.03)
// 
// let result = RoomResult(predictions: [prediction1, prediction2, prediction3])
// print(result.topPrediction?.label)      // Prints: "living_room"
// print(result.topPrediction?.confidence)  // Prints: 0.92

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
        <DocHeading level={1}>Confidence Scores - When to Accept or Reject Images</DocHeading>
        
        <DocParagraph>
          Every model returns a <strong>confidence score</strong> (a number between 0.0 and 1.0). 
          This tells you how sure the model is about its prediction. 
          <strong>0.95 means 95% confident</strong>, <strong>0.50 means 50% confident</strong> (basically guessing).
        </DocParagraph>

        <DocParagraph>
          You need to decide: <strong>What confidence score is good enough to use?</strong> 
          If the score is too low, the model might be wrong, and you'll show incorrect personalization to users.
        </DocParagraph>

        <DocHeading level={2}>Recommended Confidence Thresholds</DocHeading>
        <DocParagraph>
          Based on testing, here are the recommended thresholds for each model:
        </DocParagraph>

        <DocTable
          headers={['Model', 'Ideal Score (Use This)', 'Acceptable Score (OK to Use)', 'Reject (Too Low)']}
          rows={[
            ['Gender Classifier', '0.90 or higher (90%+)', '0.75 to 0.90 (75-90%)', 'Below 0.75 (reject)'],
            ['Age Classifier', '0.85 or higher (85%+)', '0.70 to 0.85 (70-85%)', 'Below 0.70 (reject)'],
            ['Room Classifier', '0.80 or higher (80%+)', '0.60 to 0.80 (60-80%)', 'Below 0.60 (reject)'],
            ['Face Quality', '0.80 or higher (80%+)', '0.65 to 0.80 (65-80%)', 'Below 0.65 (reject)'],
          ]}
        />

        <DocHeading level={2}>How to Check Confidence Scores in Code</DocHeading>
        <DocParagraph>
          Here's how to check if a result is good enough to use:
        </DocParagraph>

        <DocParagraph>
          Here's what the code below does, step by step:
        </DocParagraph>
        <DocList items={[
          '1. Check gender confidence: Reject if confidence is below 0.75 (75%), accept if 0.75 or higher',
          '2. Check room confidence: Reject if top prediction confidence is below 0.60 (60%)',
          '3. Check age confidence: Reject if confidence is below 0.70 (70%)',
          '4. Process all results: Check gender, age, and room results before using the image',
          '5. Log decisions: Print whether each result was accepted or rejected with the confidence score',
          '6. Continue if all pass: Only proceed with personalization if all confidence scores meet thresholds',
        ]} />

        <CodeBlock
          language="swift"
          filename="CheckConfidence.swift"
          code={`import Foundation

/// Check if a gender classification result is good enough to use
func shouldUseGenderResult(_ result: GenderResult) -> Bool {
    // Reject if confidence is below 0.75 (75%)
    if result.confidence < 0.75 {
        print("❌ REJECTED: Gender confidence too low (\\(result.confidence))")
        return false
    }
    
    // Accept if confidence is 0.75 or higher
    print("✅ ACCEPTED: Gender confidence is \\(result.confidence)")
    return true
}

/// Check if a room classification result is good enough to use
func shouldUseRoomResult(_ result: RoomResult) -> Bool {
    guard let topPrediction = result.topPrediction else {
        print("❌ REJECTED: No room prediction found")
        return false
    }
    
    // Reject if confidence is below 0.60 (60%)
    if topPrediction.confidence < 0.60 {
        print("❌ REJECTED: Room confidence too low (\\(topPrediction.confidence))")
        return false
    }
    
    // Accept if confidence is 0.60 or higher
    print("✅ ACCEPTED: Room confidence is \\(topPrediction.confidence)")
    return true
}

/// Check if an age classification result is good enough to use
func shouldUseAgeResult(_ result: AgeResult) -> Bool {
    // Reject if confidence is below 0.70 (70%)
    if result.confidence < 0.70 {
        print("❌ REJECTED: Age confidence too low (\\(result.confidence))")
        return false
    }
    
    print("✅ ACCEPTED: Age confidence is \\(result.confidence)")
    return true
}

/// Complete example: Check all results before using them
func processImageResults(
    genderResult: GenderResult,
    ageResult: AgeResult,
    roomResult: RoomResult?
) {
    // Check gender
    guard shouldUseGenderResult(genderResult) else {
        print("Skipping this image - gender confidence too low")
        return
    }
    
    // Check age
    guard shouldUseAgeResult(ageResult) else {
        print("Skipping this image - age confidence too low")
        return
    }
    
    // Check room (if available)
    if let roomResult = roomResult {
        guard shouldUseRoomResult(roomResult) else {
            print("Skipping this image - room confidence too low")
            return
        }
    }
    
    // All checks passed - use this image for personalization!
    print("✅ All confidence scores are good - using this image")
    // Continue with personalization...
}`}
        />

        <DocHeading level={2}>Why These Thresholds Matter</DocHeading>
        <DocParagraph>
          <strong>If you use images with low confidence scores:</strong>
        </DocParagraph>
        <DocList items={[
          'You might show a man women\'s clothing (if gender classification was wrong)',
          'You might show a bed in a kitchen (if room classification was wrong)',
          'Users will see incorrect personalization and lose trust',
        ]} />

        <DocParagraph>
          <strong>If you only use images with high confidence scores:</strong>
        </DocParagraph>
        <DocList items={[
          'Personalization will be accurate',
          'Users will see relevant products',
          'Better user experience overall',
        ]} />

        <DocCallout type="warning" title="Important Rule">
          <strong>Always reject images below the threshold.</strong> 
          It's better to have fewer personalized images that are accurate, 
          than many images that might be wrong. 
          <br/><br/>
          <strong>Gender:</strong> Reject if confidence &lt; 0.75<br/>
          <strong>Age:</strong> Reject if confidence &lt; 0.70<br/>
          <strong>Room:</strong> Reject if confidence &lt; 0.60
        </DocCallout>
      </DocSection>
    </>
  );
}
