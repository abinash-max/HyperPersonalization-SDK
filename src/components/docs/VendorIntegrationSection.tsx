import { CodeBlock } from '@/components/ui/CodeBlock';
import { DocSection, DocHeading, DocParagraph, DocList, DocCallout, DocTable } from './DocSection';

export const VendorIntegrationSection = () => {
  const productMappingCode = `import HyperPersonalization

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
    
    /// Map vendor products to HyperPersonalization categories
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
    
    /// Infer HyperPersonalization category from vendor product data
    private func inferCategory(from product: CatalogProduct) -> PLProductCategory {
        // Map vendor-specific categories to HyperPersonalization categories
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

  const fashionGenerationCode = `import HyperPersonalization

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

  const furnitureGenerationCode = `import HyperPersonalization

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
      <DocHeading level={1}>Personalization</DocHeading>
      <DocParagraph>
        This section covers integrating e-commerce vendor products with HyperPersonalization for 
        fashion personalization and furniture personalization.
      </DocParagraph>

      <DocHeading level={2} id="product-mapping">Product Mapping</DocHeading>
      <DocParagraph>
        After Image Analysis completes, you'll know which images were discovered. Use this information to 
        select the appropriate products from your vendor catalog for personalization.
      </DocParagraph>

      <DocHeading level={3}>Mapping Based on Room Selection</DocHeading>
      <DocParagraph>
        After Room Selection, the plugin returns the best room images found. Map products based on the room types discovered:
      </DocParagraph>
      <DocList items={[
        'If best <strong>bedroom</strong> image found → Use <strong>bed products</strong> for furniture personalization',
        'If best <strong>living room</strong> image found → Use <strong>sofa products</strong> for furniture personalization',
        'If best <strong>dining room</strong> image found → Use <strong>table products</strong> for furniture personalization',
      ]} />

      <DocHeading level={3}>Mapping Based on Human Selection</DocHeading>
      <DocParagraph>
        After Human Selection, the plugin returns the best human images found. Map products based on the person types discovered:
      </DocParagraph>
      <DocList items={[
        'If best <strong>male</strong> image found → Use <strong>male fashion products</strong> (shirts, pants, etc.) for fashion personalization',
        'If best <strong>female</strong> image found → Use <strong>female fashion products</strong> (dresses, tops, etc.) for fashion personalization',
        'If best <strong>kids</strong> image found → Use <strong>kids fashion products</strong> for fashion personalization',
      ]} />

      <DocCallout type="info" title="Summary">
        <strong>Simple rule:</strong> Use the images discovered in Image Analysis to determine which products 
        to personalize. Room images → Furniture products. Human images → Fashion products.
      </DocCallout>

      <DocHeading level={2} id="fashion-generation">Fashion Personalization</DocHeading>
      <DocParagraph>
        Visualize how a garment looks on a real user by generating a <strong>virtual try-on image</strong> that combines the user photo and the garment image.
      </DocParagraph>
      <DocParagraph>
        This feature is typically used <strong>after personalization and human analysis</strong>, when you already have a high-quality user image and a product image URL.
      </DocParagraph>

      <DocHeading level={3}>What this feature does (in one sentence)</DocHeading>
      <DocParagraph>
        <strong>Given a user photo, a garment product image URL, and a product type, the plugin generates a combined image showing the user wearing the selected garment, or fails with a clear error.</strong>
      </DocParagraph>

      <DocHeading level={3}>When to use Fashion Personalization</DocHeading>
      <DocParagraph>
        Use this API when:
      </DocParagraph>
      <DocList items={[
        'You already have a best-quality user image (face/body)',
        'You want to visualize a specific garment on that user',
        'You want to display a realistic try-on result inside your app',
      ]} />
      <DocParagraph>
        Typical use cases:
      </DocParagraph>
      <DocList items={[
        'Virtual try-on experiences',
        'Product preview before purchase',
        'Personalized shopping journeys',
      ]} />

      <DocHeading level={3}>How to Choose Garment URLs</DocHeading>
      <DocParagraph>
        When working with product catalogs, garments often have <strong>multiple catalog images</strong> showing different angles, 
        details, or views of the same product. You need to specify which image URL index should be used for personalization.
      </DocParagraph>
      <DocParagraph>
        <strong>Example scenario:</strong> A garment product has 5 catalog images (indices 0-4). You want to personalize 
        images at indices 0, 2, and 4. You need to pass these indices along with the base product information.
      </DocParagraph>
      
      <DocHeading level={4}>Understanding Catalog Image Indices</DocHeading>
      <DocParagraph>
        Product catalogs typically provide an array of image URLs. Each URL has an index position:
      </DocParagraph>
      <CodeBlock
        language="swift"
        filename="GarmentCatalog.swift"
        code={`// Example: Garment product with 5 catalog images
struct GarmentProduct {
    let productId: String
    let catalogImages: [String]  // Array of image URLs
    
    // Example catalog images:
    // Index 0: "https://vendor.com/products/shirt-456-front.jpg"
    // Index 1: "https://vendor.com/products/shirt-456-back.jpg"
    // Index 2: "https://vendor.com/products/shirt-456-detail.jpg"
    // Index 3: "https://vendor.com/products/shirt-456-side.jpg"
    // Index 4: "https://vendor.com/products/shirt-456-closeup.jpg"
}

// You want to personalize images at indices 0, 2, and 4
let indicesToPersonalize = [0, 2, 4]

// Get the URLs for those indices
let urlsToPersonalize = indicesToPersonalize.map { index in
    garmentProduct.catalogImages[index]
}
// Result: [
//   "https://vendor.com/products/shirt-456-front.jpg",
//   "https://vendor.com/products/shirt-456-detail.jpg",
//   "https://vendor.com/products/shirt-456-closeup.jpg"
// ]`}
      />
      
      <DocHeading level={4}>Best Practices for Selecting Images</DocHeading>
      <DocList items={[
        'Choose front-facing images (index 0) for best try-on results',
        'Select detail images (index 2) when showing product features',
        'Use closeup images (index 4) for high-quality visualization',
        'Avoid back views or side angles unless specifically needed',
        'Ensure selected images show the garment clearly and fully',
      ]} />
      
      <DocCallout type="info" title="Important">
        <strong>Index-based selection:</strong> When passing garment URLs from a catalog, always specify which image 
        index needs to be personalized. This allows you to control which views of the product are used for try-on generation.
      </DocCallout>

      <DocHeading level={3}>Core API</DocHeading>
      <DocHeading level={4}>generateFashion(...)</DocHeading>
      <DocParagraph>
        This is the primary function used to generate a fashion try-on image. When working with catalog images, 
        you can specify which image index to use.
      </DocParagraph>
      <CodeBlock
        language="swift"
        filename="FashionGeneration.swift"
        code={`// Basic usage with single URL
plugin.generateFashion(
    thumbnailImg: userPhotoImage,     // UIImage of the user
    garmentImageUrl: "https://example.com/shirt.jpg", // URL of the garment image
    productType: "upper_body",        // "upper_body", "lower_body", "dresses"
    completion: { result in
        // Handle the result
    }
)

// Usage with catalog image index
let garmentProduct = GarmentProduct(
    productId: "shirt-456",
    catalogImages: [
        "https://vendor.com/products/shirt-456-front.jpg",    // Index 0
        "https://vendor.com/products/shirt-456-back.jpg",   // Index 1
        "https://vendor.com/products/shirt-456-detail.jpg",  // Index 2
        "https://vendor.com/products/shirt-456-side.jpg",    // Index 3
        "https://vendor.com/products/shirt-456-closeup.jpg"  // Index 4
    ]
)

// Personalize images at indices 0, 2, and 4
let indicesToPersonalize = [0, 2, 4]

for index in indicesToPersonalize {
    let garmentUrl = garmentProduct.catalogImages[index]
    
    // Track which catalog image index you're personalizing
    plugin.generateFashion(
        thumbnailImg: userPhotoImage,
        garmentImageUrl: garmentUrl,  // URL from catalog at the specified index
        productType: "upper_body",
        completion: { result in
            switch result {
            case .success(let imageResult):
                // Store result with its index for reference
                print("✅ Generated try-on for catalog image index \\(index)")
                // You can track: imageResult with index for your records
            case .failure(let error):
                print("❌ Failed for catalog index \\(index): \\(error)")
            }
        }
    )
}`}
      />

      <DocHeading level={3}>Parameters explained</DocHeading>
      <DocHeading level={4}>thumbnailImg</DocHeading>
      <DocList items={[
        'Type: UIImage',
        'Description: The user\'s photo showing their face or body. This image is typically selected from earlier personalization or human analysis phases.',
      ]} />

      <DocHeading level={4}>garmentImageUrl</DocHeading>
      <DocList items={[
        'Type: String',
        'Description: A publicly accessible URL pointing to the garment product image that should be tried on. This can be a single URL or one selected from a catalog image array.',
      ]} />
      
      <DocHeading level={4}>Working with Catalog Image Indices</DocHeading>
      <DocParagraph>
        When working with catalog images, you should track which index each URL corresponds to. For example, 
        if a product has 5 catalog images and you want to personalize indices 0, 2, and 4:
      </DocParagraph>
      <DocList items={[
        'Extract URLs from the catalog array at the desired indices: <code>catalogImages[0]</code>, <code>catalogImages[2]</code>, <code>catalogImages[4]</code>',
        'Call <code>generateFashion()</code> for each URL',
        'Track the index in your completion handler or result storage for reference',
      ]} />

      <DocHeading level={4}>productType</DocHeading>
      <DocList items={[
        'Type: String',
        'Description: Specifies the category of clothing being applied.',
      ]} />
      <DocParagraph>
        Supported values:
      </DocParagraph>
      <DocList items={[
        '"upper_body" - shirts, t-shirts, jackets, tops',
        '"lower_body" - pants, jeans, skirts, shorts',
        '"dresses" - dresses, gowns, one-piece garments',
      ]} />

      <DocHeading level={4}>completion</DocHeading>
      <DocList items={[
        'Type: (Result<ImageResult, Error>) -> Void',
        'Description: Callback invoked once the generation process finishes, either successfully or with an error.',
      ]} />

      <DocHeading level={3}>Result handling</DocHeading>
      <DocHeading level={4}>Success case</DocHeading>
      <CodeBlock
        language="swift"
        filename="FashionGeneration.swift"
        code={`case .success(let imageResult):
    if let generatedImage = imageResult.resultImage {
        imageView.image = generatedImage
    }`}
      />
      <DocParagraph>
        <strong>What happens:</strong>
      </DocParagraph>
      <DocList items={[
        'The generation succeeds',
        'imageResult contains the output',
        'imageResult.resultImage is the final combined image',
        'Assign it directly to an UIImageView for display',
      ]} />

      <DocHeading level={4}>Failure case</DocHeading>
      <CodeBlock
        language="swift"
        filename="FashionGeneration.swift"
        code={`case .failure(let error):
    print("Generation failed: \\(error)")`}
      />
      <DocParagraph>
        <strong>What happens:</strong>
      </DocParagraph>
      <DocList items={[
        'The generation process fails',
        'An error is returned',
        'You should display an appropriate error message or retry option in your UI',
      ]} />

      <DocHeading level={3}>Step-by-step flow</DocHeading>
      <DocList items={[
        'Prepare inputs: A user photo (UIImage), A garment product image URL, A valid product type',
        'Call generateFashion(): The plugin downloads the garment image, Analyzes the user photo (detects face/body), Places the garment on the user, Generates a combined image',
        'Receive result: Success: Access and display the generated image, Failure: Handle and surface the error',
      ]} />

      <DocHeading level={3}>Complete example (recommended integration pattern)</DocHeading>
      <CodeBlock
        language="swift"
        filename="FashionGeneration.swift"
        code={`// Step 1: You have a user photo from Phase 4 (Human Analysis)
let userPhotoImage: UIImage = ... // Best face image (male/female/kids)

// Step 2: You have a garment product URL from Phase 5 (Vendor Integration)
let shirtUrl = "https://vendor-site.com/products/shirt-456.jpg"

// Step 3: Generate the try-on visualization
plugin.generateFashion(
    thumbnailImg: userPhotoImage,     // User's photo
    garmentImageUrl: shirtUrl,        // Garment product image URL
    productType: "upper_body",        // Type of clothing
    completion: { result in
        switch result {
        case .success(let imageResult):
            if let generatedImage = imageResult.resultImage {
                imageView.image = generatedImage
                print("✅ Fashion try-on generated!")
            } else {
                print("⚠️ No image returned")
            }

        case .failure(let error):
            print("❌ Generation failed: \\(error)")
            showError("Could not generate try-on. Please try again.")
        }
    }
)`}
      />

      <DocHeading level={3}>Product type reference</DocHeading>
      <DocTable
        headers={['Product Type', 'Description']}
        rows={[
          ['upper_body', 'Shirts, t-shirts, jackets, tops'],
          ['lower_body', 'Pants, jeans, skirts, shorts'],
          ['dresses', 'Dresses, gowns, one-piece garments'],
        ]}
      />

      <DocHeading level={3}>What the plugin handles automatically</DocHeading>
      <DocList items={[
        'Garment image download',
        'User photo analysis',
        'Garment placement and alignment',
        'Image generation and blending',
      ]} />
      <DocParagraph>
        You only need to provide:
      </DocParagraph>
      <DocList items={[
        'User image',
        'Garment image URL',
        'Product type',
      ]} />

      <DocHeading level={3}>Typical placement in the plugin pipeline</DocHeading>
      <DocParagraph>
        This feature is usually used <strong>after</strong>:
      </DocParagraph>
      <DocList items={[
        'Phase 4: Human Analysis (You already have the best user images)',
        'Phase 5: Vendor Integration (You already have product image URLs)',
      ]} />

      <DocHeading level={3}>Summary</DocHeading>
      <DocList items={[
        'Provide a user photo, garment image URL, and product type',
        'Call generateFashion()',
        'Receive a generated try-on image or an error',
        'Display the result in your UI',
      ]} />
      <DocParagraph>
        This API enables <strong>real-time, personalized fashion visualization</strong> with minimal integration effort.
      </DocParagraph>

      <DocHeading level={2} id="furniture-generation">Furniture Personalization</DocHeading>
      <DocParagraph>
        Place a furniture item into a real room image to generate a <strong>virtual room visualization</strong> that shows how the product looks in the user's space.
      </DocParagraph>
      <DocParagraph>
        This feature is typically used <strong>after room analysis</strong>, when you already have a classified room image and a furniture product image URL.
      </DocParagraph>

      <DocHeading level={3}>What this feature does (in one sentence)</DocHeading>
      <DocParagraph>
        <strong>Given a room photo, a room type, and a furniture product image URL, the plugin generates a combined image showing the furniture placed inside the room, or fails with a clear error.</strong>
      </DocParagraph>

      <DocHeading level={3}>When to use Furniture Personalization</DocHeading>
      <DocParagraph>
        Use this API when:
      </DocParagraph>
      <DocList items={[
        'You already have a room image (living room, bedroom, dining room)',
        'You want to visualize a specific furniture item in that room',
        'You want to display a realistic in-room placement preview inside your app',
      ]} />
      <DocParagraph>
        Typical use cases:
      </DocParagraph>
      <DocList items={[
        'Virtual furniture placement',
        'Product visualization before purchase',
        'Personalized home shopping experiences',
      ]} />

      <DocHeading level={3}>How to Choose Furniture URLs</DocHeading>
      <DocParagraph>
        When working with product catalogs, furniture items often have <strong>multiple catalog images</strong> showing 
        different angles, room settings, or detail views. You need to specify which image URL index should be used for personalization.
      </DocParagraph>
      <DocParagraph>
        <strong>Example scenario:</strong> A furniture product has 5 catalog images (indices 0-4). You want to personalize 
        images at indices 0, 2, and 4. You need to pass these indices along with the base product information.
      </DocParagraph>
      
      <DocHeading level={4}>Understanding Catalog Image Indices</DocHeading>
      <DocParagraph>
        Product catalogs typically provide an array of image URLs. Each URL has an index position:
      </DocParagraph>
      <CodeBlock
        language="swift"
        filename="FurnitureCatalog.swift"
        code={`// Example: Furniture product with 5 catalog images
struct FurnitureProduct {
    let productId: String
    let catalogImages: [String]  // Array of image URLs
    
    // Example catalog images:
    // Index 0: "https://vendor.com/products/sofa-123-front.jpg"
    // Index 1: "https://vendor.com/products/sofa-123-back.jpg"
    // Index 2: "https://vendor.com/products/sofa-123-detail.jpg"
    // Index 3: "https://vendor.com/products/sofa-123-room-view.jpg"
    // Index 4: "https://vendor.com/products/sofa-123-closeup.jpg"
}

// You want to personalize images at indices 0, 2, and 4
let indicesToPersonalize = [0, 2, 4]

// Get the URLs for those indices
let urlsToPersonalize = indicesToPersonalize.map { index in
    furnitureProduct.catalogImages[index]
}
// Result: [
//   "https://vendor.com/products/sofa-123-front.jpg",
//   "https://vendor.com/products/sofa-123-detail.jpg",
//   "https://vendor.com/products/sofa-123-closeup.jpg"
// ]`}
      />
      
      <DocHeading level={4}>Best Practices for Selecting Images</DocHeading>
      <DocList items={[
        'Choose front-facing images (index 0) for best room placement results',
        'Select detail images (index 2) when showing product features',
        'Use closeup images (index 4) for high-quality visualization',
        'Avoid images with complex backgrounds or other furniture',
        'Ensure selected images show the furniture item clearly and fully',
      ]} />
      
      <DocCallout type="info" title="Important">
        <strong>Index-based selection:</strong> When passing furniture URLs from a catalog, always specify which image 
        index needs to be personalized. This allows you to control which views of the product are used for room visualization.
      </DocCallout>

      <DocHeading level={3}>Core API</DocHeading>
      <DocHeading level={4}>generateFurniture(...)</DocHeading>
      <DocParagraph>
        This is the primary function used to generate a furniture visualization inside a room image. When working with 
        catalog images, you can specify which image index to use.
      </DocParagraph>
      <CodeBlock
        language="swift"
        filename="FurnitureGeneration.swift"
        code={`// Basic usage with single URL
plugin.generateFurniture(
    thumbnailImg: userRoomImage,      // UIImage of the room
    roomType: "living_room",          // "bedroom", "living_room", "dining_room"
    objectUrl: "https://example.com/sofa.jpg", // URL of the furniture product image
    completion: { result in
        // Handle the result
    }
)

// Usage with catalog image index
let furnitureProduct = FurnitureProduct(
    productId: "sofa-123",
    catalogImages: [
        "https://vendor.com/products/sofa-123-front.jpg",    // Index 0
        "https://vendor.com/products/sofa-123-back.jpg",    // Index 1
        "https://vendor.com/products/sofa-123-detail.jpg",  // Index 2
        "https://vendor.com/products/sofa-123-room-view.jpg", // Index 3
        "https://vendor.com/products/sofa-123-closeup.jpg"   // Index 4
    ]
)

// Personalize images at indices 0, 2, and 4
let indicesToPersonalize = [0, 2, 4]

for index in indicesToPersonalize {
    let furnitureUrl = furnitureProduct.catalogImages[index]
    
    // Track which catalog image index you're personalizing
    plugin.generateFurniture(
        thumbnailImg: userRoomImage,
        roomType: "living_room",
        objectUrl: furnitureUrl,  // URL from catalog at the specified index
        completion: { result in
            switch result {
            case .success(let imageResult):
                // Store result with its index for reference
                print("✅ Generated visualization for catalog image index \\(index)")
                // You can track: imageResult with index for your records
            case .failure(let error):
                print("❌ Failed for catalog index \\(index): \\(error)")
            }
        }
    )
}`}
      />

      <DocHeading level={3}>Parameters explained</DocHeading>
      <DocHeading level={4}>thumbnailImg</DocHeading>
      <DocList items={[
        'Type: UIImage',
        'Description: The room photo where the furniture item will be placed. This image typically comes from earlier room analysis or classification.',
      ]} />

      <DocHeading level={4}>roomType</DocHeading>
      <DocList items={[
        'Type: String',
        'Description: Specifies the type of room shown in the image.',
      ]} />
      <DocParagraph>
        Supported values:
      </DocParagraph>
      <DocList items={[
        '"bedroom"',
        '"living_room"',
        '"dining_room"',
      ]} />

      <DocHeading level={4}>objectUrl</DocHeading>
      <DocList items={[
        'Type: String',
        'Description: A publicly accessible URL pointing to the furniture product image that should be placed into the room. This can be a single URL or one selected from a catalog image array.',
      ]} />
      
      <DocHeading level={4}>Working with Catalog Image Indices</DocHeading>
      <DocParagraph>
        When working with catalog images, you should track which index each URL corresponds to. For example, 
        if a product has 5 catalog images and you want to personalize indices 0, 2, and 4:
      </DocParagraph>
      <DocList items={[
        'Extract URLs from the catalog array at the desired indices: <code>catalogImages[0]</code>, <code>catalogImages[2]</code>, <code>catalogImages[4]</code>',
        'Call <code>generateFurniture()</code> for each URL',
        'Track the index in your completion handler or result storage for reference',
      ]} />

      <DocHeading level={4}>completion</DocHeading>
      <DocList items={[
        'Type: (Result<ImageResult, Error>) -> Void',
        'Description: Callback invoked once the generation process finishes, either successfully or with an error.',
      ]} />

      <DocHeading level={3}>Result handling</DocHeading>
      <DocHeading level={4}>Success case</DocHeading>
      <CodeBlock
        language="swift"
        filename="FurnitureGeneration.swift"
        code={`case .success(let imageResult):
    if let generatedImage = imageResult.resultImage {
        imageView.image = generatedImage
    }`}
      />
      <DocParagraph>
        <strong>What happens:</strong>
      </DocParagraph>
      <DocList items={[
        'The generation succeeds',
        'imageResult contains the output',
        'imageResult.resultImage is the final combined image (room + furniture)',
        'Assign it directly to an UIImageView for display',
      ]} />

      <DocHeading level={4}>Failure case</DocHeading>
      <CodeBlock
        language="swift"
        filename="FurnitureGeneration.swift"
        code={`case .failure(let error):
    print("Generation failed: \\(error)")`}
      />
      <DocParagraph>
        <strong>What happens:</strong>
      </DocParagraph>
      <DocList items={[
        'The generation process fails',
        'An error is returned',
        'You should display an appropriate error message or retry option in your UI',
      ]} />

      <DocHeading level={3}>Step-by-step flow</DocHeading>
      <DocList items={[
        'Prepare inputs: A room image (UIImage), A room type ("bedroom", "living_room", or "dining_room"), A furniture product image URL',
        'Call generateFurniture(): The plugin downloads the furniture image, Analyzes the room image, Places the furniture in the room, Generates a combined image',
        'Receive result: Success: Access and display the generated image, Failure: Handle and surface the error',
      ]} />

      <DocHeading level={3}>Complete example (recommended integration pattern)</DocHeading>
      <CodeBlock
        language="swift"
        filename="FurnitureGeneration.swift"
        code={`// Step 1: You have a room image from Phase 3 (Room Analysis)
let userRoomImage: UIImage = ... // From your classified room photos

// Step 2: You have a furniture product URL from Phase 5 (Vendor Integration)
let sofaUrl = "https://vendor-site.com/products/sofa-123.jpg"

// Step 3: Generate the visualization
plugin.generateFurniture(
    thumbnailImg: userRoomImage,      // Your room photo
    roomType: "living_room",          // Room type (from Phase 3 classification)
    objectUrl: sofaUrl,               // Furniture product image URL
    completion: { result in
        switch result {
        case .success(let imageResult):
            if let generatedImage = imageResult.resultImage {
                imageView.image = generatedImage
                print("✅ Furniture visualization generated!")
            } else {
                print("⚠️ No image returned")
            }

        case .failure(let error):
            print("❌ Generation failed: \\(error)")
            showError("Could not generate visualization. Please try again.")
        }
    }
)`}
      />

      <DocHeading level={3}>What the plugin handles automatically</DocHeading>
      <DocList items={[
        'Furniture image download',
        'Room image analysis',
        'Furniture placement and alignment',
        'Image generation and blending',
      ]} />
      <DocParagraph>
        You only need to provide:
      </DocParagraph>
      <DocList items={[
        'Room image',
        'Room type',
        'Furniture product image URL',
      ]} />

      <DocHeading level={3}>Typical placement in the plugin pipeline</DocHeading>
      <DocParagraph>
        This feature is usually used <strong>after</strong>:
      </DocParagraph>
      <DocList items={[
        'Phase 3: Room Analysis (You already have classified room images)',
        'Phase 5: Vendor Integration (You already have product image URLs)',
      ]} />

      <DocHeading level={3}>Summary</DocHeading>
      <DocList items={[
        'Provide a room image, room type, and furniture product URL',
        'Call generateFurniture()',
        'Receive a generated visualization image or an error',
        'Display the result in your UI',
      ]} />
      <DocParagraph>
        This API enables <strong>real-time, personalized furniture visualization</strong> with minimal integration effort.
      </DocParagraph>
    </DocSection>
  );
};
