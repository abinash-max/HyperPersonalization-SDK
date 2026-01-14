# HyperPersonalization iOS SDK Documentation (Swift)

Personalize your **entire e-commerce inventory** using the customer’s real photos — without making them manually pick “the perfect selfie” or “the perfect room shot”.

The SDK scans the user’s photo library (or a subset the user allows), identifies **high-quality, relevant images** for the selected personalization domains, and returns **the best candidate assets** to power downstream experiences like Virtual Try-On, room placement, cosmetics try-on, accessories try-on, and more.

---

## What this SDK does (in one sentence)

**Given a personalization goal (fashion/home goods/etc.) and a photo access strategy (auto/manual), the SDK analyzes photos in parallel, clusters and ranks them, and returns the best photo assets per required category — or fails with a clear, developer-friendly error when requirements can’t be met.**

---

## Supported personalization domains

The SDK supports these domains (your app chooses what to enable):

* **Fashion** (e.g., male/female face/person images, outfit-friendly shots)
* **Home goods** (e.g., bedroom/living room-friendly images)
* **Shoes**
* **Cosmetics**
* **Jewellery**
* **Accessories** (bags, glasses, etc.)
* **All** (a convenience option when your catalog spans multiple domains)

> **Important behavior:** Some domains have *minimum requirements*.
> Example: If you choose **fashion** and the scan cannot find a suitable **male** or **female** image (depending on your category rules), the SDK returns a failure (an exception/error) instead of silently returning weak results.

---

## Core concepts

### 1) `personalizationType` (what you want)

This decides:

* Which domain classifiers and selection rules are used
* Which categories are considered “required” vs “optional”
* The minimum set of “suitable” images needed to return a successful result

Typical choices:

* `.fashion`
* `.homegoods`
* `.all` (use when you have multiple categories and want one scan)

**How it changes behavior**

* `.fashion` focuses on people/face/person-quality selection rules
* `.homegoods` focuses on indoor/scene selection rules (rooms/lighting/clarity)
* `.all` runs a broader pipeline (more work, broader return set)

---

### 2) `photoSelectionType` (where photos come from)

This decides *how the SDK gets images to analyze*.

* `.auto`
  The SDK scans the **user-accessible** photo library automatically.

  * If the user grants **Full Access**: the SDK can scan the entire library.
  * If the user grants **Limited Access**: iOS only exposes the selected items; the SDK scans only what it can see.

* Manual scanning (developer-provided `PHAsset[]`)
  For album/folder scope, limited sets, custom pickers, or explicit user selection, you provide `PHAsset` items and call the manual API.

> Practical mapping:
>
> * **Full gallery access** → `.auto`
> * **Limited access** → `.auto` (but results depend on what iOS exposes)
> * **Album / folder / user-selected set** → use the manual API with `PHAsset[]`

---

### 3) Pipeline stages (what “progress” means)

The SDK reports states such as:

* `analyzing` → reading metadata + running model inference
* `clustering` → grouping similar images, removing near-duplicates
* `selectingBestPhoto` → ranking + choosing best candidates per category
* `tagging` → attaching categories/labels to final candidates
* `complete` → finished successfully
* `error` → an error occurred (the completion result will indicate failure)

> Treat progress states as **stage indicators**, not as a strict percentage.

---

## Quickstart

### Step 0 — Import and get the shared instance

```swift
import AIModelOnDeviceSDK

let sdk = AIModelSDK.shared
```

---

### Step 1 — Create `SDKOptions`

```swift
let options = SDKOptions(
    personalizationType: .all,   // .fashion, .homegoods, .all, etc.
    photoSelectionType: .auto    // .auto for library scan
)
```

#### How these parameters work together

* `personalizationType` defines **what “good” means** (rules + required categories)
* `photoSelectionType` defines **what photos are available** to meet those requirements

So:

* `.fashion + .auto` = scan user’s accessible library looking for fashion-suitable images
* `.homegoods + manual assets` = only evaluate photos you provide (e.g., an “Apartment” album)

---

### Step 2 — Run Auto scan

