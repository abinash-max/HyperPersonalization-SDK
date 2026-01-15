# Fashion Generation (Virtual Try-On)

Visualize how a garment looks on a real user by generating a **virtual try-on image** that combines the user photo and the garment image.

This feature is typically used **after personalization and human analysis**, when you already have a high-quality user image and a product image URL.

---

## What this feature does (in one sentence)

**Given a user photo, a garment product image URL, and a product type, the plugin generates a combined image showing the user wearing the selected garment — or fails with a clear error.**

---

## When to use Fashion Generation

Use this API when:

- You already have a **best-quality user image** (face/body)
- You want to visualize a **specific garment** on that user
- You want to display a **realistic try-on result** inside your app

Typical use cases:

- Virtual try-on experiences
- Product preview before purchase
- Personalized shopping journeys

---

## Core API

### `generateFashion(...)`

This is the primary function used to generate a fashion try-on image.

```swift
plugin.generateFashion(
    thumbnailImg: userPhotoImage,     // UIImage of the user
    garmentImageUrl: "https://example.com/shirt.jpg", // URL of the garment image
    productType: "upper_body",        // "upper_body", "lower_body", "dresses"
    completion: { result in
        // Handle the result
    }
)
```

---

## Parameters explained

### `thumbnailImg`

- **Type:** `UIImage`
- **Description:**  
  The user’s photo showing their face or body.  
  This image is typically selected from earlier personalization or human analysis phases.

---

### `garmentImageUrl`

- **Type:** `String`
- **Description:**  
  A publicly accessible URL pointing to the garment product image that should be tried on.

---

### `productType`

- **Type:** `String`
- **Description:**  
  Specifies the category of clothing being applied.

Supported values:

- `"upper_body"` — shirts, t-shirts, jackets, tops
- `"lower_body"` — pants, jeans, skirts, shorts
- `"dresses"` — dresses, gowns, one-piece garments

---

### `completion`

- **Type:** `(Result<ImageResult, Error>) -> Void`
- **Description:**  
  Callback invoked once the generation process finishes, either successfully or with an error.

---

## Result handling

### Success case

```swift
case .success(let imageResult):
    if let generatedImage = imageResult.resultImage {
        imageView.image = generatedImage
    }
```

**What happens:**

- The generation succeeds
- `imageResult` contains the output
- `imageResult.resultImage` is the final combined image
- Assign it directly to an `UIImageView` for display

---

### Failure case

```swift
case .failure(let error):
    print("Generation failed: \(error)")
```

**What happens:**

- The generation process fails
- An error is returned
- You should display an appropriate error message or retry option in your UI

---

## Step-by-step flow

1. **Prepare inputs**
   - A user photo (`UIImage`)
   - A garment product image URL
   - A valid product type

2. **Call `generateFashion()`**
   - The plugin downloads the garment image
   - Analyzes the user photo (detects face/body)
   - Places the garment on the user
   - Generates a combined image

3. **Receive result**
   - **Success:** Access and display the generated image
   - **Failure:** Handle and surface the error

---

## Complete example (recommended integration pattern)

```swift
// Step 1: You have a user photo from Phase 4 (Human Analysis)
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
            print("❌ Generation failed: \(error)")
            showError("Could not generate try-on. Please try again.")
        }
    }
)
```

---

## Product type reference

| Product Type | Description                        |
|-------------|------------------------------------|
| `upper_body` | Shirts, t-shirts, jackets, tops    |
| `lower_body` | Pants, jeans, skirts, shorts       |
| `dresses`   | Dresses, gowns, one-piece garments |

---

## What the plugin handles automatically

- Garment image download
- User photo analysis
- Garment placement and alignment
- Image generation and blending

You only need to provide:
- User image
- Garment image URL
- Product type

---

## Typical placement in the plugin pipeline

This feature is usually used **after**:

- **Phase 4:** Human Analysis  
  (You already have the best user images)

- **Phase 5:** Vendor Integration  
  (You already have product image URLs)

---

## Summary

- Provide a user photo, garment image URL, and product type
- Call `generateFashion()`
- Receive a generated try-on image or an error
- Display the result in your UI

This API enables **real-time, personalized fashion visualization** with minimal integration effort.

