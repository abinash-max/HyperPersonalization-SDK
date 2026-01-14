# Best Human Image Selection — SDK Behavior

This document explains **how the SDK selects the best human (person) image** for fashion, accessories, shoes, cosmetics, and human-centric personalization, based strictly on the behavior described in `usage.md`.

---

## Overview

When the SDK is used for **human-based personalization** (fashion, try-on, cosmetics, accessories, shoes), it automatically identifies, evaluates, and selects the **best-quality human image** from the user’s photo library or a developer-provided photo set.

The selection is quality-driven, category-aware (male/female/person), and **fails explicitly** if required human images cannot be found.

---

## Step-by-Step Selection Pipeline

### 1. Personalization Type Determines the Rules

When the SDK is initialized with:

```swift
personalizationType: .fashion
```

(or another human-centric domain)

the SDK switches to **person-focused selection logic**.

This configuration:
- Enables human / face / body classifiers
- Activates gender or person-category rules (male, female, person)
- Enforces minimum requirements for successful personalization
- Disables room or scene-centric scoring logic

If required human categories are missing, the SDK returns a failure.

---

### 2. Photo Ingestion

Photos are collected in one of two ways:

- **Auto mode**
  - Scans all photos accessible via iOS permissions
  - Full access scans entire library
  - Limited access scans only user-approved photos

- **Manual mode**
  - Scans only the `PHAsset[]` explicitly passed by the app
  - Useful for selfies, curated albums, or user-selected images

Only **accessible and readable assets** are considered.

---

### 3. Analyzing Stage — Human Detection & Filtering

During the `analyzing` phase, each image is evaluated for **human suitability**.

Images are filtered based on:
- Presence of a clearly detectable human
- Face and/or body visibility
- Image sharpness and focus
- Lighting quality (not too dark or overexposed)
- Occlusion checks (face covered, cropped, or partially visible)

Images without a usable human subject are discarded.

---

### 4. Clustering Stage — Removing Near-Duplicates

In the `clustering` phase:
- Similar human images (same person, same pose, burst shots) are grouped
- Near-identical selfies or consecutive frames are clustered
- Only the **best representative image per cluster** is retained

This prevents repetitive or redundant human images from competing in ranking.

---

### 5. Selecting Best Photo — Human Quality Ranking

This is the **core decision stage**.

For each required human category (e.g., male, female, person):
- Remaining images are scored using internal quality heuristics:
  - Face clarity and sharpness
  - Lighting balance
  - Pose suitability (neutral, front-facing preferred)
  - Framing (head and body properly visible)
  - Minimal occlusion or distortion
- Images are ranked by overall score
- The **highest-scoring image** is selected per required category

Only one best human image is selected per category.

---

### 6. Tagging — Final Category Assignment

After selection:
- Each chosen image is tagged with a `validCategory`
  - Example: `maleFace`, `femaleFace`, `person`
- The image is returned as a `PersonalizeAsset`
- The associated `PHAsset` is provided for downstream use

These tagged assets represent the **final personalization inputs**.

---

## Failure Conditions

The SDK fails explicitly if **required human images cannot be selected**.

Common failure reasons:
- No detectable human in accessible photos
- Faces are too small, blurred, or occluded
- Poor lighting across all candidates
- Limited photo access exposes too few usable human images
- Manual mode receives an empty or irrelevant asset list

In such cases, the SDK returns `.failure(error)` rather than weak or unreliable results.

---

## One-Line Summary

**The SDK selects the best human image by detecting usable people, removing near-duplicates, ranking candidates by face and body quality, and returning the highest-scoring image per required human category — or failing if requirements are not met.**

---

## Recommended UX Handling

When selection fails:
- Prompt users to allow more photos
- Suggest uploading or selecting a clear selfie
- Explain clearly what is missing (e.g., “We couldn’t find a clear face photo”)

---

## Best Practice

Run human selection:
- During onboarding or first try-on
- Cache selected asset identifiers
- Re-run only when permissions change or the user requests a refresh