```swift
Task {
    await sdk.runPersonalizationService(
        sdkOptions: options,
        progress: { state in
            switch state {
            case .analyzing: print("Analyzing photos...")
            case .clustering: print("Clustering photos...")
            case .selectingBestPhoto: print("Selecting best photo...")
            case .tagging: print("Tagging photos...")
            case .complete: print("Complete!")
            case .error: print("Error occurred")
            }
        },
        completion: { result in
            switch result {
            case .success(let sdkResult):
                print("Success: \(sdkResult.message)")
                for asset in sdkResult.arrPersonalizeAsset {
                    print("Category: \(asset.validCategory.rawValue)")
                    // asset.phAsset is the selected PHAsset
                }

            case .failure(let error):
                print("Failed: \(error.localizedDescription)")
            }
        }
    )
}
```

---

## API Reference

## `AIModelSDK`

### `shared`

```swift
let sdk = AIModelSDK.shared
```

A singleton instance used to run personalization tasks.

**Why singleton?**
This typically ensures model/session resources are reused efficiently and avoids repeated initialization overhead.

---

### `runPersonalizationService(sdkOptions:progress:completion:)` — Auto scan

**Use when:** You want the SDK to scan the user-accessible photo library automatically.

```swift
await sdk.runPersonalizationService(
    sdkOptions: SDKOptions,
    progress: (PersonalizationState) -> Void,
    completion: (Result<SDKResult, Error>) -> Void
)
```

#### Parameters

* `sdkOptions`

  * `personalizationType`: chooses domain rules and required categories
  * `photoSelectionType`: must be `.auto` for this method

* `progress`

  * Called multiple times as the pipeline advances.
  * **Do not** assume it runs on the main thread. If you update UI, dispatch to main.

* `completion`

  * Called once with either:

    * `.success(SDKResult)`
    * `.failure(Error)`

#### Expected behavior

* The SDK may analyze in parallel internally.
* If requirements for the selected domain cannot be satisfied (e.g., fashion requires a suitable person image and none exist), the result is `.failure(...)`.

---

### `runPersonalizationServiceWith(sdkOptions:arrPHAssets:progress:completion:)` — Manual scan

**Use when:** You want full control over which photos are analyzed (album/folder/user-picked/limited set/testing).

```swift
await sdk.runPersonalizationServiceWith(
    sdkOptions: SDKOptions,
    arrPHAssets: [PHAsset],
    progress: (PersonalizationState) -> Void,
    completion: (Result<SDKResult, Error>) -> Void
)
```

#### Parameters

* `sdkOptions`

  * Same meaning as auto mode.
  * For manual runs, set `photoSelectionType` to your “manual” intent (if applicable in your SDK design) or keep consistent with your integration contract.

* `arrPHAssets`

  * The exact photos the SDK will analyze.
  * Useful for:

    * “Select an album”
    * “Pick 10 photos”
    * “Scan only last 90 days”
    * “Scan only room photos”

* `progress` / `completion`

  * Same behavior as auto mode.

#### What happens if `arrPHAssets` is empty?

A well-behaved integration should treat it as a failure (“no inputs”). Your SDK’s error should communicate this clearly (see “Errors” below).

---

## Data model (what you get back)

### `SDKResult`

Returned on success.

Common fields shown in your current implementation:

* `message: String`
  Human-readable success message (useful for logs/debug; don’t rely on exact wording).

* `arrPersonalizeAsset: [PersonalizeAsset]`
  The selected best assets for personalization, per recognized category.

---

### `PersonalizeAsset`

Each item generally contains:

* `validCategory`
  An enum (or string-backed enum) that tells you what the asset is best suited for
  (e.g., bedroom, living room, male face, female face, etc.)

* `phAsset: PHAsset`
  A Photos framework reference. You can later fetch image data via Photos APIs in your app.

> Tip: For persistence, store `PHAsset.localIdentifier` rather than the `PHAsset` object itself.

---

## Photo access strategies in real apps

### A) Full library scan (Auto mode)

Best onboarding experience for “set it and forget it”.

* Ask for photo access once (with a clear explanation)
* Run `.auto`
* Store results for reuse

### B) Limited library access (Auto mode)

If the user selects “Limited Access”, iOS only reveals what the user selected.

* The SDK will scan only what it can see
* If there aren’t enough suitable photos, you may get a failure like:

  * “Insufficient photos for fashion” / “No suitable assets found”
* Your UI should let users:

  * Add more photos to the allowed set, or
  * Switch to manual selection

### C) Album/folder scanning (Manual mode)

