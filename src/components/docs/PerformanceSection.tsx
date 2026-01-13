import { CodeBlock } from '@/components/ui/CodeBlock';
import { DocSection, DocHeading, DocParagraph, DocList, DocCallout, DocTable } from './DocSection';

export const PerformanceSection = () => {
  const memoryManagementCode = `import HyperPersonalization

/// Memory-efficient image processing
class PLImageProcessor {
    
    /// Maximum memory budget for image processing (in bytes)
    private let memoryBudget: Int = 100 * 1024 * 1024 // 100 MB
    
    /// Process images with memory management
    func processImages(
        assets: [PHAsset],
        batchSize: Int = 10
    ) async throws -> [ProcessingResult] {
        var results: [ProcessingResult] = []
        
        // Process in batches to control memory
        for batch in assets.chunked(into: batchSize) {
            autoreleasepool {
                let batchResults = await processBatch(batch)
                results.append(contentsOf: batchResults)
            }
            
            // Check memory pressure
            if isMemoryPressureHigh() {
                await reduceBatchSize()
                try await Task.sleep(nanoseconds: 100_000_000) // 100ms cooldown
            }
        }
        
        return results
    }
    
    /// Load image with automatic downsampling
    func loadOptimizedImage(
        from asset: PHAsset,
        targetSize: CGSize
    ) async throws -> UIImage {
        let options = PHImageRequestOptions()
        options.deliveryMode = .highQualityFormat
        options.resizeMode = .exact
        options.isNetworkAccessAllowed = false
        
        return try await withCheckedThrowingContinuation { continuation in
            PHImageManager.default().requestImage(
                for: asset,
                targetSize: targetSize,
                contentMode: .aspectFit,
                options: options
            ) { image, info in
                if let error = info?[PHImageErrorKey] as? Error {
                    continuation.resume(throwing: error)
                } else if let image = image {
                    continuation.resume(returning: image)
                } else {
                    continuation.resume(throwing: PLError.imageLoadFailed)
                }
            }
        }
    }
    
    /// Check current memory pressure
    private func isMemoryPressureHigh() -> Bool {
        var info = mach_task_basic_info()
        var count = mach_msg_type_number_t(
            MemoryLayout<mach_task_basic_info>.size
        ) / 4
        
        let result = withUnsafeMutablePointer(to: &info) {
            $0.withMemoryRebound(to: integer_t.self, capacity: 1) {
                task_info(mach_task_self_, task_flavor_t(MACH_TASK_BASIC_INFO), $0, &count)
            }
        }
        
        guard result == KERN_SUCCESS else { return false }
        return info.resident_size > memoryBudget
    }
}`;

  const concurrencyCode = `import HyperPersonalization

/// Thread-safe scanning coordinator using Swift Concurrency
actor PLScanCoordinator {
    private var isScanning = false
    private var progress: ScanProgress = .idle
    private var cancellationToken: CancellationToken?
    
    /// Start scanning with progress updates
    func startScan(
        options: ScanOptions
    ) async throws -> AsyncStream<ScanProgress> {
        guard !isScanning else {
            throw PLError.scanAlreadyInProgress
        }
        
        isScanning = true
        cancellationToken = CancellationToken()
        
        return AsyncStream { continuation in
            Task.detached(priority: .userInitiated) { [weak self] in
                guard let self = self else { return }
                
                do {
                    // Phase 1: Fetch assets
                    await self.updateProgress(.fetchingAssets(0))
                    continuation.yield(.fetchingAssets(0))
                    
                    let assets = try await self.fetchAssets(options: options)
                    
                    // Phase 2: Analyze rooms
                    await self.updateProgress(.analyzingRooms(0))
                    continuation.yield(.analyzingRooms(0))
                    
                    let rooms = try await self.analyzeRooms(
                        assets: assets,
                        onProgress: { progress in
                            continuation.yield(.analyzingRooms(progress))
                        }
                    )
                    
                    // Phase 3: Analyze faces
                    await self.updateProgress(.analyzingFaces(0))
                    continuation.yield(.analyzingFaces(0))
                    
                    let faces = try await self.analyzeFaces(
                        assets: assets,
                        onProgress: { progress in
                            continuation.yield(.analyzingFaces(progress))
                        }
                    )
                    
                    // Complete
                    await self.updateProgress(.completed(rooms: rooms, faces: faces))
                    continuation.yield(.completed(rooms: rooms, faces: faces))
                    
                } catch {
                    continuation.yield(.failed(error))
                }
                
                await self.setIsScanning(false)
                continuation.finish()
            }
        }
    }
    
    /// Cancel ongoing scan
    func cancelScan() {
        cancellationToken?.cancel()
        isScanning = false
    }
    
    private func updateProgress(_ progress: ScanProgress) {
        self.progress = progress
    }
    
    private func setIsScanning(_ value: Bool) {
        self.isScanning = value
    }
}

// MARK: - Progress Types

enum ScanProgress: Sendable {
    case idle
    case fetchingAssets(Float)
    case analyzingRooms(Float)
    case analyzingFaces(Float)
    case completed(rooms: [SelectedRoom], faces: BestFacesResult)
    case failed(Error)
    
    var percentComplete: Float {
        switch self {
        case .idle: return 0
        case .fetchingAssets(let p): return p * 0.1
        case .analyzingRooms(let p): return 0.1 + p * 0.4
        case .analyzingFaces(let p): return 0.5 + p * 0.5
        case .completed: return 1.0
        case .failed: return 0
        }
    }
}`;

  const batteryOptimizationCode = `import HyperPersonalization

/// Battery-aware scanning configuration
class PLBatteryOptimizer {
    
    /// Determine optimal scan configuration based on device state
    func getOptimalConfiguration() -> ScanConfiguration {
        let batteryState = UIDevice.current.batteryState
        let batteryLevel = UIDevice.current.batteryLevel
        let thermalState = ProcessInfo.processInfo.thermalState
        
        // Determine power mode
        let powerMode: PowerMode = {
            switch (batteryState, batteryLevel, thermalState) {
            case (.charging, _, _), (.full, _, _):
                return .performance
            case (_, let level, _) where level > 0.5:
                return .balanced
            case (_, _, .serious), (_, _, .critical):
                return .lowPower
            default:
                return .balanced
            }
        }()
        
        return ScanConfiguration(powerMode: powerMode)
    }
    
    /// Schedule scan for optimal conditions
    func scheduleScan(
        completion: @escaping (ScanConfiguration) -> Void
    ) {
        // Monitor for charging state
        NotificationCenter.default.addObserver(
            forName: UIDevice.batteryStateDidChangeNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            guard let self = self else { return }
            
            if UIDevice.current.batteryState == .charging {
                completion(self.getOptimalConfiguration())
            }
        }
    }
}

struct ScanConfiguration {
    let powerMode: PowerMode
    
    var batchSize: Int {
        switch powerMode {
        case .performance: return 20
        case .balanced: return 10
        case .lowPower: return 5
        }
    }
    
    var maxConcurrentOperations: Int {
        switch powerMode {
        case .performance: return 4
        case .balanced: return 2
        case .lowPower: return 1
        }
    }
    
    var modelPrecision: ModelPrecision {
        switch powerMode {
        case .performance: return .float32
        case .balanced: return .float16
        case .lowPower: return .float16
        }
    }
    
    var enableGPU: Bool {
        powerMode != .lowPower
    }
}

enum PowerMode {
    case performance
    case balanced
    case lowPower
}`;

  return (
    <DocSection id="performance">
      <DocHeading level={1}>Phase 6: Performance & Optimization</DocHeading>
      <DocParagraph>
        Optimize HyperPersonalization for production deployments with device-specific tuning, 
        memory management, and battery-conscious scanning strategies.
      </DocParagraph>

      <DocHeading level={2} id="device-compatibility">Device Compatibility & Benchmarks</DocHeading>
      <DocParagraph>
        HyperPersonalization works on different iPhone models, but performance varies based on the device's capabilities. 
        Newer iPhones with better processors (like A15, A16, A17) will process images faster than older models. 
        The SDK automatically adjusts its behavior based on your device's capabilities to provide the best experience.
      </DocParagraph>

      <DocTable 
        headers={['Device', 'Neural Engine', 'Avg. Inference', 'Batch Size', 'Rating']}
        rows={[
          ['iPhone 15 Pro', 'A17 Pro (35 TOPS)', '~8ms', '20 images', '★★★★★'],
          ['iPhone 14', 'A15 (15.8 TOPS)', '~15ms', '15 images', '★★★★☆'],
          ['iPhone 13', 'A15 (15.8 TOPS)', '~18ms', '12 images', '★★★★☆'],
          ['iPhone 12', 'A14 (11 TOPS)', '~25ms', '10 images', '★★★☆☆'],
          ['iPhone 11', 'A13 (6 TOPS)', '~40ms', '8 images', '★★★☆☆'],
          ['iPhone SE (3rd)', 'A15 (15.8 TOPS)', '~18ms', '12 images', '★★★★☆'],
        ]}
      />

      <DocCallout type="info" title="Minimum Requirements">
        HyperPersonalization requires iOS 15.0+ and devices with A13 Bionic or newer. Older devices 
        may experience degraded performance or may not support all features.
      </DocCallout>

      <DocHeading level={2} id="memory-management">Memory Management</DocHeading>
      <DocParagraph>
        When processing hundreds or thousands of photos, your app can run out of memory and crash. 
        HyperPersonalization handles this by processing photos in small batches and releasing memory after each batch. 
        This section shows you how the SDK manages memory efficiently to prevent crashes.
      </DocParagraph>

      <CodeBlock 
        code={memoryManagementCode} 
        filename="PLImageProcessor.swift"
        language="swift"
      />

      <DocList items={[
        'Process images in batches using autoreleasepool to release memory promptly',
        'Use PHImageManager with targetSize to load appropriately sized images',
        'Monitor memory pressure and adapt batch sizes dynamically',
        'Implement cooldown periods when memory pressure is detected',
      ]} />

      <DocHeading level={2} id="concurrency">Concurrency & Thread Safety</DocHeading>
      <DocParagraph>
        Concurrency means doing multiple things at the same time. HyperPersonalization can process multiple photos 
        simultaneously to speed things up. However, you need to be careful to avoid crashes when multiple parts 
        of your code try to access the same data at once. This section explains how the SDK safely handles 
        multiple operations running at the same time without blocking your app's UI.
      </DocParagraph>

      <CodeBlock 
        code={concurrencyCode} 
        filename="PLScanCoordinator.swift"
        language="swift"
      />

      <DocCallout type="warning" title="Main Thread Safety">
        All UI updates from scan progress must dispatch to the main actor. The 
        <code>ScanProgress</code> enum is marked <code>Sendable</code> for safe cross-actor usage.
      </DocCallout>

      <DocHeading level={2} id="battery-impact">Battery Impact & Optimization</DocHeading>
      <DocParagraph>
        Processing photos uses battery power. HyperPersonalization automatically adjusts how aggressively it processes 
        photos based on your device's battery level and whether it's charging. When the battery is low, it processes 
        fewer photos at a time to save battery. When charging, it can process more photos faster.
      </DocParagraph>

      <CodeBlock 
        code={batteryOptimizationCode} 
        filename="PLBatteryOptimizer.swift"
        language="swift"
      />

      <DocTable 
        headers={['Power Mode', 'Use Case', 'Batch Size', 'Concurrency', 'GPU']}
        rows={[
          ['Performance', 'Charging or full battery', '20', '4 operations', 'Enabled'],
          ['Balanced', 'Battery > 50%', '10', '2 operations', 'Enabled'],
          ['Low Power', 'Battery < 20% or thermal throttling', '5', '1 operation', 'Disabled'],
        ]}
      />

      <DocList items={[
        'Schedule intensive scans when the device is charging',
        'Reduce batch sizes on low battery to extend scanning sessions',
        'Respect thermal state to prevent device throttling',
        'Use Float16 precision to reduce power consumption with minimal accuracy loss',
      ]} />
    </DocSection>
  );
};
