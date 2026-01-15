# Best Room Image Selection — plugin Behavior

This document explains **how the plugin selects the best room image** for home / room-based personalization, based strictly on the behavior described in `usage.md`.

---

## Overview

When the plugin is used for **home-related personalization** (e.g., room placement, furniture visualization, home goods try-on), it automatically identifies, evaluates, and selects the **best-quality room image** from the user’s photo library or a developer-provided photo set.

The selection is deterministic, quality-driven, and fails explicitly if requirements are not met.

---

## Step-by-Step Selection Pipeline

### 1. Personalization Type Determines the Rules

When the plugin is initialized with:

```swift
personalizationType: .homegoods
```

the plugin switches to **room and indoor-scene–specific selection logic**.

This configuration:
- Enables indoor / room classifiers
- Disables face or person-centric rules
- Activates scene quality and lighting checks
- Defines room categories as required outputs (e.g., bedroom, living room)

---

### 2. Photo Ingestion

Photos are collected in one of two ways:

- **Auto mode**
  - Scans all photos accessible via iOS permissions
  - Full access scans entire library
  - Limited access scans only user-approved photos

- **Manual mode**
  - Scans only the `PHAsset[]` explicitly passed by the app
  - Common for album-based or user-selected room photos

Only **accessible and readable assets** enter the pipeline.

---

### 3. Analyzing Stage — Room Suitability Filtering

During the `analyzing` phase, each image is evaluated for **room suitability**.

Images are filtered based on:
- Indoor scene characteristics (walls, floors, furniture context)
- Image clarity and sharpness
- Adequate lighting (not too dark or overexposed)
- Sufficient resolution for downstream rendering

Images that do **not resemble a usable room** are discarded at this stage.

---

### 4. Clustering Stage — Removing Near-Duplicates

In the `clustering` phase:
- Visually similar room images are grouped together
- Burst shots or near-identical angles are clustered
- Only the **best representative image per cluster** is retained

This prevents redundant or repetitive room images from competing during selection.

---

### 5. Selecting Best Photo — Quality-Based Ranking

This is the **core decision stage**.

For each detected room category:
- Remaining images are scored using internal quality heuristics:
  - Sharpness
  - Balanced lighting
  - Clear room framing
  - Minimal obstruction
  - Suitability for product placement
- Images are ranked by overall score
- The **highest-scoring image** is selected as the best candidate

Only one best image is selected per room category.

---

### 6. Tagging — Final Category Assignment

After selection:
- Each chosen image is tagged with a `validCategory`
  - Example: `bedroom`, `livingRoom`
- The image is returned as a `PersonalizeAsset`
- The associated `PHAsset` is provided for downstream use

These tagged assets represent the **final output** of the plugin.

---

## Failure Conditions

The plugin fails explicitly if **no suitable room image** can be selected.

Common failure reasons:
- No indoor / room-like photos found
- Images are too blurry or poorly lit
- Limited photo access exposes too few usable assets
- Manual mode receives an empty or irrelevant asset list

In such cases, the plugin returns `.failure(error)` instead of weak or unreliable results.

---

## One-Line Summary

**The plugin selects the best room image by filtering for indoor scenes, removing near-duplicates, ranking remaining images by visual quality, and returning the highest-scoring room photo per category — or failing if none meet the quality threshold.**

---

## Recommended UX Handling

When selection fails:
- Prompt users to allow more photos
- Offer manual photo selection
- Clearly explain what kind of photo is missing (e.g., “We couldn’t find a clear room image”)

---

## Best Practice

Run room selection:
- Once during onboarding
- Store selected asset identifiers
- Re-run only when permissions change or the user requests a refresh