Use manual mode to scan photos from a specific album or a custom picker.

High-level flow:

1. Your app collects `PHAsset[]` from an album/picker
2. Call `runPersonalizationServiceWith(...)`

---

## Errors & exceptions

Your current integration returns errors via:

```swift
completion: { result in
  switch result {
    case .success(...)
    case .failure(let error)
  }
}
```

That `.failure(error)` is where developers must branch by error type and present the right UX.

### Error categories you should document (recommended)

Even if your internal implementation differs, your SDK docs should clearly communicate *what can fail and why*. Common categories:

1. **Permission / access errors**

* Photo library permission denied/restricted
* Limited access provides too few relevant photos

2. **Insufficient suitable images**

* Requested domain requires specific categories that were not found

  * Example: `.fashion` selected, but no suitable male/female/person images found

3. **Invalid input (manual mode)**

* Empty asset list
* Unsupported asset types / corrupted items
* Assets not accessible due to iOS permission scope

4. **Task cancellation**

* User navigates away
* Developer cancels the Task

5. **Internal / model errors**

* Model resources unavailable
* Unexpected runtime failure

### Recommended: expose a typed error (best developer experience)

If you can, define a public error type (example shape):

* `SDKError.permissionDenied`
* `SDKError.insufficientAssets(missing: [RequiredCategory])`
* `SDKError.noSuitableImagesFound(personalizationType: ...)`
* `SDKError.invalidInput(reason: ...)`
* `SDKError.cancelled`
* `SDKError.internalError(underlying: Error?)`

Then developers can do:

```swift
if let sdkError = error as? SDKError {
   switch sdkError { ... }
}
```

### UX guidance for “insufficient images”

When the SDK fails because it can’t find required image types:

* **Don’t show a generic “Something went wrong”**
* Explain what’s missing in user language:

  * “We couldn’t find a clear face photo for try-on.”
  * “Please allow more photos or pick a few selfies.”

---

## Best practices (to help devs succeed)

### 1) Run once, reuse many times

Personalization selection is expensive compared to reusing results.

Recommended flow:

* Run scan at onboarding / first use
* Store selected asset identifiers
* Re-run only when:

  * user changes permissions
  * user wants to refresh personalization
  * results are missing for a newly enabled category

### 2) Always show progress

Even simple stage updates reduce perceived latency:

* “Analyzing…”
* “Finding the best photos…”
* “Finalizing…”

### 3) Treat `.all` as broader + slower

Use `.all` when your storefront truly spans multiple domains.
If your app is single-domain, prefer a specific type to reduce time and failure surface area.

### 4) Handle limited access explicitly

Limited access is common. Build a graceful fallback:

* If failure due to insufficient images:

  * offer “Allow more photos”
  * offer “Select photos manually”

### 5) UI thread safety

Unless your SDK guarantees main-thread callbacks, assume:

* `progress` and `completion` may arrive on background threads
* Dispatch UI changes to the main queue

---

## Practical integration examples

### Example 1 — Fashion-only app (Auto scan)

```swift
let options = SDKOptions(
    personalizationType: .fashion,
    photoSelectionType: .auto
)

Task {
    await sdk.runPersonalizationService(
        sdkOptions: options,
        progress: { state in
            print("State:", state)
        },
        completion: { result in
            switch result {
            case .success(let sdkResult):
                // Save selected assets for try-on
                print(sdkResult.arrPersonalizeAsset.count)

            case .failure(let error):
                // If this is "insufficient images", prompt user to allow more photos
                print(error.localizedDescription)
            }
        }
    )
}
```

---

### Example 2 — Scan a specific album (Manual scan)

You fetch assets in your app, then pass them in.

```swift
let options = SDKOptions(
    personalizationType: .homegoods,
    photoSelectionType: .auto // or your “manual intent” if you define one
)

let assets: [PHAsset] = /* fetch from a chosen album */

Task {
    await sdk.runPersonalizationServiceWith(
        sdkOptions: options,
        arrPHAssets: assets,
        progress: { state in
            print("State:", state)
        },
        completion: { result in
            switch result {
            case .success(let sdkResult):
                print("Found:", sdkResult.arrPersonalizeAsset.count)
            case .failure(let error):
                print("Failed:", error.localizedDescription)
            }
        }
    )
}
```
