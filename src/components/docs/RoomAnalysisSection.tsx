import { CodeBlock } from '@/components/ui/CodeBlock';
import { DocSection, DocHeading, DocParagraph, DocCallout, DocList, DocTable } from './DocSection';

export function RoomAnalysisSection() {
  return (
    <>
      <DocSection id="room-classification">
        <span className="phase-badge mb-4">Phase 3</span>
        <DocHeading level={1}>Room Classification Logic</DocHeading>
        
        <DocParagraph>
          The room classification pipeline iterates through photos to identify and label 
          room types with high confidence. This enables personalized furniture recommendations 
          and room visualization features.
        </DocParagraph>

        <DocHeading level={2}>Classification Pipeline</DocHeading>

        <CodeBlock
          language="swift"
          filename="RoomClassificationPipeline.swift"
          code={`import Photos
import CoreML

class RoomClassificationPipeline {
    
    private let modelManager: ModelManager
    private let imagePipeline: ImagePipeline
    private let thresholds = ConfidenceThresholds.room
    
    /// Process all photos and extract room classifications
    func classifyRooms(
        assets: [PHAsset],
        progressHandler: @escaping (Float) -> Void
    ) async throws -> [ClassifiedRoom] {
        
        var classifiedRooms: [ClassifiedRoom] = []
        let totalAssets = Float(assets.count)
        
        for (index, asset) in assets.enumerated() {
            // Update progress
            progressHandler(Float(index) / totalAssets)
            
            // Skip non-photo assets
            guard asset.mediaType == .image else { continue }
            
            // Skip screenshots (rarely useful for room detection)
            if isScreenshot(asset) { continue }
            
            do {
                // Classify the room
                let result = try await classifyRoom(asset: asset)
                
                // Only keep results above acceptance threshold
                guard result.confidence >= thresholds.acceptanceThreshold else {
                    continue
                }
                
                // Reject outdoor scenes and unclear rooms
                guard result.roomType != .outdoor,
                      result.roomType != .other else {
                    continue
                }
                
                classifiedRooms.append(ClassifiedRoom(
                    asset: asset,
                    roomType: result.roomType,
                    confidence: result.confidence,
                    attributes: result.sceneAttributes
                ))
                
            } catch {
                // Log but continue processing
                Logger.warning("Failed to classify room: \\(error)")
            }
        }
        
        progressHandler(1.0)
        return classifiedRooms
    }
    
    private func classifyRoom(asset: PHAsset) async throws -> RoomClassificationResult {
        // Prepare image for model
        let pixelBuffer = try await imagePipeline.prepareInput(
            asset: asset,
            targetSize: CGSize(width: 299, height: 299),
            colorSpace: CGColorSpaceCreateDeviceRGB()
        )
        
        // Run inference
        return try await modelManager.classifyRoom(pixelBuffer: pixelBuffer)
    }
    
    private func isScreenshot(_ asset: PHAsset) -> Bool {
        // Check aspect ratio (screenshots are typically exact screen dimensions)
        let ratio = Float(asset.pixelWidth) / Float(asset.pixelHeight)
        let screenRatio: Float = 9.0 / 19.5  // iPhone aspect ratio
        
        return abs(ratio - screenRatio) < 0.01
    }
}

struct ClassifiedRoom {
    let asset: PHAsset
    let roomType: RoomClassificationResult.RoomType
    let confidence: Float
    let attributes: RoomClassificationResult.SceneAttributes
    
    var localIdentifier: String {
        return asset.localIdentifier
    }
}`}
        />

        <DocHeading level={2}>Room Type Labels</DocHeading>

        <DocTable
          headers={['Label', 'Description', 'Typical Confidence']}
          rows={[
            ['living_room', 'Main living space with sofas, TV areas', '0.82 - 0.95'],
            ['bedroom', 'Sleeping areas with beds, nightstands', '0.85 - 0.96'],
            ['kitchen', 'Cooking areas with appliances, counters', '0.80 - 0.94'],
            ['bathroom', 'Bath/shower areas, vanities', '0.83 - 0.95'],
            ['dining_room', 'Eating areas with tables, chairs', '0.75 - 0.90'],
            ['office', 'Work spaces with desks, computers', '0.78 - 0.92'],
            ['outdoor', 'Patios, gardens, balconies (excluded)', '0.85 - 0.97'],
          ]}
        />
      </DocSection>

      <DocSection id="asset-storage">
        <DocHeading level={1}>Asset Storage & UI Presentation</DocHeading>
        
        <DocParagraph>
          The SDK maintains a local index of classified room images, enabling quick 
          retrieval for "Your Rooms" UI carousels and furniture visualization features.
        </DocParagraph>

        <DocHeading level={2}>Local Room Index</DocHeading>

        <CodeBlock
          language="swift"
          filename="RoomAssetStore.swift"
          code={`import Foundation
import Photos

actor RoomAssetStore {
    
    private var roomIndex: [RoomType: [RoomAsset]] = [:]
    private let storage = UserDefaults.standard
    private let indexKey = "com.hyperpersonalization.roomIndex"
    
    /// Store classified room for quick retrieval
    func store(_ room: ClassifiedRoom) {
        let asset = RoomAsset(
            localIdentifier: room.localIdentifier,
            confidence: room.confidence,
            attributes: room.attributes,
            classifiedAt: Date()
        )
        
        var rooms = roomIndex[room.roomType] ?? []
        rooms.append(asset)
        
        // Keep sorted by confidence (best first)
        rooms.sort { $0.confidence > $1.confidence }
        
        // Limit storage per room type
        roomIndex[room.roomType] = Array(rooms.prefix(20))
        
        persistIndex()
    }
    
    /// Retrieve best rooms for a specific type
    func getBestRooms(
        type: RoomType,
        limit: Int = 5
    ) -> [RoomAsset] {
        return Array((roomIndex[type] ?? []).prefix(limit))
    }
    
    /// Retrieve all classified rooms grouped by type
    func getAllRooms() -> [RoomType: [RoomAsset]] {
        return roomIndex
    }
    
    /// Fetch PHAsset from local identifier
    func fetchAsset(localIdentifier: String) -> PHAsset? {
        let result = PHAsset.fetchAssets(
            withLocalIdentifiers: [localIdentifier],
            options: nil
        )
        return result.firstObject
    }
    
    private func persistIndex() {
        if let data = try? JSONEncoder().encode(roomIndex) {
            storage.set(data, forKey: indexKey)
        }
    }
    
    func loadFromDisk() {
        guard let data = storage.data(forKey: indexKey),
              let index = try? JSONDecoder().decode(
                [RoomType: [RoomAsset]].self,
                from: data
              ) else { return }
        
        roomIndex = index
    }
}

struct RoomAsset: Codable {
    let localIdentifier: String
    let confidence: Float
    let attributes: RoomClassificationResult.SceneAttributes
    let classifiedAt: Date
}`}
        />

        <DocHeading level={2}>UI Carousel Component</DocHeading>

        <CodeBlock
          language="swift"
          filename="RoomCarouselView.swift"
          code={`import SwiftUI
import Photos

struct RoomCarouselView: View {
    let roomType: RoomType
    @State private var rooms: [RoomAsset] = []
    @State private var images: [String: UIImage] = [:]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                Text(roomType.displayName)
                    .font(.headline)
                
                Spacer()
                
                Text("\\(rooms.count) rooms")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal)
            
            // Carousel
            ScrollView(.horizontal, showsIndicators: false) {
                LazyHStack(spacing: 12) {
                    ForEach(rooms, id: \\.localIdentifier) { room in
                        RoomCard(
                            room: room,
                            image: images[room.localIdentifier]
                        )
                        .onAppear {
                            loadImage(for: room)
                        }
                    }
                }
                .padding(.horizontal)
            }
        }
        .task {
            await loadRooms()
        }
    }
    
    private func loadRooms() async {
        let store = await HyperPersonalizationSDK.shared.roomStore
        rooms = await store.getBestRooms(type: roomType, limit: 10)
    }
    
    private func loadImage(for room: RoomAsset) {
        guard images[room.localIdentifier] == nil else { return }
        
        Task {
            if let asset = await HyperPersonalizationSDK.shared.roomStore
                .fetchAsset(localIdentifier: room.localIdentifier) {
                
                let image = await loadThumbnail(asset: asset)
                images[room.localIdentifier] = image
            }
        }
    }
}

struct RoomCard: View {
    let room: RoomAsset
    let image: UIImage?
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Image
            if let image = image {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(16/9, contentMode: .fill)
                    .frame(width: 200, height: 112)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            } else {
                Rectangle()
                    .fill(.quaternary)
                    .frame(width: 200, height: 112)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            
            // Confidence badge
            HStack {
                Text("\\(Int(room.confidence * 100))% match")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                
                Spacer()
                
                Image(systemName: "sparkles")
                    .font(.caption2)
                    .foregroundStyle(.tint)
            }
        }
        .frame(width: 200)
    }
}`}
        />
      </DocSection>

      <DocSection id="low-confidence">
        <DocHeading level={1}>Low Confidence Handling</DocHeading>
        
        <DocParagraph>
          Not all photos are suitable for room personalization. The SDK automatically 
          filters out low-quality images based on multiple criteria.
        </DocParagraph>

        <DocHeading level={2}>Rejection Criteria</DocHeading>

        <DocList items={[
          <><strong>Low Confidence Score</strong> — Below 0.60 for room classification</>,
          <><strong>Blurry Images</strong> — Detected via Laplacian variance analysis</>,
          <><strong>Dark/Overexposed</strong> — Brightness outside 0.15-0.90 range</>,
          <><strong>Heavily Cluttered</strong> — Clutter score above 0.85</>,
          <><strong>Outdoor Scenes</strong> — Classified as outdoor/garden</>,
          <><strong>Cropped/Partial</strong> — Insufficient room context visible</>,
        ]} />

        <CodeBlock
          language="swift"
          filename="RoomQualityFilter.swift"
          code={`import CoreImage

class RoomQualityFilter {
    
    struct QualityThresholds {
        static let minConfidence: Float = 0.60
        static let minBrightness: Float = 0.15
        static let maxBrightness: Float = 0.90
        static let maxClutter: Float = 0.85
        static let minSharpness: Float = 100.0  // Laplacian variance
    }
    
    /// Evaluate if a room image meets quality standards
    func evaluateQuality(
        result: RoomClassificationResult,
        image: CGImage
    ) -> RoomQualityResult {
        
        var issues: [QualityIssue] = []
        
        // Check confidence
        if result.confidence < QualityThresholds.minConfidence {
            issues.append(.lowConfidence(result.confidence))
        }
        
        // Check brightness
        let brightness = result.sceneAttributes.brightness
        if brightness < QualityThresholds.minBrightness {
            issues.append(.tooDark(brightness))
        } else if brightness > QualityThresholds.maxBrightness {
            issues.append(.tooLight(brightness))
        }
        
        // Check clutter
        if result.sceneAttributes.clutterLevel > QualityThresholds.maxClutter {
            issues.append(.tooCluttered(result.sceneAttributes.clutterLevel))
        }
        
        // Check sharpness (blur detection)
        let sharpness = calculateSharpness(image)
        if sharpness < QualityThresholds.minSharpness {
            issues.append(.blurry(sharpness))
        }
        
        // Check room type
        if result.roomType == .outdoor || result.roomType == .other {
            issues.append(.invalidRoomType(result.roomType))
        }
        
        return RoomQualityResult(
            isAcceptable: issues.isEmpty,
            issues: issues,
            overallScore: calculateOverallScore(result, sharpness: sharpness)
        )
    }
    
    /// Calculate image sharpness using Laplacian variance
    private func calculateSharpness(_ image: CGImage) -> Float {
        let ciImage = CIImage(cgImage: image)
        
        // Apply Laplacian filter
        let filter = CIFilter(name: "CIConvolution3X3")!
        filter.setValue(ciImage, forKey: kCIInputImageKey)
        filter.setValue(CIVector(values: [0, 1, 0, 1, -4, 1, 0, 1, 0], count: 9),
                       forKey: "inputWeights")
        
        guard let output = filter.outputImage else { return 0 }
        
        // Calculate variance
        let extent = output.extent
        var bitmap = [Float](repeating: 0, count: 4)
        
        let context = CIContext()
        context.render(output, 
                      toBitmap: &bitmap,
                      rowBytes: 16,
                      bounds: CGRect(x: 0, y: 0, width: 1, height: 1),
                      format: .RGBAf,
                      colorSpace: nil)
        
        return bitmap[0]  // Simplified - real implementation calculates full variance
    }
}

struct RoomQualityResult {
    let isAcceptable: Bool
    let issues: [QualityIssue]
    let overallScore: Float
}

enum QualityIssue {
    case lowConfidence(Float)
    case tooDark(Float)
    case tooLight(Float)
    case tooCluttered(Float)
    case blurry(Float)
    case invalidRoomType(RoomClassificationResult.RoomType)
}`}
        />

        <DocCallout type="info" title="Automatic Retry">
          When a high-confidence room is detected but the image quality is poor, 
          the SDK will automatically search for alternative photos of the same room 
          taken at different times.
        </DocCallout>
      </DocSection>
    </>
  );
}
