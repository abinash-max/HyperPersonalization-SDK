import { CodeBlock } from '@/components/ui/CodeBlock';
import { DocSection, DocHeading, DocParagraph, DocList, DocCallout, DocTable } from './DocSection';

export const HumanAnalysisSection = () => {
  const fashionAnalysisCode = `import HyperPersonalization

class FashionAnalyzer {
    private let faceDetector: PLFaceDetector
    private let genderClassifier: PLGenderClassifier
    private let ageClassifier: PLAgeClassifier
    
    init() {
        self.faceDetector = PLFaceDetector()
        self.genderClassifier = PLGenderClassifier()
        self.ageClassifier = PLAgeClassifier()
    }
    
    /// Complete fashion analysis pipeline
    func analyzeFashionProfile(
        from image: UIImage
    ) async throws -> FashionProfile {
        // Step 1: Detect faces in the image
        let faces = try await faceDetector.detectFaces(in: image)
        
        guard let primaryFace = faces.first else {
            throw PLError.faceNotFound
        }
        
        // Step 2: Crop face region with padding
        let croppedFace = try cropFaceRegion(
            from: image,
            face: primaryFace,
            padding: 0.3 // 30% padding around face
        )
        
        // Step 3: Classify gender
        let genderResult = try await genderClassifier.classify(croppedFace)
        
        // Step 4: Classify age group
        let ageResult = try await ageClassifier.classify(croppedFace)
        
        return FashionProfile(
            faceRegion: primaryFace.boundingBox,
            gender: genderResult.classification,
            genderConfidence: genderResult.confidence,
            ageGroup: ageResult.classification,
            ageConfidence: ageResult.confidence,
            sourceImage: image
        )
    }
}`;

  const visionIntegrationCode = `import Vision
import HyperPersonalization

class VisionFaceDetector: PLFaceDetector {
    
    /// Detect faces using Apple Vision framework
    func detectFaces(in image: UIImage) async throws -> [PLFaceObservation] {
        guard let cgImage = image.cgImage else {
            throw PLError.invalidImage
        }
        
        return try await withCheckedThrowingContinuation { continuation in
            let request = VNDetectFaceRectanglesRequest { request, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }
                
                let observations = request.results as? [VNFaceObservation] ?? []
                let plObservations = observations.map { vnFace in
                    PLFaceObservation(
                        boundingBox: vnFace.boundingBox,
                        confidence: vnFace.confidence,
                        landmarks: self.extractLandmarks(from: vnFace)
                    )
                }
                
                continuation.resume(returning: plObservations)
            }
            
            request.revision = VNDetectFaceRectanglesRequestRevision3
            
            let handler = VNImageRequestHandler(
                cgImage: cgImage,
                orientation: image.cgImageOrientation,
                options: [:]
            )
            
            do {
                try handler.perform([request])
            } catch {
                continuation.resume(throwing: error)
            }
        }
    }
    
    /// Extract facial landmarks for enhanced cropping
    private func extractLandmarks(
        from observation: VNFaceObservation
    ) -> PLFaceLandmarks? {
        guard let landmarks = observation.landmarks else { return nil }
        
        return PLFaceLandmarks(
            leftEye: landmarks.leftEye?.normalizedPoints,
            rightEye: landmarks.rightEye?.normalizedPoints,
            nose: landmarks.nose?.normalizedPoints,
            mouth: landmarks.outerLips?.normalizedPoints,
            faceContour: landmarks.faceContour?.normalizedPoints
        )
    }
}`;

  const croppingStrategyCode = `extension FashionAnalyzer {
    
    /// Crop face region with intelligent padding
    func cropFaceRegion(
        from image: UIImage,
        face: PLFaceObservation,
        padding: CGFloat
    ) throws -> UIImage {
        guard let cgImage = image.cgImage else {
            throw PLError.invalidImage
        }
        
        let imageSize = CGSize(
            width: cgImage.width,
            height: cgImage.height
        )
        
        // Convert normalized coordinates to pixel coordinates
        let faceRect = VNImageRectForNormalizedRect(
            face.boundingBox,
            Int(imageSize.width),
            Int(imageSize.height)
        )
        
        // Calculate padded region
        let paddedRect = calculatePaddedRect(
            faceRect: faceRect,
            imageSize: imageSize,
            padding: padding
        )
        
        // Ensure square aspect ratio for model input
        let squareRect = makeSquare(rect: paddedRect, within: imageSize)
        
        // Perform the crop
        guard let croppedCGImage = cgImage.cropping(to: squareRect) else {
            throw PLError.croppingFailed
        }
        
        return UIImage(cgImage: croppedCGImage)
    }
    
    private func calculatePaddedRect(
        faceRect: CGRect,
        imageSize: CGSize,
        padding: CGFloat
    ) -> CGRect {
        let paddingX = faceRect.width * padding
        let paddingY = faceRect.height * padding
        
        return CGRect(
            x: max(0, faceRect.origin.x - paddingX),
            y: max(0, faceRect.origin.y - paddingY),
            width: min(imageSize.width - faceRect.origin.x + paddingX, 
                      faceRect.width + 2 * paddingX),
            height: min(imageSize.height - faceRect.origin.y + paddingY,
                       faceRect.height + 2 * paddingY)
        )
    }
    
    private func makeSquare(rect: CGRect, within bounds: CGSize) -> CGRect {
        let size = max(rect.width, rect.height)
        let centerX = rect.midX
        let centerY = rect.midY
        
        let x = max(0, min(bounds.width - size, centerX - size / 2))
        let y = max(0, min(bounds.height - size, centerY - size / 2))
        
        return CGRect(x: x, y: y, width: size, height: size)
    }
}`;

  const embeddingsApiCode = `import HyperPersonalization

/// Face embeddings and clustering API integration
class FaceClusteringService {
    private let apiClient: PLAPIClient
    private let embeddingExtractor: PLEmbeddingExtractor
    
    /// Extract embeddings and cluster faces
    func clusterFaces(
        from profiles: [FashionProfile]
    ) async throws -> ClusteringResult {
        // Extract embeddings locally
        var embeddings: [FaceEmbedding] = []
        
        for profile in profiles {
            let embedding = try await embeddingExtractor.extract(
                from: profile.sourceImage,
                faceRegion: profile.faceRegion
            )
            embeddings.append(FaceEmbedding(
                assetId: profile.assetId,
                vector: embedding,
                metadata: profile.metadata
            ))
        }
        
        // Send to clustering API
        let request = ClusteringRequest(
            embeddings: embeddings,
            algorithm: .dbscan,
            parameters: ClusteringParameters(
                minSamples: 3,
                epsilon: 0.5
            )
        )
        
        return try await apiClient.cluster(request)
    }
}

// MARK: - API Request/Response Models

struct ClusteringRequest: Codable {
    let embeddings: [FaceEmbedding]
    let algorithm: ClusteringAlgorithm
    let parameters: ClusteringParameters
}

struct FaceEmbedding: Codable {
    let assetId: String
    let vector: [Float]  // 512-dimensional embedding
    let metadata: EmbeddingMetadata
}

struct ClusteringResult: Codable {
    let clusters: [FaceCluster]
    let noise: [String]  // Asset IDs not assigned to any cluster
    let processingTime: TimeInterval
}

struct FaceCluster: Codable {
    let clusterId: String
    let memberCount: Int
    let members: [ClusterMember]
    let centroid: [Float]
}

struct ClusterMember: Codable {
    let assetId: String
    let distanceFromCentroid: Float
    let clarityScore: Float
}`;

  const bestFaceAlgorithmCode = `extension FaceClusteringService {
    
    /// Select the best face from clustered results
    func selectBestFaces(
        from result: ClusteringResult,
        profiles: [FashionProfile]
    ) -> BestFacesResult {
        var bestMale: SelectedFace?
        var bestFemale: SelectedFace?
        var bestKid: SelectedFace?
        
        // Group clusters by demographic
        let profileMap = Dictionary(
            uniqueKeysWithValues: profiles.map { ($0.assetId, $0) }
        )
        
        for cluster in result.clusters.sorted(by: { $0.memberCount > $1.memberCount }) {
            guard let representativeMember = selectBestMember(from: cluster) else {
                continue
            }
            
            guard let profile = profileMap[representativeMember.assetId] else {
                continue
            }
            
            let selectedFace = SelectedFace(
                assetId: representativeMember.assetId,
                profile: profile,
                clusterSize: cluster.memberCount,
                clarityScore: representativeMember.clarityScore
            )
            
            // Assign to appropriate demographic slot
            switch (profile.gender, profile.ageGroup) {
            case (.male, .adult) where bestMale == nil:
                bestMale = selectedFace
            case (.female, .adult) where bestFemale == nil:
                bestFemale = selectedFace
            case (_, .child) where bestKid == nil:
                bestKid = selectedFace
            default:
                break
            }
            
            // Early exit if all slots filled
            if bestMale != nil && bestFemale != nil && bestKid != nil {
                break
            }
        }
        
        return BestFacesResult(
            bestMale: bestMale,
            bestFemale: bestFemale,
            bestKid: bestKid
        )
    }
    
    /// Select best member from cluster based on clarity and centrality
    private func selectBestMember(from cluster: FaceCluster) -> ClusterMember? {
        return cluster.members
            .sorted { member1, member2 in
                // Weighted score: 70% clarity, 30% centrality
                let score1 = member1.clarityScore * 0.7 + 
                            (1 - member1.distanceFromCentroid) * 0.3
                let score2 = member2.clarityScore * 0.7 + 
                            (1 - member2.distanceFromCentroid) * 0.3
                return score1 > score2
            }
            .first
    }
}

// MARK: - Result Types

struct BestFacesResult {
    let bestMale: SelectedFace?
    let bestFemale: SelectedFace?
    let bestKid: SelectedFace?
    
    var allSelected: [SelectedFace] {
        [bestMale, bestFemale, bestKid].compactMap { $0 }
    }
}

struct SelectedFace {
    let assetId: String
    let profile: FashionProfile
    let clusterSize: Int
    let clarityScore: Float
}`;

  const errorHandlingCode = `extension FaceClusteringService {
    
    /// Cluster faces with comprehensive error handling
    func clusterFacesWithFallback(
        from profiles: [FashionProfile],
        timeout: TimeInterval = 30.0
    ) async -> Result<ClusteringResult, ClusteringError> {
        do {
            // Attempt primary clustering
            let result = try await withTimeout(timeout) {
                try await self.clusterFaces(from: profiles)
            }
            return .success(result)
            
        } catch let error as URLError where error.code == .timedOut {
            // Fallback to local clustering on timeout
            return await fallbackToLocalClustering(profiles: profiles)
            
        } catch let error as PLAPIError {
            switch error {
            case .rateLimited(let retryAfter):
                return .failure(.rateLimited(retryAfter: retryAfter))
            case .serverError(let code):
                return .failure(.serverError(code: code))
            case .invalidResponse:
                return await fallbackToLocalClustering(profiles: profiles)
            }
            
        } catch {
            return .failure(.unknown(error))
        }
    }
    
    /// Local fallback using simplified clustering
    private func fallbackToLocalClustering(
        profiles: [FashionProfile]
    ) async -> Result<ClusteringResult, ClusteringError> {
        // Use local k-means or simple grouping
        let localClusterer = PLLocalClusterer()
        
        do {
            let result = try await localClusterer.cluster(profiles)
            return .success(result)
        } catch {
            return .failure(.localClusteringFailed(error))
        }
    }
}

enum ClusteringError: Error {
    case rateLimited(retryAfter: TimeInterval)
    case serverError(code: Int)
    case localClusteringFailed(Error)
    case unknown(Error)
    
    var userMessage: String {
        switch self {
        case .rateLimited(let retryAfter):
            return "Too many requests. Please try again in \\(Int(retryAfter)) seconds."
        case .serverError:
            return "Server error. Using local analysis instead."
        case .localClusteringFailed:
            return "Unable to analyze faces. Please try with different photos."
        case .unknown:
            return "An unexpected error occurred."
        }
    }
}`;

  return (
    <DocSection id="human-analysis">
      <DocHeading level={1}>Phase 4: Human Analysis & Face Pipeline</DocHeading>
      <DocParagraph>
        The Human Analysis phase processes photos containing people through a sophisticated 
        pipeline: face detection, demographic classification, embedding extraction, and 
        intelligent clustering to identify the best representative images.
      </DocParagraph>

      <DocHeading level={2} id="fashion-analysis-flow">Fashion Analysis Flow</DocHeading>
      <DocParagraph>
        The fashion analysis pipeline processes images through multiple stages to extract 
        demographic information for personalization.
      </DocParagraph>
      
      <CodeBlock 
        code={fashionAnalysisCode} 
        filename="FashionAnalyzer.swift"
        language="swift"
      />

      <DocCallout type="info" title="Pipeline Order">
        The pipeline must execute in order: Face Detection → Cropping → Gender Classification → 
        Age Classification. Each stage depends on the output of the previous stage.
      </DocCallout>

      <DocHeading level={2} id="vision-integration">Step 1: How Images Are Passed to Face Detection (VNDetectFaceRectanglesRequest)</DocHeading>
      <DocParagraph>
        Before classifying gender/age, you first need to <strong>detect faces</strong> in the image. 
        HyperPersonalization uses Apple's Vision framework with <code>VNDetectFaceRectanglesRequest</code> to find faces.
      </DocParagraph>

      <CodeBlock 
        code={`import Vision
import UIKit

/// Step-by-step: How to detect faces in an image
class FaceDetector {
    
    /// Detect faces in an image using VNDetectFaceRectanglesRequest
    /// This is the FIRST step in the fashion analysis pipeline
    func detectFaces(in image: UIImage) async throws -> [FaceDetection] {
        
        // Step 1: Convert UIImage to CGImage (required by Vision framework)
        guard let cgImage = image.cgImage else {
            throw FaceDetectionError.invalidImage
        }
        
        // Step 2: Create a face detection request
        // VNDetectFaceRectanglesRequest is Apple's built-in face detector
        let faceRequest = VNDetectFaceRectanglesRequest { request, error in
            // This closure is called when detection is complete
            if let error = error {
                print("❌ Face detection error: \\(error)")
            }
        }
        
        // Step 3: Use the latest revision for best accuracy
        faceRequest.revision = VNDetectFaceRectanglesRequestRevision3
        
        // Step 4: Create a handler to process the image
        let handler = VNImageRequestHandler(
            cgImage: cgImage,
            orientation: image.imageOrientation,  // Important: preserve image orientation
            options: [:]
        )
        
        // Step 5: Run the face detection (this is async, so we use a continuation)
        return try await withCheckedThrowingContinuation { continuation in
            do {
                // Perform the detection
                try handler.perform([faceRequest])
                
                // Step 6: Get the results
                guard let observations = faceRequest.results as? [VNFaceObservation] else {
                    continuation.resume(throwing: FaceDetectionError.noFacesFound)
                    return
                }
                
                // Step 7: Convert Vision results to our custom format
                let faceDetections = observations.map { observation in
                    FaceDetection(
                        boundingBox: observation.boundingBox,  // Where the face is in the image
                        confidence: observation.confidence    // How sure we are it's a face
                    )
                }
                
                print("✅ Found \\(faceDetections.count) face(s) in image")
                continuation.resume(returning: faceDetections)
                
            } catch {
                continuation.resume(throwing: error)
            }
        }
    }
}

/// Result structure for face detection
struct FaceDetection {
    let boundingBox: CGRect  // Location of face in image (normalized 0.0-1.0)
    let confidence: Float     // Confidence that this is a face (0.0-1.0)
}

enum FaceDetectionError: Error {
    case invalidImage
    case noFacesFound
}

/// Example usage:
/// let image = UIImage(named: "photo.jpg")!
/// let faces = try await FaceDetector().detectFaces(in: image)
/// print("Found \\(faces.count) faces")`} 
        filename="VisionFaceDetector.swift"
        language="swift"
      />

      <DocCallout type="info" title="Understanding VNDetectFaceRectanglesRequest">
        <ul>
          <li><strong>VNDetectFaceRectanglesRequest:</strong> Apple's built-in face detector - finds where faces are in an image</li>
          <li><strong>boundingBox:</strong> A rectangle showing where the face is (coordinates are normalized 0.0-1.0)</li>
          <li><strong>confidence:</strong> How sure the detector is that it found a face (0.0-1.0)</li>
          <li><strong>Revision 3:</strong> The latest version with best accuracy</li>
        </ul>
      </DocCallout>

      <DocHeading level={2} id="cropping-strategy">Step 2: Image Cropping Strategy</DocHeading>
      <DocParagraph>
        After detecting a face, you need to <strong>crop the face region</strong> from the image. 
        This cropped face is then passed to the gender and age classification models.
      </DocParagraph>

      <CodeBlock 
        code={`import UIKit
import Vision

/// How to crop a face from an image for classification
class FaceCropper {
    
    /// Crop the face region from the original image
    /// Input: Full image + face detection result
    /// Output: Cropped face image (224×224 pixels for gender/age models)
    func cropFace(
        from image: UIImage,
        faceDetection: FaceDetection,
        padding: CGFloat = 0.3  // 30% padding around face
    ) throws -> UIImage {
        
        guard let cgImage = image.cgImage else {
            throw CroppingError.invalidImage
        }
        
        let imageSize = CGSize(width: cgImage.width, height: cgImage.height)
        
        // Step 1: Convert normalized bounding box (0.0-1.0) to pixel coordinates
        // Vision framework returns coordinates in normalized format (0.0 to 1.0)
        let faceRect = VNImageRectForNormalizedRect(
            faceDetection.boundingBox,
            Int(imageSize.width),
            Int(imageSize.height)
        )
        
        // Step 2: Add padding around the face (30% on each side)
        // This includes hair, ears, and neck - important for accurate classification
        let paddingX = faceRect.width * padding
        let paddingY = faceRect.height * padding
        
        let paddedRect = CGRect(
            x: max(0, faceRect.origin.x - paddingX),
            y: max(0, faceRect.origin.y - paddingY),
            width: min(imageSize.width - faceRect.origin.x + paddingX, 
                      faceRect.width + 2 * paddingX),
            height: min(imageSize.height - faceRect.origin.y + paddingY,
                       faceRect.height + 2 * paddingY)
        )
        
        // Step 3: Make it square (models need square images)
        let squareRect = makeSquare(rect: paddedRect, within: imageSize)
        
        // Step 4: Crop the image
        guard let croppedCGImage = cgImage.cropping(to: squareRect) else {
            throw CroppingError.croppingFailed
        }
        
        // Step 5: Resize to 224×224 (required by gender/age models)
        let resizedImage = resizeImage(
            UIImage(cgImage: croppedCGImage),
            to: CGSize(width: 224, height: 224)
        )
        
        return resizedImage
    }
    
    /// Make a rectangle square (models need square inputs)
    private func makeSquare(rect: CGRect, within bounds: CGSize) -> CGRect {
        let size = max(rect.width, rect.height)
        let centerX = rect.midX
        let centerY = rect.midY
        
        let x = max(0, min(bounds.width - size, centerX - size / 2))
        let y = max(0, min(bounds.height - size, centerY - size / 2))
        
        return CGRect(x: x, y: y, width: size, height: size)
    }
    
    /// Resize image to target size
    private func resizeImage(_ image: UIImage, to size: CGSize) -> UIImage {
        UIGraphicsBeginImageContextWithOptions(size, false, 1.0)
        defer { UIGraphicsEndImageContext() }
        
        image.draw(in: CGRect(origin: .zero, size: size))
        return UIGraphicsGetImageFromCurrentImageContext() ?? image
    }
}

enum CroppingError: Error {
    case invalidImage
    case croppingFailed
}

/// Example usage:
/// let croppedFace = try FaceCropper().cropFace(from: image, faceDetection: faces[0])
/// // Now croppedFace is 224×224 pixels, ready for gender/age classification`} 
        filename="FaceCropping.swift"
        language="swift"
      />

      <DocTable 
        headers={['Parameter', 'Value', 'Purpose']}
        rows={[
          ['Padding', '30%', 'Include hair, ears, and neck for context'],
          ['Aspect Ratio', '1:1 (Square)', 'Required by classification models'],
          ['Min Size', '224×224px', 'Minimum input resolution for models'],
          ['Max Size', '512×512px', 'Optimal resolution for accuracy/speed'],
        ]}
      />

      <DocHeading level={2} id="gender-age-classification">Step 3: How Images Are Passed to Gender and Age Classification Models</DocHeading>
      <DocParagraph>
        After cropping the face, you pass the cropped face image to <strong>both</strong> the gender classifier and age classifier models.
      </DocParagraph>

      <CodeBlock 
        code={`import CoreML
import Vision

/// Complete flow: Pass cropped face to gender and age models
class GenderAgeClassifier {
    private let genderModel: VNCoreMLModel
    private let ageModel: VNCoreMLModel
    
    init() throws {
        // Load models (as shown in ModelArchitectureSection)
        self.genderModel = try ModelLoader().loadGenderModel()
        self.ageModel = try ModelLoader().loadAgeModel()
    }
    
    /// Step 1: Classify gender from cropped face image
    /// Input: Cropped face image (224×224 pixels)
    /// Output: Gender (male/female) + confidence
    func classifyGender(croppedFace: UIImage) async throws -> GenderResult {
        guard let cgImage = croppedFace.cgImage else {
            throw ClassificationError.invalidImage
        }
        
        // Create Vision request
        let request = VNCoreMLRequest(model: genderModel)
        request.imageCropAndScaleOption = .centerCrop
        
        // Run the model
        let handler = VNImageRequestHandler(cgImage: cgImage)
        try handler.perform([request])
        
        // Get results
        guard let observations = request.results as? [VNClassificationObservation],
              let topResult = observations.first else {
            throw ClassificationError.noResults
        }
        
        return GenderResult(
            label: topResult.identifier,      // "male" or "female"
            confidence: topResult.confidence   // 0.0 to 1.0
        )
    }
    
    /// Step 2: Classify age from the SAME cropped face image
    /// Input: Same cropped face image (224×224 pixels)
    /// Output: Age range (child/teen/adult/senior) + confidence
    func classifyAge(croppedFace: UIImage) async throws -> AgeResult {
        guard let cgImage = croppedFace.cgImage else {
            throw ClassificationError.invalidImage
        }
        
        // Create Vision request for age model
        let request = VNCoreMLRequest(model: ageModel)
        request.imageCropAndScaleOption = .centerCrop
        
        // Run the model
        let handler = VNImageRequestHandler(cgImage: cgImage)
        try handler.perform([request])
        
        // Get results
        guard let observations = request.results as? [VNClassificationObservation],
              let topResult = observations.first else {
            throw ClassificationError.noResults
        }
        
        return AgeResult(
            ageRange: topResult.identifier,    // "child", "teen", "adult", or "senior"
            confidence: topResult.confidence   // 0.0 to 1.0
        )
    }
    
    /// Complete flow: Detect face, crop, then classify gender and age
    func processImage(_ image: UIImage) async throws -> FashionProfile {
        // Step 1: Detect faces
        let faces = try await FaceDetector().detectFaces(in: image)
        guard let firstFace = faces.first else {
            throw ClassificationError.noFacesFound
        }
        
        // Step 2: Crop the face
        let croppedFace = try FaceCropper().cropFace(from: image, faceDetection: firstFace)
        
        // Step 3: Classify gender (pass cropped face to gender model)
        let genderResult = try await classifyGender(croppedFace: croppedFace)
        
        // Step 4: Classify age (pass SAME cropped face to age model)
        let ageResult = try await classifyAge(croppedFace: croppedFace)
        
        // Step 5: Check confidence scores
        guard genderResult.confidence >= 0.75 else {
            throw ClassificationError.lowConfidence("Gender confidence too low")
        }
        
        guard ageResult.confidence >= 0.70 else {
            throw ClassificationError.lowConfidence("Age confidence too low")
        }
        
        // Step 6: Return complete profile
        return FashionProfile(
            image: image,
            gender: genderResult.label,
            genderConfidence: genderResult.confidence,
            ageRange: ageResult.ageRange,
            ageConfidence: ageResult.confidence
        )
    }
}

struct FashionProfile {
    let image: UIImage
    let gender: String      // "male" or "female"
    let genderConfidence: Float
    let ageRange: String    // "child", "teen", "adult", or "senior"
    let ageConfidence: Float
}

enum ClassificationError: Error {
    case invalidImage
    case noResults
    case noFacesFound
    case lowConfidence(String)
}

/// Example usage:
/// let classifier = try GenderAgeClassifier()
/// let profile = try await classifier.processImage(image)
/// print("Gender: \\(profile.gender) (\\(profile.genderConfidence))")
/// print("Age: \\(profile.ageRange) (\\(profile.ageConfidence))")`} 
        filename="GenderAgeClassification.swift"
        language="swift"
      />

      <DocCallout type="info" title="Important Notes">
        <ul>
          <li><strong>Same cropped face:</strong> You use the SAME cropped face image for both gender and age classification</li>
          <li><strong>Image size:</strong> Both models need 224×224 pixel images</li>
          <li><strong>Order matters:</strong> First detect face → then crop → then classify gender and age</li>
          <li><strong>Check confidence:</strong> Always check confidence scores before using results</li>
        </ul>
      </DocCallout>

      <DocHeading level={2} id="embeddings-api">Step 4: Face Embeddings and Clustering API</DocHeading>
      <DocParagraph>
        After classifying images as male, female, or kids, you need to <strong>group similar faces together</strong> 
        (clustering). This helps identify which person appears most often (likely the primary user).
      </DocParagraph>

      <DocParagraph>
        <strong>How it works:</strong>
      </DocParagraph>
      <DocList items={[
        '1. Extract face embeddings (512 numbers representing the face) from each classified image',
        '2. Send all embeddings to the clustering API',
        '3. API groups similar faces into clusters',
        '4. Find the cluster with most faces (primary user)',
        '5. Select the best face from that cluster (highest confidence)',
      ]} />

      <DocHeading level={3}>Input Format to Clustering API</DocHeading>
      <DocParagraph>
        The clustering API expects a JSON request with face embeddings:
      </DocParagraph>

      <CodeBlock 
        code={`import Foundation

/// Input format for clustering API
struct ClusteringAPIRequest: Codable {
    let embeddings: [FaceEmbeddingData]
    let algorithm: String  // "dbscan" (default clustering algorithm)
    let parameters: ClusteringParameters
}

struct FaceEmbeddingData: Codable {
    let assetId: String        // Unique ID for this image
    let embedding: [Float]    // 512 numbers representing the face
    let gender: String         // "male", "female", or "kids"
    let ageRange: String       // "child", "teen", "adult", "senior"
    let confidence: Float      // Confidence score from classification
}

struct ClusteringParameters: Codable {
    let minSamples: Int       // Minimum 3 faces to form a cluster
    let epsilon: Double        // Distance threshold (0.5)
}

/// Example: How to prepare data for clustering API
class ClusteringAPIPreparer {
    
    /// Convert classified images to API request format
    func prepareRequest(from profiles: [FashionProfile]) throws -> ClusteringAPIRequest {
        var embeddings: [FaceEmbeddingData] = []
        
        for profile in profiles {
            // Step 1: Extract face embedding (512 numbers) from the face
            let embedding = try extractFaceEmbedding(from: profile.image)
            
            // Step 2: Create embedding data
            let embeddingData = FaceEmbeddingData(
                assetId: profile.assetId,
                embedding: embedding,           // 512 numbers
                gender: profile.gender,
                ageRange: profile.ageRange,
                confidence: profile.genderConfidence
            )
            
            embeddings.append(embeddingData)
        }
        
        // Step 3: Create API request
        return ClusteringAPIRequest(
            embeddings: embeddings,
            algorithm: "dbscan",
            parameters: ClusteringParameters(
                minSamples: 3,
                epsilon: 0.5
            )
        )
    }
    
    /// Extract 512-dimensional embedding from face image
    private func extractFaceEmbedding(from image: UIImage) throws -> [Float] {
        // Use FaceEmbedding.mlmodel to extract embedding
        // This returns 512 numbers representing the face
        // (Implementation details in FaceEmbedding model section)
        return [] // Placeholder - actual implementation uses CoreML model
    }
}

/// Example JSON that gets sent to API:
/// {
///   "embeddings": [
///     {
///       "assetId": "photo123",
///       "embedding": [0.1, 0.2, 0.3, ...],  // 512 numbers
///       "gender": "male",
///       "ageRange": "adult",
///       "confidence": 0.95
///     },
///     ...
///   ],
///   "algorithm": "dbscan",
///   "parameters": {
///     "minSamples": 3,
///     "epsilon": 0.5
///   }
/// }`} 
        filename="ClusteringAPIInput.swift"
        language="swift"
      />

      <DocHeading level={3}>Output Format from Clustering API</DocHeading>
      <DocParagraph>
        The clustering API returns grouped faces in clusters:
      </DocParagraph>

      <CodeBlock 
        code={`/// Output format from clustering API
struct ClusteringAPIResponse: Codable {
    let clusters: [FaceCluster]
    let noise: [String]           // Asset IDs not in any cluster
    let processingTime: TimeInterval
}

struct FaceCluster: Codable {
    let clusterId: String           // Unique cluster ID
    let memberCount: Int           // How many faces in this cluster
    let members: [ClusterMember]   // List of faces in cluster
    let centroid: [Float]          // Center point of cluster (512 numbers)
}

struct ClusterMember: Codable {
    let assetId: String             // Image ID
    let distanceFromCentroid: Float // How "typical" this face is (lower = more typical)
    let clarityScore: Float         // Image quality score (0.0-1.0)
}

/// Example JSON response from API:
/// {
///   "clusters": [
///     {
///       "clusterId": "cluster_1",
///       "memberCount": 15,        // This person appears 15 times!
///       "members": [
///         {
///           "assetId": "photo123",
///           "distanceFromCentroid": 0.2,
///           "clarityScore": 0.95
///         },
///         ...
///       ],
///       "centroid": [0.1, 0.2, ...]  // 512 numbers
///     },
///     {
///       "clusterId": "cluster_2",
///       "memberCount": 3,         // This person appears only 3 times
///       ...
///     }
///   ],
///   "noise": ["photo999"],         // Photos that don't match any cluster
///   "processingTime": 1.2
/// }`} 
        filename="ClusteringAPIOutput.swift"
        language="swift"
      />

      <DocHeading level={3}>What If Clustering API Doesn't Respond?</DocHeading>
      <DocParagraph>
        You need to handle errors when the API fails. Here's what to do:
      </DocParagraph>

      <CodeBlock 
        code={`import Foundation

/// Error handling for clustering API
class ClusteringAPIErrorHandler {
    
    /// Call clustering API with error handling
    func callClusteringAPI(request: ClusteringAPIRequest) async throws -> ClusteringAPIResponse {
        do {
            // Try to call the API
            let response = try await sendAPIRequest(request)
            return response
            
        } catch let error as URLError {
            // Network error (no internet, timeout, etc.)
            if error.code == .timedOut {
                throw ClusteringError.timeout("API request timed out after 30 seconds")
            } else if error.code == .notConnectedToInternet {
                throw ClusteringError.noInternet("No internet connection")
            } else {
                throw ClusteringError.networkError(error)
            }
            
        } catch let error as DecodingError {
            // API returned invalid JSON
            throw ClusteringError.invalidResponse("API returned invalid data: \\(error)")
            
        } catch let httpError as HTTPError {
            // HTTP error (404, 500, etc.)
            switch httpError.statusCode {
            case 400:
                throw ClusteringError.badRequest("Invalid request data")
            case 401:
                throw ClusteringError.unauthorized("API key invalid")
            case 429:
                throw ClusteringError.rateLimited("Too many requests - wait and retry")
            case 500...599:
                throw ClusteringError.serverError("Server error - try again later")
            default:
                throw ClusteringError.httpError(httpError.statusCode)
            }
            
        } catch {
            // Unknown error
            throw ClusteringError.unknown(error)
        }
    }
    
    /// What the DEVELOPER sees in console/logs
    func logError(_ error: ClusteringError) {
        switch error {
        case .timeout(let message):
            print("❌ DEVELOPER ERROR: Clustering API timeout - \\(message)")
        case .noInternet(let message):
            print("❌ DEVELOPER ERROR: No internet - \\(message)")
        case .rateLimited(let message):
            print("⚠️ DEVELOPER WARNING: Rate limited - \\(message)")
        case .serverError(let message):
            print("❌ DEVELOPER ERROR: Server error - \\(message)")
        default:
            print("❌ DEVELOPER ERROR: Unknown clustering error - \\(error)")
        }
    }
    
    /// What the USER sees in UI
    func getUserMessage(for error: ClusteringError) -> String {
        switch error {
        case .timeout:
            return "Face analysis is taking longer than expected. Please try again."
        case .noInternet:
            return "No internet connection. Please check your connection and try again."
        case .rateLimited:
            return "Too many requests. Please wait a moment and try again."
        case .serverError:
            return "Server error. Please try again in a few moments."
        default:
            return "Unable to analyze faces. Please try again or upload different photos."
        }
    }
}

enum ClusteringError: Error {
    case timeout(String)
    case noInternet(String)
    case networkError(Error)
    case invalidResponse(String)
    case badRequest(String)
    case unauthorized(String)
    case rateLimited(String)
    case serverError(String)
    case httpError(Int)
    case unknown(Error)
}

/// Example usage with error handling:
/// do {
///     let response = try await errorHandler.callClusteringAPI(request: request)
///     // Success - process clusters
/// } catch let error as ClusteringError {
///     // Log for developer
///     errorHandler.logError(error)
///     
///     // Show to user
///     let userMessage = errorHandler.getUserMessage(for: error)
///     showErrorToUser(userMessage)
/// }`} 
        filename="ClusteringAPIErrorHandling.swift"
        language="swift"
      />

      <DocCallout type="warning" title="Important">
        <strong>Always handle API errors gracefully.</strong> If the clustering API fails, you should:
        <ul>
          <li>Log detailed error for developers (in console/debugging)</li>
          <li>Show friendly message to users (in UI)</li>
          <li>Provide fallback option (e.g., use local clustering or ask user to retry)</li>
        </ul>
      </DocCallout>

      <DocHeading level={2} id="best-face-algorithm">Step 5: Strategy to Get Best Face Image</DocHeading>
      <DocParagraph>
        After clustering, you need to select the <strong>best face image</strong> for each category (male, female, kids). 
        The strategy is:
      </DocParagraph>
      <DocList items={[
        '1. Find the cluster with the <strong>highest number of faces</strong> (this is likely the primary user)',
        '2. Inside that cluster, find the face with the <strong>highest confidence score</strong>',
        '3. That face becomes the "best face" for that category',
      ]} />

      <CodeBlock 
        code={`import Foundation

/// Strategy to select best face from clusters
class BestFaceSelector {
    
    /// Select best faces for male, female, and kids categories
    /// Input: Clustering API response
    /// Output: Best face for each category
    func selectBestFaces(from response: ClusteringAPIResponse, profiles: [FashionProfile]) -> BestFacesResult {
        var bestMale: SelectedFace?
        var bestFemale: SelectedFace?
        var bestKid: SelectedFace?
        
        // Create a map for quick lookup
        let profileMap = Dictionary(
            uniqueKeysWithValues: profiles.map { ($0.assetId, $0) }
        )
        
        // Step 1: Sort clusters by member count (largest first)
        // The cluster with most faces = primary user
        let sortedClusters = response.clusters.sorted { $0.memberCount > $1.memberCount }
        
        // Step 2: For each cluster (starting with largest)
        for cluster in sortedClusters {
            // Step 3: Find best member in this cluster (highest confidence)
            guard let bestMember = selectBestMember(from: cluster) else {
                continue
            }
            
            // Step 4: Get the profile for this member
            guard let profile = profileMap[bestMember.assetId] else {
                continue
            }
            
            // Step 5: Assign to appropriate category
            let selectedFace = SelectedFace(
                assetId: bestMember.assetId,
                profile: profile,
                clusterSize: cluster.memberCount,      // How many times this person appears
                confidence: bestMember.clarityScore    // Quality of this face image
            )
            
            // Assign to male, female, or kids based on classification
            switch (profile.gender, profile.ageRange) {
            case ("male", "adult") where bestMale == nil:
                bestMale = selectedFace
                
            case ("female", "adult") where bestFemale == nil:
                bestFemale = selectedFace
                
            case (_, "child") where bestKid == nil:
                bestKid = selectedFace
                
            default:
                break
            }
            
            // Stop if we found all three
            if bestMale != nil && bestFemale != nil && bestKid != nil {
                break
            }
        }
        
        return BestFacesResult(
            bestMale: bestMale,
            bestFemale: bestFemale,
            bestKid: bestKid
        )
    }
    
    /// Select the best member from a cluster
    /// Strategy: Highest confidence score (clarity score)
    private func selectBestMember(from cluster: FaceCluster) -> ClusterMember? {
        // Sort by clarity score (highest first)
        // Clarity score = image quality (sharpness, lighting, etc.)
        return cluster.members
            .sorted { $0.clarityScore > $1.clarityScore }
            .first  // Return the one with highest clarity
    }
}

/// Result structure
struct BestFacesResult {
    let bestMale: SelectedFace?
    let bestFemale: SelectedFace?
    let bestKid: SelectedFace?
}

struct SelectedFace {
    let assetId: String           // Image ID
    let profile: FashionProfile   // Full profile (gender, age, etc.)
    let clusterSize: Int          // How many times this person appears
    let confidence: Float         // Image quality score
}

/// Example usage:
/// let selector = BestFaceSelector()
/// let result = selector.selectBestFaces(from: apiResponse, profiles: allProfiles)
/// 
/// if let bestMale = result.bestMale {
///     print("Best male face: \\(bestMale.assetId)")
///     print("Appears \\(bestMale.clusterSize) times in photos")
///     print("Image quality: \\(bestMale.confidence)")
/// }`} 
        filename="BestFaceSelection.swift"
        language="swift"
      />

      <DocCallout type="info" title="Why This Strategy Works">
        <ul>
          <li><strong>Largest cluster = primary user:</strong> If someone appears 15 times vs 3 times, they're likely the main user</li>
          <li><strong>Highest confidence = best quality:</strong> Among all faces of the same person, pick the clearest one</li>
          <li><strong>Result:</strong> You get the best quality photo of the person who appears most often</li>
        </ul>
      </DocCallout>

      <DocHeading level={2} id="clustering-error-handling">Error Handling & Fallbacks</DocHeading>
      <DocParagraph>
        Robust error handling ensures the pipeline degrades gracefully when the clustering 
        API is unavailable.
      </DocParagraph>

      <CodeBlock 
        code={errorHandlingCode} 
        filename="FaceClusteringService+ErrorHandling.swift"
        language="swift"
      />
    </DocSection>
  );
};
