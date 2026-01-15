# Furniture Generation (Room Visualization)

Place a furniture item into a real room image to generate a **virtual room visualization** that shows how the product looks in the user’s space.

This feature is typically used **after room analysis**, when you already have a classified room image and a furniture product image URL.

---

## What this feature does (in one sentence)

**Given a room photo, a room type, and a furniture product image URL, the plugin generates a combined image showing the furniture placed inside the room — or fails with a clear error.**

---

## When to use Furniture Generation

Use this API when:

- You already have a **room image** (living room, bedroom, dining room)
- You want to visualize a **specific furniture item** in that room
- You want to display a **realistic in-room placement preview** inside your app

Typical use cases:

- Virtual furniture placement
- Product visualization before purchase
- Personalized home shopping experiences

---

## Core API

### `generateFurniture(...)`

This is the primary function used to generate a furniture visualization inside a room image.

```swift
plugin.generateFurniture(
    thumbnailImg: userRoomImage,      // UIImage of the room
    roomType: "living_room",          // "bedroom", "living_room", "dining_room"
    objectUrl: "https://example.com/sofa.jpg", // URL of the furniture product image
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
  The room photo where the furniture item will be placed.
  This image typically comes from earlier room analysis or classification.

---

### `roomType`

- **Type:** `String`
- **Description:**  
  Specifies the type of room shown in the image.

Supported values:

- `"bedroom"`
- `"living_room"`
- `"dining_room"`

---

### `objectUrl`

- **Type:** `String`
- **Description:**  
  A publicly accessible URL pointing to the furniture product image that should be placed into the room.

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
- `imageResult.resultImage` is the final combined image (room + furniture)
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
   - A room image (`UIImage`)
   - A room type (`"bedroom"`, `"living_room"`, or `"dining_room"`)
   - A furniture product image URL

2. **Call `generateFurniture()`**
   - The plugin downloads the furniture image
   - Analyzes the room image
   - Places the furniture in the room
   - Generates a combined image

3. **Receive result**
   - **Success:** Access and display the generated image
   - **Failure:** Handle and surface the error

---

## Complete example (recommended integration pattern)

```swift
// Step 1: You have a room image from Phase 3 (Room Analysis)
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
            print("❌ Generation failed: \(error)")
            showError("Could not generate visualization. Please try again.")
        }
    }
)
```

---

## What the plugin handles automatically

- Furniture image download
- Room image analysis
- Furniture placement and alignment
- Image generation and blending

You only need to provide:
- Room image
- Room type
- Furniture product image URL

---

## Typical placement in the plugin pipeline

This feature is usually used **after**:

- **Phase 3:** Room Analysis  
  (You already have classified room images)

- **Phase 5:** Vendor Integration  
  (You already have product image URLs)

---

## Summary

- Provide a room image, room type, and furniture product URL
- Call `generateFurniture()`
- Receive a generated visualization image or an error
- Display the result in your UI

This API enables **real-time, personalized furniture visualization** with minimal integration effort.