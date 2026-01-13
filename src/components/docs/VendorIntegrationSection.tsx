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
      <DocHeading level={1}>Phase 5: Vendor Integration & Generation</DocHeading>
      <DocParagraph>
        This phase covers integrating e-commerce vendor products with HyperPersonalization for 
        fashion try-on and furniture visualization generation.
      </DocParagraph>

      <DocHeading level={2} id="product-fetching">How to Get Product Images from Vendor Sites</DocHeading>
      <DocParagraph>
        Before generating personalization, you need to <strong>get product images from your vendor site</strong> 
        (e.g., Westside, IKEA, etc.). Here's how:
      </DocParagraph>

      <DocParagraph>
        Here's what the code below does, step by step:
      </DocParagraph>
      <DocList items={[
        '1. Call vendor API: Make HTTP request to your vendor\'s API (e.g., Westside API) to get product catalog',
        '2. Parse response: Decode JSON response into product objects with IDs, names, categories, image URLs',
        '3. Filter by category: Filter products by category (e.g., "men", "women", "kids") to get relevant products',
        '4. Download images: For each product, download the product image from the image URL',
        '5. Create product objects: Combine product data with downloaded images into ProductWithImage objects',
        '6. Group by category: Organize products into PersonalizationProducts with male, female, and kids sections',
        '7. Return products: Return all products ready to use for personalization generation',
      ]} />

      <CodeBlock 
        code={`import Foundation

/// Example: How Westside developers get product images for personalization
class VendorProductFetcher {
    private let apiClient: VendorAPIClient
    
    /// Step 1: Fetch products from vendor site (e.g., Westside API)
    /// This gets all available products with their images
    func fetchProductsFromVendorSite() async throws -> [VendorProduct] {
        // Call your vendor's API (e.g., Westside API)
        let url = URL(string: "https://api.westside.com/products")!
        let (data, _) = try await URLSession.shared.data(from: url)
        
        // Parse response
        let response = try JSONDecoder().decode(VendorAPIResponse.self, from: data)
        return response.products
    }
    
    /// Step 2: Filter products by category and get their images
    /// Example: Get all male fashion products
    func getMaleFashionProducts() async throws -> [ProductWithImage] {
        let allProducts = try await fetchProductsFromVendorSite()
        
        // Filter for male fashion
        let maleProducts = allProducts.filter { product in
            product.category == "men" || product.category == "male"
        }
        
        // Get product images
        var productsWithImages: [ProductWithImage] = []
        for product in maleProducts {
            // Download product image from vendor site
            if let imageURL = product.imageURL,
               let image = try? await downloadImage(from: imageURL) {
                productsWithImages.append(ProductWithImage(
                    productId: product.id,
                    image: image,
                    imageURL: imageURL,
                    category: "male_fashion"
                ))
            }
        }
        
        return productsWithImages
    }
    
    /// Step 3: Get products for each category
    func getProductsForPersonalization() async throws -> PersonalizationProducts {
        // Get products for each category
        let maleProducts = try await getMaleFashionProducts()
        let femaleProducts = try await getFemaleFashionProducts()
        let kidsProducts = try await getKidsFashionProducts()
        
        return PersonalizationProducts(
            male: maleProducts,
            female: femaleProducts,
            kids: kidsProducts
        )
    }
    
    /// Download image from URL
    private func downloadImage(from url: URL) async throws -> UIImage {
        let (data, _) = try await URLSession.shared.data(from: url)
        guard let image = UIImage(data: data) else {
            throw ImageError.invalidData
        }
        return image
    }
}

/// Product structure from vendor API
struct VendorProduct: Codable {
    let id: String
    let name: String
    let category: String      // "men", "women", "kids", "furniture", etc.
    let imageURL: URL?
    let price: Double
}

struct ProductWithImage {
    let productId: String
    let image: UIImage
    let imageURL: URL
    let category: String      // "male_fashion", "female_fashion", "kids_fashion"
}

struct PersonalizationProducts {
    let male: [ProductWithImage]
    let female: [ProductWithImage]
    let kids: [ProductWithImage]
}

enum ImageError: Error {
    case invalidData
    case downloadFailed
}

/// Example usage:
/// let fetcher = VendorProductFetcher()
/// let products = try await fetcher.getProductsForPersonalization()
/// 
/// // Now you have:
/// // - products.male: All male fashion products with images
/// // - products.female: All female fashion products with images
/// // - products.kids: All kids products with images`} 
        filename="VendorProductFetcher.swift"
        language="swift"
      />

      <DocCallout type="info" title="Important">
        <strong>How it works:</strong>
        <ul>
          <li>Your vendor site (e.g., Westside) has an API that provides product data</li>
          <li>You fetch products and filter them by category (male/female/kids)</li>
          <li>You download the product images from the vendor's image URLs</li>
          <li>These product images are then used with the best face images for personalization</li>
        </ul>
      </DocCallout>

      <DocHeading level={2} id="product-mapping">Vendor Product Mapping</DocHeading>
      <DocParagraph>
        Map your e-commerce catalog to HyperPersonalization categories for seamless integration 
        with the generation pipeline.
      </DocParagraph>

      <DocParagraph>
        Here's what the code below does, step by step:
      </DocParagraph>
      <DocList items={[
        '1. Define categories: Create enum with HyperPersonalization categories (maleFashion, femaleFashion, kidsFashion, furniture, homeDecor)',
        '2. Map vendor products: Loop through vendor catalog and map each product to a HyperPersonalization category',
        '3. Infer category: Use product department/type to determine which category it belongs to',
        '4. Handle special cases: Map vendor-specific categories (e.g., "mens", "womens") to standard categories',
        '5. Group products: Organize products into dictionary grouped by HyperPersonalization category',
        '6. Return mapping: Return dictionary where each category contains list of products',
      ]} />

      <CodeBlock 
        code={productMappingCode} 
        filename="VendorProductMapper.swift"
        language="swift"
      />

      <DocTable 
          headers={['Vendor Category', 'HyperPersonalization Category', 'Generation Type']}
        rows={[
          ['Men\'s Apparel', 'maleFashion', 'Fashion Try-On'],
          ['Women\'s Apparel', 'femaleFashion', 'Fashion Try-On'],
          ['Kids Clothing', 'kidsFashion', 'Fashion Try-On'],
          ['Sofas, Tables, Beds', 'furniture', 'Room Visualization'],
          ['Decor, Lighting', 'homeDecor', 'Room Visualization'],
        ]}
      />

      <DocHeading level={2} id="fashion-generation">Step 2: Generation of Personalization Results (Fashion)</DocHeading>
      <DocParagraph>
        After you have:
      </DocParagraph>
      <DocList items={[
        '✅ Best face images (male, female, kids) from Step 5 of Human Analysis',
        '✅ Product images from vendor site (from Step 1 above)',
      ]} />
      <DocParagraph>
        You can now <strong>generate personalized try-on images</strong> by combining them.
      </DocParagraph>

      <DocParagraph>
        <strong>How it works:</strong>
      </DocParagraph>
      <DocList items={[
        '1. Take the best female face image',
        '2. Take a product image from the female fashion section',
        '3. Pass both images + product category to the generation API',
        '4. API returns a generated image showing the product on the person',
      ]} />

      <DocParagraph>
        Here's what the code below does, step by step:
      </DocParagraph>
      <DocList items={[
        '1. Validate inputs: Check that product category is a fashion category (not furniture)',
        '2. Prepare face image: Load best face image, resize to 1024×1024, convert to JPEG data',
        '3. Prepare product image: Resize product image to 1024×1024, convert to JPEG data',
        '4. Create API request: Combine face image data, product image URL, category, and options into request',
        '5. Call generation API: Send request to generation API endpoint',
        '6. Get response: Receive generated image URL, processing time, and confidence score',
        '7. Return result: Return GenerationResult with URL of generated try-on image',
      ]} />

      <DocHeading level={3}>Part 1: Main Generation Function</DocHeading>
      <CodeBlock 
        code={`import Foundation
import UIKit

/// Generate personalized fashion try-on images
class FashionGenerationService {
    private let apiClient: GenerationAPIClient
    
    /// Generate try-on image
    /// Input: Best face image + Product image + Category
    /// Output: Generated image showing product on the person
    func generateFashionTryOn(
        bestFace: SelectedFace,        // Best face from clustering (male/female/kids)
        product: ProductWithImage,     // Product image from vendor site
        category: String               // "male_fashion", "female_fashion", or "kids_fashion"
    ) async throws -> GenerationResult {
        
        // Step 1: Prepare the best face image
        guard let faceImageData = try? await prepareFaceImage(bestFace) else {
            throw GenerationError.faceImagePreparationFailed
        }
        
        // Step 2: Prepare the product image
        guard let productImageData = try? await prepareProductImage(product) else {
            throw GenerationError.productImagePreparationFailed
        }
        
        // Step 3: Create API request
        let request = FashionGenerationRequest(
            faceImageData: faceImageData,
            productImageURL: product.imageURL,
            category: category,
            options: GenerationOptions.default
        )
        
        // Step 4: Call generation API
        let response = try await apiClient.generateFashion(request)
        
        // Step 5: Return the generated image
        return GenerationResult(
            generatedImageURL: response.resultURL,
            processingTime: response.processingTime,
            confidence: response.confidence
        )
    }`} 
        filename="FashionGenerationService.swift"
        language="swift"
      />

      <DocHeading level={3}>Part 2: Image Preparation</DocHeading>
      <CodeBlock 
        code={`    /// Prepare face image for API (resize, compress, etc.)
    private func prepareFaceImage(_ face: SelectedFace) async throws -> Data {
        // Load the face image
        guard let image = try? await loadImage(assetId: face.assetId) else {
            throw GenerationError.faceImageLoadFailed
        }
        
        // Resize to optimal size (1024×1024 for best quality)
        let resized = image.resized(to: CGSize(width: 1024, height: 1024))
        
        // Convert to JPEG with high quality
        guard let data = resized.jpegData(compressionQuality: 0.9) else {
            throw GenerationError.imageEncodingFailed
        }
        
        return data
    }
    
    /// Prepare product image for API
    private func prepareProductImage(_ product: ProductWithImage) async throws -> Data {
        // Product image is already loaded
        let resized = product.image.resized(to: CGSize(width: 1024, height: 1024))
        
        guard let data = resized.jpegData(compressionQuality: 0.9) else {
            throw GenerationError.imageEncodingFailed
        }
        
        return data
    }
}`}
        filename="FashionGenerationService.swift"
        language="swift"
      />

      <DocHeading level={3}>Part 3: Request/Response Structures</DocHeading>
      <CodeBlock 
        code={`/// API Request structure
struct FashionGenerationRequest: Codable {
    let faceImageData: Data        // Best face image (as binary data)
    let productImageURL: URL       // Product image URL from vendor
    let category: String           // "male_fashion", "female_fashion", "kids_fashion"
    let options: GenerationOptions
}

struct GenerationOptions: Codable {
    let preserveBackground: Bool
    let enhanceLighting: Bool
    
    static let \`default\` = GenerationOptions(
        preserveBackground: true,
        enhanceLighting: true
    )
}

/// API Response structure
struct GenerationAPIResponse: Codable {
    let resultURL: URL             // URL of generated image
    let processingTime: TimeInterval
    let confidence: Float          // Quality score (0.0-1.0)
}

/// Result structure
struct GenerationResult {
    let generatedImageURL: URL
    let processingTime: TimeInterval
    let confidence: Float
}

enum GenerationError: Error {
    case faceImagePreparationFailed
    case productImagePreparationFailed
    case faceImageLoadFailed
    case imageEncodingFailed
}`} 
        filename="FashionGenerationService.swift"
        language="swift"
      />

      <DocCallout type="info" title="Image Requirements">
        For best results, face images should be at least 512×512px with clear facial 
        features. Product images should have transparent or solid backgrounds.
      </DocCallout>

      <DocHeading level={2} id="generation-errors">Step 4: How to Handle Generation Errors</DocHeading>
      <DocParagraph>
        When generation fails, you need to handle errors properly. This section shows:
        <strong>what error the developer sees</strong> and <strong>what message to show the user in the UI</strong>.
      </DocParagraph>

      <DocParagraph>
        Here's what the code below does, step by step:
      </DocParagraph>
      <DocList items={[
        '1. Try generation: Attempt to generate try-on image',
        '2. Check result quality: Validate that generated image confidence is above 0.5',
        '3. Map API errors: Convert API errors to user-friendly error types',
        '4. Handle face errors: If face not detected, return faceNotClear error',
        '5. Handle product errors: If product image invalid, return invalidProduct error',
        '6. Log for developer: Print detailed error messages to console with error codes',
        '7. Show to user: Display friendly error messages in UI with suggested actions',
        '8. Provide actions: Suggest what user should do (select different photo, retry, etc.)',
      ]} />

      <DocHeading level={3}>Part 1: Error Handling Extension</DocHeading>
      <CodeBlock 
        code={`import Foundation

/// Error handling for generation API
extension FashionGenerationService {
    
    /// Generate with comprehensive error handling
    func generateTryOnSafely(
        bestFace: SelectedFace,
        product: ProductWithImage
    ) async -> Result<GenerationResult, GenerationError> {
        do {
            // Try to generate
            let result = try await generateFashionTryOn(
                bestFace: bestFace,
                product: product,
                category: product.category
            )
            
            // Check if result quality is good enough
            if result.confidence < 0.5 {
                return .failure(.lowQualityResult(confidence: result.confidence))
            }
            
            return .success(result)
            
        } catch let error as GenerationAPIError {
            // Map API errors to user-friendly errors
            return .failure(mapAPIError(error))
            
        } catch {
            return .failure(.unknown(error))
        }
    }
    
    /// Map API errors to user-friendly errors
    private func mapAPIError(_ error: GenerationAPIError) -> GenerationError {
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
}`} 
        filename="GenerationErrorHandling.swift"
        language="swift"
      />

      <DocHeading level={3}>Part 2: Error Types and Messages</DocHeading>
      <CodeBlock 
        code={`/// Generation error types
enum GenerationError: Error {
    case faceNotClear                    // Face image is not clear enough
    case invalidProduct                   // Product image is invalid
    case lowQualityResult(confidence: Float)  // Generated image quality is too low
    case generationFailed(reason: String)     // Generation failed for some reason
    case unknown(Error)                  // Unknown error
    
    /// What the DEVELOPER sees in console/logs
    var developerMessage: String {
        switch self {
        case .faceNotClear:
            return "❌ DEVELOPER ERROR: Face not detected in image - face image quality too low"
        case .invalidProduct:
            return "❌ DEVELOPER ERROR: Product image is invalid or corrupted"
        case .lowQualityResult(let confidence):
            return "⚠️ DEVELOPER WARNING: Generated image quality too low (confidence: \\(confidence))"
        case .generationFailed(let reason):
            return "❌ DEVELOPER ERROR: Generation failed - \\(reason)"
        case .unknown(let error):
            return "❌ DEVELOPER ERROR: Unknown generation error - \\(error)"
        }
    }
    
    /// What the USER sees in UI
    var userMessage: String {
        switch self {
        case .faceNotClear:
            return "Could not generate try-on. Please select a clearer photo with a visible face."
        case .invalidProduct:
            return "This product cannot be used for try-on generation. Please select a different product."
        case .lowQualityResult:
            return "Generated image quality is too low. Try selecting a different photo or product."
        case .generationFailed(let reason):
            return "Generation failed. Please try again with a different photo or product."
        case .unknown:
            return "An unexpected error occurred. Please try again."
        }
    }
    
    /// Suggested action for user
    var suggestedAction: String {
        switch self {
        case .faceNotClear:
            return "Select a different photo with a clearer face"
        case .invalidProduct:
            return "Select a different product"
        case .lowQualityResult:
            return "Try a different photo or product"
        case .generationFailed:
            return "Retry with different images"
        case .unknown:
            return "Contact support if problem persists"
        }
    }
}`} 
        filename="GenerationErrorHandling.swift"
        language="swift"
      />

      <DocHeading level={3}>Part 3: Error Handler Class</DocHeading>
      <CodeBlock 
        code={`/// Example: Complete error handling in UI
class GenerationErrorHandler {
    
    /// Handle generation error and show appropriate message
    func handleGenerationError(_ error: GenerationError) {
        // Log for developer
        print(error.developerMessage)
        
        // Show to user
        showErrorToUser(
            message: error.userMessage,
            action: error.suggestedAction
        )
    }
    
    /// Show error in UI
    private func showErrorToUser(message: String, action: String) {
        // Show alert or error view to user
        print("USER SEES: \\(message)")
        print("SUGGESTED ACTION: \\(action)")
    }
}`} 
        filename="GenerationErrorHandling.swift"
        language="swift"
      />

      <DocList items={[
        'Always provide actionable error messages to users',
        'Implement retry logic for transient failures',
        'Offer alternative photo selection when quality is insufficient',
        'Log detailed errors for debugging while showing simple messages to users',
      ]} />

      <DocHeading level={2} id="furniture-generation">Step 3: Generation of Personalization Results (Furniture)</DocHeading>
      <DocParagraph>
        Similar to fashion, but for furniture. After you have:
      </DocParagraph>
      <DocList items={[
        '✅ Best room images (living room, bedroom, dining room) from Room Analysis',
        '✅ Furniture product images from vendor site (e.g., IKEA)',
      ]} />
      <DocParagraph>
        You can <strong>generate room visualizations</strong> showing furniture in the user's rooms.
      </DocParagraph>

      <DocParagraph>
        <strong>How it works:</strong>
      </DocParagraph>
      <DocList items={[
        '1. Take the best living room image',
        '2. Take a sofa product image from vendor site',
        '3. Pass both images + product category to the generation API',
        '4. API returns a generated image showing the sofa in the living room',
        '5. Similarly: best bedroom image + bed product = bed in bedroom',
      ]} />

      <DocParagraph>
        Here's what the code below does, step by step:
      </DocParagraph>
      <DocList items={[
        '1. Validate compatibility: Check that furniture category is compatible with room type (e.g., don\'t put bed in kitchen)',
        '2. Prepare room image: Load best room image, resize to 1024×1024, convert to JPEG data',
        '3. Prepare furniture image: Resize furniture product image to 1024×1024, convert to JPEG data',
        '4. Create API request: Combine room image data, furniture image URL, room type, and category into request',
        '5. Call generation API: Send request to room visualization API endpoint',
        '6. Get response: Receive generated image URL showing furniture placed in the room',
        '7. Return result: Return RoomVisualizationResult with URL and furniture placement bounds',
      ]} />

      <DocHeading level={3}>Part 1: Main Generation Function</DocHeading>
      <CodeBlock 
        code={`import Foundation
import UIKit

/// Generate furniture visualization in rooms
class FurnitureGenerationService {
    private let apiClient: GenerationAPIClient
    
    /// Generate room visualization
    /// Input: Best room image + Furniture product image + Category
    /// Output: Generated image showing furniture in the room
    func generateRoomVisualization(
        bestRoom: SelectedRoom,        // Best room from room analysis
        furniture: ProductWithImage,    // Furniture product image from vendor
        category: String                // "sofa", "bed", "dining_table", etc.
    ) async throws -> RoomVisualizationResult {
        
        // Step 1: Validate room-furniture compatibility
        guard isCompatible(room: bestRoom.roomType, furniture: furniture) else {
            throw GenerationError.incompatibleRoomFurniture(
                "Cannot place \\(category) in \\(bestRoom.roomType)"
            )
        }
        
        // Step 2: Prepare room image
        guard let roomImageData = try? await prepareRoomImage(bestRoom) else {
            throw GenerationError.roomImagePreparationFailed
        }
        
        // Step 3: Prepare furniture image
        guard let furnitureImageData = try? await prepareFurnitureImage(furniture) else {
            throw GenerationError.furnitureImagePreparationFailed
        }
        
        // Step 4: Create API request
        let request = RoomVisualizationRequest(
            roomImageData: roomImageData,
            furnitureImageURL: furniture.imageURL,
            roomType: bestRoom.roomType,
            category: category
        )
        
        // Step 5: Call generation API
        let response = try await apiClient.generateRoomVisualization(request)
        
        // Step 6: Return the generated image
        return RoomVisualizationResult(
            visualizedImageURL: response.resultURL,
            furnitureBounds: response.placedFurnitureBounds,
            processingTime: response.processingTime
        )
    }`} 
        filename="FurnitureGenerationService.swift"
        language="swift"
      />

      <DocHeading level={3}>Part 2: Compatibility Check and Image Preparation</DocHeading>
      <CodeBlock 
        code={`    /// Check if furniture is compatible with room type
    private func isCompatible(room: String, furniture: ProductWithImage) -> Bool {
        // Room-furniture compatibility mapping
        let compatibility: [String: [String]] = [
            "living_room": ["sofa", "coffee_table", "tv_stand", "armchair"],
            "bedroom": ["bed", "wardrobe", "nightstand", "dresser"],
            "kitchen": ["dining_table", "chairs", "cabinet"],
            "dining_room": ["dining_table", "chairs"],
            "bathroom": ["vanity", "mirror", "storage"]
        ]
        
        guard let allowedFurniture = compatibility[room] else {
            return false
        }
        
        // Check if furniture category is allowed in this room
        return allowedFurniture.contains(furniture.category)
    }
    
    /// Prepare room image for API
    private func prepareRoomImage(_ room: SelectedRoom) async throws -> Data {
        guard let image = try? await loadImage(assetId: room.assetId) else {
            throw GenerationError.roomImageLoadFailed
        }
        
        let resized = image.resized(to: CGSize(width: 1024, height: 1024))
        guard let data = resized.jpegData(compressionQuality: 0.9) else {
            throw GenerationError.imageEncodingFailed
        }
        
        return data
    }
    
    /// Prepare furniture image for API
    private func prepareFurnitureImage(_ furniture: ProductWithImage) async throws -> Data {
        let resized = furniture.image.resized(to: CGSize(width: 1024, height: 1024))
        guard let data = resized.jpegData(compressionQuality: 0.9) else {
            throw GenerationError.imageEncodingFailed
        }
        
        return data
    }
}`} 
        filename="FurnitureGenerationService.swift"
        language="swift"
      />

      <DocHeading level={3}>Part 3: Request/Response Structures</DocHeading>
      <CodeBlock 
        code={`/// Room visualization request
struct RoomVisualizationRequest: Codable {
    let roomImageData: Data      // Best room image
    let furnitureImageURL: URL   // Furniture product image URL
    let roomType: String         // "living_room", "bedroom", etc.
    let category: String         // "sofa", "bed", etc.
}

/// Room visualization result
struct RoomVisualizationResult {
    let visualizedImageURL: URL  // Generated image URL
    let furnitureBounds: CGRect  // Where furniture was placed in image
    let processingTime: TimeInterval
}

struct SelectedRoom {
    let assetId: String
    let roomType: String         // "living_room", "bedroom", "kitchen", "dining_room"
    let confidence: Float
}`} 
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
