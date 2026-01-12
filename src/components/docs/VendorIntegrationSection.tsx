import { CodeBlock } from '@/components/ui/CodeBlock';
import { DocSection, DocHeading, DocParagraph, DocList, DocCallout, DocTable } from './DocSection';

export const VendorIntegrationSection = () => {
  const productMappingCode = `import PersonaLens

/// Vendor product mapping configuration
struct VendorProductConfig {
    let vendorId: String
    let products: [VendorProduct]
}

struct VendorProduct: Codable {
    let productId: String
    let imageURL: URL
    let category: PLProductCategory
    let subcategory: String?
    let metadata: [String: Any]
}

enum PLProductCategory: String, Codable {
    case maleFashion = "male_fashion"
    case femaleFashion = "female_fashion"
    case kidsFashion = "kids_fashion"
    case furniture = "furniture"
    case homeDecor = "home_decor"
}

// MARK: - Product Mapping

class VendorProductMapper {
    
    /// Map vendor products to PersonaLens categories
    func mapProducts(
        from catalog: VendorCatalog
    ) -> [PLProductCategory: [VendorProduct]] {
        var mapping: [PLProductCategory: [VendorProduct]] = [:]
        
        for product in catalog.products {
            let category = inferCategory(from: product)
            mapping[category, default: []].append(
                VendorProduct(
                    productId: product.sku,
                    imageURL: product.imageURL,
                    category: category,
                    subcategory: product.type,
                    metadata: product.attributes
                )
            )
        }
        
        return mapping
    }
    
    /// Infer PersonaLens category from vendor product data
    private func inferCategory(from product: CatalogProduct) -> PLProductCategory {
        // Map vendor-specific categories to PersonaLens categories
        switch product.department.lowercased() {
        case "men", "mens", "male":
            return .maleFashion
        case "women", "womens", "female":
            return .femaleFashion
        case "kids", "children", "boys", "girls":
            return .kidsFashion
        case "furniture", "home":
            return product.type.contains("furniture") ? .furniture : .homeDecor
        default:
            return inferFromProductType(product.type)
        }
    }
}`;

  const fashionGenerationCode = `import PersonaLens

/// Fashion try-on generation service
class FashionGenerationService {
    private let apiClient: PLAPIClient
    
    /// Generate fashion try-on image
    func generateTryOn(
        faceImage: SelectedFace,
        product: VendorProduct,
        options: TryOnOptions = .default
    ) async throws -> GenerationResult {
        // Validate inputs
        guard product.category.isFashion else {
            throw PLError.invalidProductCategory
        }
        
        // Prepare generation request
        let request = FashionGenerationRequest(
            faceImageData: try await prepareFaceImage(faceImage),
            productImageURL: product.imageURL,
            category: product.category,
            options: options
        )
        
        // Call generation API
        let response = try await apiClient.generateFashion(request)
        
        return GenerationResult(
            generatedImageURL: response.resultURL,
            processingTime: response.processingTime,
            confidence: response.confidence
        )
    }
    
    /// Prepare face image for API submission
    private func prepareFaceImage(
        _ face: SelectedFace
    ) async throws -> Data {
        guard let image = try await loadImage(assetId: face.assetId) else {
            throw PLError.imageLoadFailed
        }
        
        // Resize to optimal dimensions
        let resized = image.resized(to: CGSize(width: 1024, height: 1024))
        
        // Convert to JPEG with quality optimization
        guard let data = resized.jpegData(compressionQuality: 0.9) else {
            throw PLError.imageEncodingFailed
        }
        
        return data
    }
}

// MARK: - Request/Response Models

struct FashionGenerationRequest: Codable {
    let faceImageData: Data
    let productImageURL: URL
    let category: PLProductCategory
    let options: TryOnOptions
}

struct TryOnOptions: Codable {
    let preserveBackground: Bool
    let enhanceLighting: Bool
    let outputResolution: OutputResolution
    
    static let \`default\` = TryOnOptions(
        preserveBackground: true,
        enhanceLighting: true,
        outputResolution: .high
    )
}

struct GenerationResult {
    let generatedImageURL: URL
    let processingTime: TimeInterval
    let confidence: Float
    
    var isHighQuality: Bool {
        confidence >= 0.85
    }
}`;

  const generationErrorHandlingCode = `extension FashionGenerationService {
    
    /// Generate with comprehensive error handling
    func generateTryOnSafely(
        faceImage: SelectedFace,
        product: VendorProduct
    ) async -> Result<GenerationResult, GenerationError> {
        do {
            let result = try await generateTryOn(
                faceImage: faceImage,
                product: product
            )
            
            // Validate result quality
            if result.confidence < 0.5 {
                return .failure(.lowQualityResult(confidence: result.confidence))
            }
            
            return .success(result)
            
        } catch let error as PLAPIError {
            return .failure(mapAPIError(error))
            
        } catch {
            return .failure(.unknown(error))
        }
    }
    
    private func mapAPIError(_ error: PLAPIError) -> GenerationError {
        switch error {
        case .faceNotDetected:
            return .faceNotClear
        case .productImageInvalid:
            return .invalidProduct
        case .generationFailed(let reason):
            return .generationFailed(reason: reason)
        default:
            return .unknown(error)
        }
    }
}

enum GenerationError: Error {
    case faceNotClear
    case invalidProduct
    case lowQualityResult(confidence: Float)
    case generationFailed(reason: String)
    case unknown(Error)
    
    var userMessage: String {
        switch self {
        case .faceNotClear:
            return "Could not generate try-on. Please select a clearer photo."
        case .invalidProduct:
            return "This product cannot be used for try-on generation."
        case .lowQualityResult:
            return "Generated image quality is too low. Try a different photo."
        case .generationFailed(let reason):
            return "Generation failed: \\(reason)"
        case .unknown:
            return "An unexpected error occurred. Please try again."
        }
    }
    
    var suggestedAction: SuggestedAction {
        switch self {
        case .faceNotClear:
            return .selectDifferentPhoto
        case .invalidProduct:
            return .selectDifferentProduct
        case .lowQualityResult:
            return .selectDifferentPhoto
        case .generationFailed:
            return .retry
        case .unknown:
            return .contactSupport
        }
    }
}`;

  const furnitureGenerationCode = `import PersonaLens

/// Furniture visualization generation service
class FurnitureGenerationService {
    private let apiClient: PLAPIClient
    
    /// Room type to furniture category mapping
    private let roomFurnitureMapping: [PLRoomType: [FurnitureCategory]] = [
        .livingRoom: [.sofa, .coffeeTable, .tvStand, .armchair],
        .bedroom: [.bed, .wardrobe, .nightstand, .dresser],
        .kitchen: [.diningTable, .chairs, .cabinet],
        .bathroom: [.vanity, .mirror, .storage],
        .office: [.desk, .officeChair, .bookshelf]
    ]
    
    /// Generate furniture visualization in room
    func generateRoomVisualization(
        roomImage: SelectedRoom,
        furniture: VendorProduct
    ) async throws -> RoomVisualizationResult {
        // Validate room-furniture compatibility
        guard isCompatible(room: roomImage.roomType, furniture: furniture) else {
            throw PLError.incompatibleRoomFurniture
        }
        
        // Prepare room analysis for optimal placement
        let roomAnalysis = try await analyzeRoom(roomImage)
        
        // Generate visualization
        let request = RoomVisualizationRequest(
            roomImageData: try await prepareRoomImage(roomImage),
            furnitureImageURL: furniture.imageURL,
            placementHints: roomAnalysis.suggestedPlacements,
            roomType: roomImage.roomType
        )
        
        let response = try await apiClient.generateRoomVisualization(request)
        
        return RoomVisualizationResult(
            visualizedImageURL: response.resultURL,
            furnitureBounds: response.placedFurnitureBounds,
            processingTime: response.processingTime
        )
    }
    
    /// Check if furniture is appropriate for room type
    private func isCompatible(
        room: PLRoomType,
        furniture: VendorProduct
    ) -> Bool {
        guard let furnitureCategory = FurnitureCategory(
            rawValue: furniture.subcategory ?? ""
        ) else {
            return true // Allow if category unknown
        }
        
        return roomFurnitureMapping[room]?.contains(furnitureCategory) ?? false
    }
    
    /// Analyze room for furniture placement
    private func analyzeRoom(
        _ room: SelectedRoom
    ) async throws -> RoomAnalysisForPlacement {
        // Detect floor plane, walls, existing furniture
        let detector = PLRoomLayoutDetector()
        return try await detector.analyze(room)
    }
}

// MARK: - Models

struct RoomVisualizationRequest: Codable {
    let roomImageData: Data
    let furnitureImageURL: URL
    let placementHints: [PlacementHint]
    let roomType: PLRoomType
}

struct RoomVisualizationResult {
    let visualizedImageURL: URL
    let furnitureBounds: CGRect
    let processingTime: TimeInterval
}

struct PlacementHint: Codable {
    let region: CGRect
    let confidence: Float
    let placementType: PlacementType
}

enum PlacementType: String, Codable {
    case floor
    case wall
    case surface
}

enum FurnitureCategory: String, Codable {
    case sofa, coffeeTable, tvStand, armchair
    case bed, wardrobe, nightstand, dresser
    case diningTable, chairs, cabinet
    case vanity, mirror, storage
    case desk, officeChair, bookshelf
}`;

  return (
    <DocSection id="vendor-integration">
      <DocHeading level={1}>Phase 5: Vendor Integration & Generation</DocHeading>
      <DocParagraph>
        This phase covers integrating e-commerce vendor products with PersonaLens for 
        fashion try-on and furniture visualization generation.
      </DocParagraph>

      <DocHeading level={2} id="product-mapping">Vendor Product Mapping</DocHeading>
      <DocParagraph>
        Map your e-commerce catalog to PersonaLens categories for seamless integration 
        with the generation pipeline.
      </DocParagraph>

      <CodeBlock 
        code={productMappingCode} 
        filename="VendorProductMapper.swift"
        language="swift"
      />

      <DocTable 
        headers={['Vendor Category', 'PersonaLens Category', 'Generation Type']}
        rows={[
          ['Men\'s Apparel', 'maleFashion', 'Fashion Try-On'],
          ['Women\'s Apparel', 'femaleFashion', 'Fashion Try-On'],
          ['Kids Clothing', 'kidsFashion', 'Fashion Try-On'],
          ['Sofas, Tables, Beds', 'furniture', 'Room Visualization'],
          ['Decor, Lighting', 'homeDecor', 'Room Visualization'],
        ]}
      />

      <DocHeading level={2} id="fashion-generation">Fashion Generation Pipeline</DocHeading>
      <DocParagraph>
        The fashion generation API creates realistic try-on images by combining the 
        user's best face with vendor product images.
      </DocParagraph>

      <CodeBlock 
        code={fashionGenerationCode} 
        filename="FashionGenerationService.swift"
        language="swift"
      />

      <DocCallout type="info" title="Image Requirements">
        For best results, face images should be at least 512×512px with clear facial 
        features. Product images should have transparent or solid backgrounds.
      </DocCallout>

      <DocHeading level={2} id="generation-errors">Generation Error Handling</DocHeading>
      <DocParagraph>
        Comprehensive error handling with user-friendly messages and suggested recovery actions.
      </DocParagraph>

      <CodeBlock 
        code={generationErrorHandlingCode} 
        filename="FashionGenerationService+Errors.swift"
        language="swift"
      />

      <DocList items={[
        'Always provide actionable error messages to users',
        'Implement retry logic for transient failures',
        'Offer alternative photo selection when quality is insufficient',
        'Log detailed errors for debugging while showing simple messages to users',
      ]} />

      <DocHeading level={2} id="furniture-generation">Furniture Generation Logic</DocHeading>
      <DocParagraph>
        Room visualization intelligently places furniture based on room type and layout analysis.
      </DocParagraph>

      <CodeBlock 
        code={furnitureGenerationCode} 
        filename="FurnitureGenerationService.swift"
        language="swift"
      />

      <DocCallout type="warning" title="Room Compatibility">
        The SDK validates room-furniture compatibility before generation. Attempting to 
        place a bed in a kitchen will throw an <code>incompatibleRoomFurniture</code> error.
      </DocCallout>

      <DocTable 
        headers={['Room Type', 'Compatible Furniture']}
        rows={[
          ['Living Room', 'Sofa, Coffee Table, TV Stand, Armchair'],
          ['Bedroom', 'Bed, Wardrobe, Nightstand, Dresser'],
          ['Kitchen', 'Dining Table, Chairs, Cabinet'],
          ['Bathroom', 'Vanity, Mirror, Storage'],
          ['Office', 'Desk, Office Chair, Bookshelf'],
        ]}
      />
    </DocSection>
  );
};
