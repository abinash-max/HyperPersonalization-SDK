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

      <DocHeading level={2} id="fashion-generation">4. Generate Fashion Try-On</DocHeading>
      <DocParagraph>
        Visualize a garment on a user.
      </DocParagraph>

      <DocHeading level={3}>Code Breakdown</DocHeading>

      <DocParagraph>
        <strong>1. Call the Generation Function</strong>
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
      <DocList items={[
        'thumbnailImg: userPhotoImage — The user\'s photo (UIImage) showing their face/body',
        'garmentImageUrl: "https://example.com/shirt.jpg" — URL of the clothing product image to try on',
        'productType: "upper_body" — Type of clothing: "upper_body", "lower_body", or "dresses"',
        'completion: { result in ... } — Callback that receives the result',
      ]} />

      <DocParagraph>
        <strong>2. Handle Success Result</strong>
      </DocParagraph>
      <CodeBlock
        language="swift"
        filename="FashionGeneration.swift"
        code={`case .success(let imageResult):
    if let generatedImage = imageResult.resultImage {
        // Display the generated image
        imageView.image = generatedImage
    }`}
      />
      <DocList items={[
        'If generation succeeds, imageResult contains the result',
        'imageResult.resultImage is the combined image (user + garment)',
        'Assign it to imageView.image to display',
      ]} />

      <DocParagraph>
        <strong>3. Handle Failure Result</strong>
      </DocParagraph>
      <CodeBlock
        language="swift"
        filename="FashionGeneration.swift"
        code={`case .failure(let error):
    print("Generation failed: \\(error)")`}
      />
      <DocList items={[
        'If generation fails, handle the error',
        'Print or show an error message to the user',
      ]} />

      <DocHeading level={3}>Step-by-step flow</DocHeading>
      <DocList items={[
        'Prepare inputs: User photo (userPhotoImage), Garment product image URL ("https://example.com/shirt.jpg"), Product type ("upper_body")',
        'Call generateFashion(): SDK downloads the garment image from the URL, Analyzes the user photo (detects face/body), Places the garment on the user, Generates a combined image',
        'Receive result: Success: Get the generated image and display it, Failure: Handle the error',
      ]} />

      <DocHeading level={3}>Complete example with context</DocHeading>
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
                // Success! Show the user wearing the shirt
                imageView.image = generatedImage
                print("✅ Fashion try-on generated!")
            } else {
                print("⚠️ No image returned")
            }
            
        case .failure(let error):
            // Handle errors
            print("❌ Generation failed: \\(error)")
            // Show error message to user
            showError("Could not generate try-on. Please try again.")
        }
    }
)`}
      />

      <DocHeading level={3}>Product types</DocHeading>
      <DocList items={[
        '"upper_body" — Shirts, t-shirts, jackets, tops',
        '"lower_body" — Pants, jeans, skirts, shorts',
        '"dresses" — Dresses, gowns, one-piece garments',
      ]} />

      <DocHeading level={3}>What this does</DocHeading>
      <DocList items={[
        'Takes a user photo (face/body)',
        'Takes a garment product image URL',
        'Combines them to show the garment on the user',
        'Returns a new image showing the result',
      ]} />

      <DocHeading level={3}>Use cases</DocHeading>
      <DocList items={[
        'Virtual try-on: Show how a shirt looks on the user',
        'Product visualization: Help users see products on themselves',
        'Shopping experience: Let users try on items before buying',
      ]} />

      <DocHeading level={3}>Summary</DocHeading>
      <DocList items={[
        'Provide user photo, garment product URL, and product type',
        'SDK generates a combined image',
        'Display the result or handle errors',
      ]} />

      <DocParagraph>
        This is typically used after:
      </DocParagraph>
      <DocList items={[
        'Phase 4: You\'ve analyzed faces and have best face images (male/female/kids)',
        'Phase 5: You\'ve integrated vendor products and have product URLs',
      ]} />

      <DocParagraph>
        The SDK handles the image processing and garment placement automatically.
      </DocParagraph>

      <DocHeading level={2} id="furniture-generation">3. Generate Furniture Visualization</DocHeading>
      <DocParagraph>
        Place a furniture item into a room image.
      </DocParagraph>

      <DocHeading level={3}>Code Breakdown</DocHeading>

      <DocParagraph>
        <strong>1. Call the Generation Function</strong>
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
      <DocList items={[
        'thumbnailImg: userRoomImage — The room photo (UIImage) where furniture will be placed',
        'roomType: "living_room" — Room type: "bedroom", "living_room", or "dining_room"',
        'objectUrl: "https://example.com/sofa.jpg" — URL of the furniture product image to place',
        'completion: { result in ... } — Callback that receives the result',
      ]} />

      <DocParagraph>
        <strong>2. Handle Success Result</strong>
      </DocParagraph>
      <CodeBlock
        language="swift"
        filename="FurnitureGeneration.swift"
        code={`case .success(let imageResult):
    if let generatedImage = imageResult.resultImage {
        // Display the generated image
        imageView.image = generatedImage
    }`}
      />
      <DocList items={[
        'If generation succeeds, imageResult contains the result',
        'imageResult.resultImage is the combined image (room + furniture)',
        'Assign it to imageView.image to display',
      ]} />

      <DocParagraph>
        <strong>3. Handle Failure Result</strong>
      </DocParagraph>
      <CodeBlock
        language="swift"
        filename="FurnitureGeneration.swift"
        code={`case .failure(let error):
    print("Generation failed: \\(error)")`}
      />
      <DocList items={[
        'If generation fails, handle the error',
        'Print or show an error message to the user',
      ]} />

      <DocHeading level={3}>Step-by-step flow</DocHeading>
      <DocList items={[
        'Prepare inputs: Room image (userRoomImage), Room type ("living_room"), Furniture product image URL ("https://example.com/sofa.jpg")',
        'Call generateFurniture(): SDK downloads the furniture image from the URL, Analyzes the room image, Places the furniture in the room, Generates a combined image',
        'Receive result: Success: Get the generated image and display it, Failure: Handle the error',
      ]} />

      <DocHeading level={3}>Complete example with context</DocHeading>
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
                // Success! Show the user their room with the sofa placed in it
                imageView.image = generatedImage
                print("✅ Furniture visualization generated!")
            } else {
                print("⚠️ No image returned")
            }
            
        case .failure(let error):
            // Handle errors
            print("❌ Generation failed: \\(error)")
            // Show error message to user
            showError("Could not generate visualization. Please try again.")
        }
    }
)`}
      />

      <DocHeading level={3}>What this does</DocHeading>
      <DocList items={[
        'Takes a room photo (e.g., living room)',
        'Takes a furniture product image URL (e.g., sofa)',
        'Combines them to show the furniture placed in the room',
        'Returns a new image showing the result',
      ]} />

      <DocHeading level={3}>Use cases</DocHeading>
      <DocList items={[
        'Virtual furniture placement: Show how a sofa looks in the user\'s living room',
        'Product visualization: Help users visualize products in their space',
        'Shopping experience: Let users see products in their rooms before buying',
      ]} />

      <DocHeading level={3}>Summary</DocHeading>
      <DocList items={[
        'Provide room image, room type, and furniture product URL',
        'SDK generates a combined image',
        'Display the result or handle errors',
      ]} />

      <DocParagraph>
        This is typically used after:
      </DocParagraph>
      <DocList items={[
        'Phase 3: You\'ve classified rooms and have room images',
        'Phase 5: You\'ve integrated vendor products and have product URLs',
      ]} />

      <DocParagraph>
        The SDK handles the image processing and placement automatically.
      </DocParagraph>
    </DocSection>
  );
};
