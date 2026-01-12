import { CodeBlock } from '@/components/ui/CodeBlock';
import { DocSection, DocHeading, DocParagraph, DocList, DocCallout, DocTable } from './DocSection';

export const HumanAnalysisSection = () => {
  const fashionAnalysisCode = `import PersonaLens

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
import PersonaLens

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

  const embeddingsApiCode = `import PersonaLens

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

      <DocHeading level={2} id="vision-integration">Vision Framework Integration</DocHeading>
      <DocParagraph>
        PersonaLens wraps Apple's Vision framework for initial face detection, providing 
        enhanced accuracy through VNDetectFaceRectanglesRequest revision 3.
      </DocParagraph>

      <CodeBlock 
        code={visionIntegrationCode} 
        filename="VisionFaceDetector.swift"
        language="swift"
      />

      <DocHeading level={2} id="cropping-strategy">Image Cropping Strategy</DocHeading>
      <DocParagraph>
        Proper face cropping is critical for accurate classification. The SDK applies 
        intelligent padding and ensures square aspect ratios for model compatibility.
      </DocParagraph>

      <CodeBlock 
        code={croppingStrategyCode} 
        filename="FashionAnalyzer+Cropping.swift"
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

      <DocHeading level={2} id="embeddings-api">Embeddings & Clustering API</DocHeading>
      <DocParagraph>
        Face embeddings are 512-dimensional vectors representing facial features. These 
        are sent to the cloud clustering API for grouping similar faces.
      </DocParagraph>

      <CodeBlock 
        code={embeddingsApiCode} 
        filename="FaceClusteringService.swift"
        language="swift"
      />

      <DocCallout type="warning" title="API Requirements">
        The clustering API requires network connectivity. Implement proper offline handling 
        as shown in the error handling section below.
      </DocCallout>

      <DocHeading level={2} id="best-face-algorithm">"Best Face" Selection Algorithm</DocHeading>
      <DocParagraph>
        The algorithm selects the best representative face for each demographic category 
        based on cluster size and image clarity.
      </DocParagraph>

      <CodeBlock 
        code={bestFaceAlgorithmCode} 
        filename="FaceClusteringService+Selection.swift"
        language="swift"
      />

      <DocList items={[
        'Cluster size indicates how frequently a person appears (higher = primary user)',
        'Clarity score combines sharpness, lighting, and face visibility metrics',
        'Centroid distance measures how "typical" the face is within its cluster',
        'Weighted scoring: 70% clarity, 30% centrality for optimal selection',
      ]} />

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
