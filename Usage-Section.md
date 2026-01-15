# Usage

Learn how to initialize the plugin and use the personalization service to analyze photos and discover the best assets for personalization.

The HyperPersonalization plugin provides powerful on-device machine learning capabilities to analyze your user's photo library, identify rooms (bedroom, living room, dining room) and people (male, female, kids), and help you deliver personalized product recommendations. This guide walks you through the complete setup and usage process.

## Initialization

Before you can use any plugin features, you need to import the framework and access the shared plugin instance. The plugin uses a singleton pattern, meaning there's one shared instance that manages all operations.

**Why use a shared instance?**
- Ensures consistent state across your app
- Manages resources efficiently
- Provides a single point of access for all plugin operations

Import the plugin and access the shared instance:

```swift
import AIModelOnDeviceplugin

let plugin = AIModelplugin.shared
```

**What happens here:**
- `import AIModelOnDeviceplugin` - Imports the plugin framework into your Swift file
- `AIModelplugin.shared` - Accesses the singleton instance that handles all plugin operations
- This instance is thread-safe and can be used throughout your app

**Where to initialize:**
- Typically done in your `AppDelegate` or `SceneDelegate`
- Can also be initialized in your main view controller or view model
- Only needs to be done once per app launch

## Run Personalization Service (Auto)

Automatically scan the photo library, cluster images, and find the best photos for personalization (e.g., best bedroom, best living room).

### Code Breakdown

**1. Create plugin Options**

```swift
let options = pluginOptions(
    personalizationType: .all,  // .homegoods, .fashion, or .all
    photoSelectionType: .auto
)
```

- Creates configuration options for the plugin
- `personalizationType: .all` — analyze both home goods (furniture) and fashion
- `photoSelectionType: .auto` — automatically scan the entire photo library

**2. Start the Task**

```swift
Task {
    await plugin.runPersonalizationService(...)
}
```

- Task runs async work
- await waits for the service to finish

**3. Call the Service**

```swift
await plugin.runPersonalizationService(
    pluginOptions: options,
    progress: { state in ... },
    completion: { result in ... }
)
```

- Passes the options
- progress callback reports progress updates
- completion callback handles the final result

**4. Progress Handler**

```swift
progress: { state in
    switch state {
    case .analyzing: print("Analyzing photos...")
    case .clustering: print("Clustering photos...")
    case .selectingBestPhoto: print("Selecting best photo...")
    case .tagging: print("Tagging photos...")
    case .complete: print("Complete!")
    case .error: print("Error occurred")
    }
}
```

- Receives progress updates as the plugin works
- States: analyzing → clustering → selecting best photos → tagging → complete (or error)

**5. Completion Handler**

```swift
completion: { result in
    switch result {
    case .success(let pluginResult):
        print("Success: \(pluginResult.message)")
        for asset in pluginResult.arrPersonalizeAsset {
            print("Found category: \(asset.validCategory.rawValue)")
            // asset.phAsset contains the PHAsset
        }
    case .failure(let error):
        print("Failed: \(error.localizedDescription)")
    }
}
```

- On success: prints the message and loops through discovered assets, printing each category
- On failure: prints the error description

**Summary**

- Configure options (what to analyze, auto vs manual)
- Start an async task
- Call the service with options
- Handle progress updates (analyzing, clustering, etc.)
- Handle the final result (success with assets, or failure with error)
- The plugin scans photos, finds the best ones for each category (bedroom, living room, male face, female face, etc.), and returns them in `pluginResult.arrPersonalizeAsset`

### Complete Code Example

```swift
let options = pluginOptions(
    personalizationType: .all,  // .homegoods, .fashion, or .all
    photoSelectionType: .auto
)

Task {
    await plugin.runPersonalizationService(
        pluginOptions: options,
        progress: { state in
            // Handle progress updates
            switch state {
            case .analyzing:
                print("Analyzing photos...")
            case .clustering:
                print("Clustering photos...")
            case .selectingBestPhoto:
                print("Selecting best photo...")
            case .tagging:
                print("Tagging photos...")
            case .complete:
                print("Complete!")
            case .error:
                print("Error occurred")
            }
        },
        completion: { result in
            switch result {
            case .success(let pluginResult):
                print("Success: \(pluginResult.message)")
                // Access discovered assets
                for asset in pluginResult.arrPersonalizeAsset {
                    print("Found category: \(asset.validCategory.rawValue)")
                    // asset.phAsset contains the PHAsset
                }
            case .failure(let error):
                print("Failed: \(error.localizedDescription)")
            }
        }
    )
}
```

## Run Personalization Service (Manual)

If you have a specific set of PHAsset objects you want to analyze:

### Code Breakdown

**1. Prepare your selected assets**

```swift
let assets: [PHAsset] = ... // Your selected assets
```

- You provide a specific array of PHAsset objects
- Instead of scanning the entire photo library, you choose which photos to analyze
- Example: photos from a specific album, user-selected photos, or photos from a certain date range

**2. Start the Task**

```swift
Task {
    await plugin.runPersonalizationServiceWith(...)
}
```

- Task runs the async work
- await waits for the service to finish

**3. Call the Manual Service**

```swift
await plugin.runPersonalizationServiceWith(
    pluginOptions: options,
    arrPHAssets: assets,
    progress: { state in ... },
    completion: { result in ... }
)
```

- Uses `runPersonalizationServiceWith` instead of `runPersonalizationService`
- `arrPHAssets: assets` passes your selected photos
- `pluginOptions: options` uses the same configuration (personalizationType, etc.)
- progress callback reports progress updates
- completion callback handles the final result

**4. Progress Handler**

```swift
progress: { state in
    print("State: \(state)")
}
```

- Receives progress updates as the plugin processes your selected photos
- States: analyzing → clustering → selecting best photo → tagging → complete (or error)

**5. Completion Handler**

```swift
completion: { result in
    // Handle result
}
```

- On success: result contains the discovered assets
- On failure: result contains the error information

**Differences from Auto mode**

| Auto Mode | Manual Mode |
|-----------|-------------|
| Scans entire photo library | Only analyzes photos you provide |
| `runPersonalizationService` | `runPersonalizationServiceWith` |
| No `arrPHAssets` parameter | Requires `arrPHAssets` parameter |

**When to use manual mode**

- User selects specific photos
- Analyzing photos from a specific album
- Processing photos from a date range
- Testing with a small set of photos
- Analyzing photos from a custom picker

### Complete Code Example

```swift
let assets: [PHAsset] = ... // Your selected assets

Task {
    await plugin.runPersonalizationServiceWith(
        pluginOptions: options,
        arrPHAssets: assets,
        progress: { state in
            print("State: \(state)")
        },
        completion: { result in
            // Handle result
        }
    )
}
```


