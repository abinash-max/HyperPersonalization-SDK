import { CodeBlock } from '@/components/ui/CodeBlock';
import { DocSection, DocHeading, DocParagraph, DocCallout, DocList, DocTable } from './DocSection';

export function RoomAnalysisSection() {
  return (
    <>
      <DocSection id="room-classification">
        <DocHeading level={1}>Room Classification Logic</DocHeading>
        
        <DocParagraph>
          The room classification pipeline iterates through photos to identify and label 
          room types with high confidence. This enables personalized furniture recommendations 
          and room visualization features.
        </DocParagraph>

        <DocHeading level={2}>Classification Pipeline</DocHeading>

        <DocParagraph>
          Here's what the code below does, step by step:
        </DocParagraph>
        <DocList items={[
          '1. Process all photos: Loop through all photo assets from the gallery',
          '2. Update progress: Call progress handler to show user how many photos have been processed',
          '3. Skip non-images: Only process assets with mediaType == .image',
          '4. Skip screenshots: Detect and skip screenshots (they\'re rarely useful for room detection)',
          '5. Classify each room: Pass each photo to the room classifier model',
          '6. Check confidence: Only keep results above acceptance threshold (0.60)',
          '7. Reject outdoor/other: Skip photos classified as outdoor or "other" room types',
          '8. Store results: Save classified rooms with their type, confidence, and attributes',
        ]} />

        <DocHeading level={3}>Part 1: Main Classification Loop</DocHeading>
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
    }`}
        />

        <DocHeading level={3}>Part 2: Classify Single Room</DocHeading>
        <CodeBlock
          language="swift"
          filename="RoomClassificationPipeline.swift"
          code={`    private func classifyRoom(asset: PHAsset) async throws -> RoomClassificationResult {
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

        <DocParagraph>
          Here's what the code below does, step by step:
        </DocParagraph>
        <DocList items={[
          '1. Create actor for thread safety: Use Swift actor to safely store room data from multiple threads',
          '2. Store classified rooms: When a room is classified, add it to the index grouped by room type',
          '3. Sort by confidence: Keep rooms sorted by confidence score (best quality first)',
          '4. Limit storage: Keep only top 20 rooms per room type to save memory',
          '5. Persist to disk: Save the index to UserDefaults so it persists between app launches',
          '6. Retrieve best rooms: Get top N rooms for a specific type (e.g., top 5 living rooms)',
          '7. Load from disk: When app starts, load previously classified rooms from disk',
        ]} />

        <DocHeading level={3}>Part 1: Store Classified Rooms</DocHeading>
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
    }`}
        />

        <DocHeading level={3}>Part 2: Retrieve Rooms</DocHeading>
        <CodeBlock
          language="swift"
          filename="RoomAssetStore.swift"
          code={`    /// Retrieve best rooms for a specific type
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
    }`}
        />

        <DocHeading level={3}>Part 3: Persistence</DocHeading>
        <CodeBlock
          language="swift"
          filename="RoomAssetStore.swift"
          code={`    private func persistIndex() {
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

        <DocParagraph>
          Here's what the code below does, step by step:
        </DocParagraph>
        <DocList items={[
          '1. Create SwiftUI view: Build a horizontal scrolling carousel to display room images',
          '2. Load rooms on appear: When view appears, fetch best rooms for the specified room type',
          '3. Display header: Show room type name and count of available rooms',
          '4. Create horizontal scroll: Use ScrollView(.horizontal) for side-scrolling carousel',
          '5. Lazy load images: Use LazyHStack to only load images when they appear on screen',
          '6. Load thumbnails: For each room card, load the thumbnail image from Photos library',
          '7. Display room card: Show image, confidence badge, and room type',
          '8. Show loading state: Display placeholder while images are loading',
        ]} />

        <DocHeading level={3}>Part 1: Main Carousel View</DocHeading>
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
    }`}
        />

        <DocHeading level={3}>Part 2: Load Rooms and Images</DocHeading>
        <CodeBlock
          language="swift"
          filename="RoomCarouselView.swift"
          code={`    private func loadRooms() async {
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
}`}
        />

        <DocHeading level={3}>Part 3: Room Card Component</DocHeading>
        <CodeBlock
          language="swift"
          filename="RoomCarouselView.swift"
          code={`struct RoomCard: View {
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

        <DocParagraph>
          Here's what the code below does, step by step:
        </DocParagraph>
        <DocList items={[
          '1. Check confidence score: Reject if room classification confidence is below 0.60',
          '2. Detect blur: Use Laplacian variance to detect blurry images (low sharpness score)',
          '3. Check brightness: Reject images that are too dark (below 0.15) or too bright (above 0.90)',
          '4. Detect clutter: Reject heavily cluttered rooms (clutter score above 0.85)',
          '5. Check room type: Reject outdoor scenes and "other" room types',
          '6. Calculate overall score: Combine all quality metrics into an overall quality score',
          '7. Return quality result: Return whether image is acceptable and list any quality issues found',
        ]} />

        <DocList items={[
          <><strong>Low Confidence Score</strong> — Below 0.60 for room classification</>,
          <><strong>Blurry Images</strong> — Detected via Laplacian variance analysis</>,
          <><strong>Dark/Overexposed</strong> — Brightness outside 0.15-0.90 range</>,
          <><strong>Heavily Cluttered</strong> — Clutter score above 0.85</>,
          <><strong>Outdoor Scenes</strong> — Classified as outdoor/garden</>,
          <><strong>Cropped/Partial</strong> — Insufficient room context visible</>,
        ]} />

        <DocParagraph>
          Here's what the code below does, step by step:
        </DocParagraph>
        <DocList items={[
          '1. Define quality thresholds: Set minimum values for confidence, brightness, sharpness, etc.',
          '2. Evaluate room quality: Check all quality criteria for a classified room',
          '3. Check confidence: Reject if confidence is below minimum threshold',
          '4. Check brightness: Measure image brightness and reject if too dark or too light',
          '5. Check clutter level: Reject if room is too cluttered (hard to see furniture)',
          '6. Calculate sharpness: Use Laplacian filter to detect blur (low variance = blurry)',
          '7. Check room type: Reject outdoor and "other" room types',
          '8. Collect issues: List all quality problems found',
          '9. Calculate overall score: Combine all metrics into a single quality score',
        ]} />

        <DocHeading level={3}>Part 1: Quality Thresholds and Evaluation</DocHeading>
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
    }`}
        />

        <DocHeading level={3}>Part 2: Calculate Sharpness</DocHeading>
        <CodeBlock
          language="swift"
          filename="RoomQualityFilter.swift"
          code={`    /// Calculate image sharpness using Laplacian variance
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
