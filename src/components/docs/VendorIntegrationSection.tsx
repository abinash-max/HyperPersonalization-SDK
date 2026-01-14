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
      <DocHeading level={1}>Image Generation</DocHeading>
      <DocParagraph>
        This section covers integrating e-commerce vendor products with HyperPersonalization for 
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

      <DocHeading level={2} id="fashion-generation">Fashion Generation (Virtual Try-On)</DocHeading>
      <DocParagraph>
        Visualize how a garment looks on a real user by generating a <strong>virtual try-on image</strong> that combines the user photo and the garment image.
      </DocParagraph>
      <DocParagraph>
        This feature is typically used <strong>after personalization and human analysis</strong>, when you already have a high-quality user image and a product image URL.
      </DocParagraph>

      <DocHeading level={3}>What this feature does (in one sentence)</DocHeading>
      <DocParagraph>
        <strong>Given a user photo, a garment product image URL, and a product type, the SDK generates a combined image showing the user wearing the selected garment — or fails with a clear error.</strong>
      </DocParagraph>

      <DocHeading level={3}>When to use Fashion Generation</DocHeading>
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

      <DocHeading level={3}>Core API</DocHeading>
      <DocHeading level={4}>generateFashion(...)</DocHeading>
      <DocParagraph>
        This is the primary function used to generate a fashion try-on image.
      </DocParagraph>
      <CodeBlock
        language="swift"
        filename="FashionGeneration.swift"
        code={`sdk.generateFashion(
    thumbnailImg: userPhotoImage,     // UIImage of the user
    garmentImageUrl: "https://example.com/shirt.jpg", // URL of the garment image
    productType: "upper_body",        // "upper_body", "lower_body", "dresses"
    completion: { result in
        // Handle the result
    }
)`}
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
        'Description: A publicly accessible URL pointing to the garment product image that should be tried on.',
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
        '"upper_body" — shirts, t-shirts, jackets, tops',
        '"lower_body" — pants, jeans, skirts, shorts',
        '"dresses" — dresses, gowns, one-piece garments',
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
        'Call generateFashion(): The SDK downloads the garment image, Analyzes the user photo (detects face/body), Places the garment on the user, Generates a combined image',
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
sdk.generateFashion(
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

      <DocHeading level={3}>What the SDK handles automatically</DocHeading>
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

      <DocHeading level={3}>Typical placement in the SDK pipeline</DocHeading>
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

      <DocHeading level={2} id="furniture-generation">Furniture Generation (Room Visualization)</DocHeading>
      <DocParagraph>
        Place a furniture item into a real room image to generate a <strong>virtual room visualization</strong> that shows how the product looks in the user's space.
      </DocParagraph>
      <DocParagraph>
        This feature is typically used <strong>after room analysis</strong>, when you already have a classified room image and a furniture product image URL.
      </DocParagraph>

      <DocHeading level={3}>What this feature does (in one sentence)</DocHeading>
      <DocParagraph>
        <strong>Given a room photo, a room type, and a furniture product image URL, the SDK generates a combined image showing the furniture placed inside the room — or fails with a clear error.</strong>
      </DocParagraph>

      <DocHeading level={3}>When to use Furniture Generation</DocHeading>
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

      <DocHeading level={3}>Core API</DocHeading>
      <DocHeading level={4}>generateFurniture(...)</DocHeading>
      <DocParagraph>
        This is the primary function used to generate a furniture visualization inside a room image.
      </DocParagraph>
      <CodeBlock
        language="swift"
        filename="FurnitureGeneration.swift"
        code={`sdk.generateFurniture(
    thumbnailImg: userRoomImage,      // UIImage of the room
    roomType: "living_room",          // "bedroom", "living_room", "dining_room"
    objectUrl: "https://example.com/sofa.jpg", // URL of the furniture product image
    completion: { result in
        // Handle the result
    }
)`}
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
        'Description: A publicly accessible URL pointing to the furniture product image that should be placed into the room.',
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
        'Call generateFurniture(): The SDK downloads the furniture image, Analyzes the room image, Places the furniture in the room, Generates a combined image',
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
sdk.generateFurniture(
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

      <DocHeading level={3}>What the SDK handles automatically</DocHeading>
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

      <DocHeading level={3}>Typical placement in the SDK pipeline</DocHeading>
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
