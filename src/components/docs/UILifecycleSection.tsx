import { CodeBlock } from '@/components/ui/CodeBlock';
import { DocSection, DocHeading, DocParagraph, DocList, DocCallout, DocTable } from './DocSection';

export const UILifecycleSection = () => {
  const localizationCode = `import HyperPersonalization

/// Localization support for HyperPersonalization UI strings
class PLLocalization {
    
    /// Get localized room type name
    static func localizedName(for roomType: PLRoomType) -> String {
        switch roomType {
        case .livingRoom:
            return NSLocalizedString(
                "room.livingRoom",
                tableName: "HyperPersonalization",
                bundle: .main,
                value: "Living Room",
                comment: "Living room category"
            )
        case .bedroom:
            return NSLocalizedString(
                "room.bedroom",
                tableName: "HyperPersonalization",
                bundle: .main,
                value: "Bedroom",
                comment: "Bedroom category"
            )
        case .kitchen:
            return NSLocalizedString(
                "room.kitchen",
                tableName: "HyperPersonalization",
                bundle: .main,
                value: "Kitchen",
                comment: "Kitchen category"
            )
        case .bathroom:
            return NSLocalizedString(
                "room.bathroom",
                tableName: "HyperPersonalization",
                bundle: .main,
                value: "Bathroom",
                comment: "Bathroom category"
            )
        case .office:
            return NSLocalizedString(
                "room.office",
                tableName: "HyperPersonalization",
                bundle: .main,
                value: "Office",
                comment: "Office/study category"
            )
        case .outdoor:
            return NSLocalizedString(
                "room.outdoor",
                tableName: "HyperPersonalization",
                bundle: .main,
                value: "Outdoor",
                comment: "Outdoor/patio category"
            )
        }
    }
    
    /// Get localized gender category name
    static func localizedName(for gender: PLGender) -> String {
        switch gender {
        case .male:
            return NSLocalizedString(
                "gender.male",
                tableName: "HyperPersonalization",
                bundle: .main,
                value: "Men's",
                comment: "Male fashion category"
            )
        case .female:
            return NSLocalizedString(
                "gender.female",
                tableName: "HyperPersonalization",
                bundle: .main,
                value: "Women's",
                comment: "Female fashion category"
            )
        }
    }
    
    /// Get localized age group name
    static func localizedName(for ageGroup: PLAgeGroup) -> String {
        switch ageGroup {
        case .child:
            return NSLocalizedString(
                "age.child",
                tableName: "HyperPersonalization",
                bundle: .main,
                value: "Kids",
                comment: "Children's category"
            )
        case .teen:
            return NSLocalizedString(
                "age.teen",
                tableName: "HyperPersonalization",
                bundle: .main,
                value: "Teens",
                comment: "Teenagers category"
            )
        case .adult:
            return NSLocalizedString(
                "age.adult",
                tableName: "HyperPersonalization",
                bundle: .main,
                value: "Adults",
                comment: "Adults category"
            )
        case .senior:
            return NSLocalizedString(
                "age.senior",
                tableName: "HyperPersonalization",
                bundle: .main,
                value: "Seniors",
                comment: "Seniors category"
            )
        }
    }
}

// MARK: - Localizable.strings (HyperPersonalization.strings)

/*
 English (en.lproj/HyperPersonalization.strings):
 
 "room.livingRoom" = "Living Room";
 "room.bedroom" = "Bedroom";
 "room.kitchen" = "Kitchen";
 "room.bathroom" = "Bathroom";
 "room.office" = "Office";
 "room.outdoor" = "Outdoor";
 
 "gender.male" = "Men's";
 "gender.female" = "Women's";
 
 "age.child" = "Kids";
 "age.teen" = "Teens";
 "age.adult" = "Adults";
 "age.senior" = "Seniors";
 */`;

  const cacheCleaningCode = `import HyperPersonalization

/// Cache management for HyperPersonalization data
class PLCacheManager {
    static let shared = PLCacheManager()
    
    private let fileManager = FileManager.default
    private let cacheDirectory: URL
    
    init() {
        let cachesDirectory = fileManager.urls(
            for: .cachesDirectory,
            in: .userDomainMask
        ).first!
        
        cacheDirectory = cachesDirectory.appendingPathComponent(
            "HyperPersonalization",
            isDirectory: true
        )
    }
    
    /// Clear all HyperPersonalization cached data
    func clearAllCache() throws {
        try clearAnalysisCache()
        try clearThumbnailCache()
        try clearGeneratedImagesCache()
        
        // Reset in-memory caches
        PLResultCache.shared.invalidateAll()
        
        print("[HyperPersonalization] All caches cleared")
    }
    
    /// Clear analysis results cache only
    func clearAnalysisCache() throws {
        let analysisDir = cacheDirectory.appendingPathComponent("analysis")
        try removeDirectoryContents(at: analysisDir)
    }
    
    /// Clear thumbnail cache
    func clearThumbnailCache() throws {
        let thumbnailDir = cacheDirectory.appendingPathComponent("thumbnails")
        try removeDirectoryContents(at: thumbnailDir)
    }
    
    /// Clear generated images cache
    func clearGeneratedImagesCache() throws {
        let generatedDir = cacheDirectory.appendingPathComponent("generated")
        try removeDirectoryContents(at: generatedDir)
    }
    
    /// Get current cache size in bytes
    func getCacheSize() -> Int64 {
        return calculateDirectorySize(at: cacheDirectory)
    }
    
    /// Get formatted cache size string
    func getFormattedCacheSize() -> String {
        let bytes = getCacheSize()
        let formatter = ByteCountFormatter()
        formatter.allowedUnits = [.useMB, .useGB]
        formatter.countStyle = .file
        return formatter.string(fromByteCount: bytes)
    }
    
    /// Clear cache older than specified date
    func clearCacheOlderThan(_ date: Date) throws {
        let analysisDir = cacheDirectory.appendingPathComponent("analysis")
        
        guard let enumerator = fileManager.enumerator(
            at: analysisDir,
            includingPropertiesForKeys: [.contentModificationDateKey]
        ) else { return }
        
        for case let fileURL as URL in enumerator {
            guard let attributes = try? fileManager.attributesOfItem(atPath: fileURL.path),
                  let modificationDate = attributes[.modificationDate] as? Date else {
                continue
            }
            
            if modificationDate < date {
                try? fileManager.removeItem(at: fileURL)
            }
        }
    }
    
    // MARK: - Private Helpers
    
    private func removeDirectoryContents(at url: URL) throws {
        guard fileManager.fileExists(atPath: url.path) else { return }
        
        let contents = try fileManager.contentsOfDirectory(
            at: url,
            includingPropertiesForKeys: nil
        )
        
        for item in contents {
            try fileManager.removeItem(at: item)
        }
    }
    
    private func calculateDirectorySize(at url: URL) -> Int64 {
        guard let enumerator = fileManager.enumerator(
            at: url,
            includingPropertiesForKeys: [.fileSizeKey]
        ) else { return 0 }
        
        var totalSize: Int64 = 0
        
        for case let fileURL as URL in enumerator {
            guard let size = try? fileURL.resourceValues(
                forKeys: [.fileSizeKey]
            ).fileSize else {
                continue
            }
            totalSize += Int64(size)
        }
        
        return totalSize
    }
}

// MARK: - User-Facing API

extension HyperPersonalization {
    
    /// Clear all HyperPersonalization data (for user privacy/reset)
    public static func clearCache() {
        do {
            try PLCacheManager.shared.clearAllCache()
        } catch {
            PLLogger.shared.logScan(
                "Failed to clear cache: \\(error)",
                level: .error
            )
        }
    }
    
    /// Get current cache size
    public static var cacheSize: String {
        PLCacheManager.shared.getFormattedCacheSize()
    }
}`;

  const lifecycleManagementCode = `import HyperPersonalization
import UIKit

/// App lifecycle integration for HyperPersonalization
class PLLifecycleManager {
    static let shared = PLLifecycleManager()
    
    private var scanCoordinator: PLScanCoordinator?
    private var backgroundTaskId: UIBackgroundTaskIdentifier = .invalid
    
    /// Initialize lifecycle observers
    func initialize() {
        observeAppLifecycle()
        observeMemoryWarnings()
    }
    
    private func observeAppLifecycle() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appWillResignActive),
            name: UIApplication.willResignActiveNotification,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appDidBecomeActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appWillTerminate),
            name: UIApplication.willTerminateNotification,
            object: nil
        )
    }
    
    private func observeMemoryWarnings() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleMemoryWarning),
            name: UIApplication.didReceiveMemoryWarningNotification,
            object: nil
        )
    }
    
    @objc private func appWillResignActive() {
        // Pause non-critical operations
        scanCoordinator?.pauseScan()
        
        // Start background task for ongoing operations
        backgroundTaskId = UIApplication.shared.beginBackgroundTask { [weak self] in
            self?.cleanupBackgroundTask()
        }
        
        PLLogger.shared.logScan("App will resign active, pausing scan")
    }
    
    @objc private func appDidBecomeActive() {
        // Resume operations
        scanCoordinator?.resumeScan()
        
        // End background task if running
        cleanupBackgroundTask()
        
        PLLogger.shared.logScan("App did become active, resuming scan")
    }
    
    @objc private func appWillTerminate() {
        // Save any pending state
        savePendingState()
        
        PLLogger.shared.logScan("App will terminate, saving state")
    }
    
    @objc private func handleMemoryWarning() {
        // Clear non-essential caches
        PLResultCache.shared.evictLeastRecentlyUsed(percentage: 0.5)
        
        // Reduce batch sizes
        scanCoordinator?.reduceBatchSize()
        
        PLLogger.shared.logScan("Memory warning received, reducing footprint", level: .warning)
    }
    
    private func cleanupBackgroundTask() {
        if backgroundTaskId != .invalid {
            UIApplication.shared.endBackgroundTask(backgroundTaskId)
            backgroundTaskId = .invalid
        }
    }
    
    private func savePendingState() {
        // Persist scan progress for resume
        if let progress = scanCoordinator?.currentProgress {
            UserDefaults.standard.set(
                try? JSONEncoder().encode(progress),
                forKey: "PLPendingScanProgress"
            )
        }
    }
    
    /// Resume scan from saved state (call on app launch)
    func resumeFromSavedState() {
        guard let data = UserDefaults.standard.data(forKey: "PLPendingScanProgress"),
              let progress = try? JSONDecoder().decode(ScanProgress.self, from: data) else {
            return
        }
        
        // Clear saved state
        UserDefaults.standard.removeObject(forKey: "PLPendingScanProgress")
        
        // Resume from saved progress
        PLLogger.shared.logScan("Resuming scan from saved state")
        // ... resume logic
    }
}`;

  return (
    <DocSection id="ui-lifecycle">
      <DocHeading level={1}>Phase 10: UI & Lifecycle</DocHeading>
      <DocParagraph>
        UI integration patterns, localization support, cache management, and app 
        lifecycle handling for HyperPersonalization.
      </DocParagraph>

      <DocHeading level={2} id="localization">Localization</DocHeading>
      <DocParagraph>
        HyperPersonalization provides localization support for all user-facing category names 
        and labels.
      </DocParagraph>

      <DocParagraph>
        Here's what the code below does, step by step:
      </DocParagraph>
      <DocList items={[
        '1. Localize room types: Get translated names for room types (Living Room, Bedroom, etc.)',
        '2. Localize gender categories: Get translated names for gender (Men\'s, Women\'s)',
        '3. Localize age groups: Get translated names for age groups (Kids, Teens, Adults, Seniors)',
        '4. Use NSLocalizedString: Use iOS localization system to get translated strings',
        '5. Create strings file: Add HyperPersonalization.strings file for each language',
      ]} />

      <DocHeading level={3}>Part 1: Room Type Localization</DocHeading>
      <CodeBlock 
        code={`import HyperPersonalization

/// Localization support for HyperPersonalization UI strings
class PLLocalization {
    
    /// Get localized room type name
    static func localizedName(for roomType: PLRoomType) -> String {
        switch roomType {
        case .livingRoom:
            return NSLocalizedString(
                "room.livingRoom",
                tableName: "HyperPersonalization",
                bundle: .main,
                value: "Living Room",
                comment: "Living room category"
            )
        case .bedroom:
            return NSLocalizedString(
                "room.bedroom",
                tableName: "HyperPersonalization",
                bundle: .main,
                value: "Bedroom",
                comment: "Bedroom category"
            )
        case .kitchen:
            return NSLocalizedString(
                "room.kitchen",
                tableName: "HyperPersonalization",
                bundle: .main,
                value: "Kitchen",
                comment: "Kitchen category"
            )
        case .bathroom:
            return NSLocalizedString(
                "room.bathroom",
                tableName: "HyperPersonalization",
                bundle: .main,
                value: "Bathroom",
                comment: "Bathroom category"
            )
        case .office:
            return NSLocalizedString(
                "room.office",
                tableName: "HyperPersonalization",
                bundle: .main,
                value: "Office",
                comment: "Office/study category"
            )
        case .outdoor:
            return NSLocalizedString(
                "room.outdoor",
                tableName: "HyperPersonalization",
                bundle: .main,
                value: "Outdoor",
                comment: "Outdoor/patio category"
            )
        }
    }`} 
        filename="PLLocalization.swift"
        language="swift"
      />

      <DocHeading level={3}>Part 2: Gender and Age Localization</DocHeading>
      <CodeBlock 
        code={`    /// Get localized gender category name
    static func localizedName(for gender: PLGender) -> String {
        switch gender {
        case .male:
            return NSLocalizedString(
                "gender.male",
                tableName: "HyperPersonalization",
                bundle: .main,
                value: "Men's",
                comment: "Male fashion category"
            )
        case .female:
            return NSLocalizedString(
                "gender.female",
                tableName: "HyperPersonalization",
                bundle: .main,
                value: "Women's",
                comment: "Female fashion category"
            )
        }
    }
    
    /// Get localized age group name
    static func localizedName(for ageGroup: PLAgeGroup) -> String {
        switch ageGroup {
        case .child:
            return NSLocalizedString(
                "age.child",
                tableName: "HyperPersonalization",
                bundle: .main,
                value: "Kids",
                comment: "Children's category"
            )
        case .teen:
            return NSLocalizedString(
                "age.teen",
                tableName: "HyperPersonalization",
                bundle: .main,
                value: "Teens",
                comment: "Teenagers category"
            )
        case .adult:
            return NSLocalizedString(
                "age.adult",
                tableName: "HyperPersonalization",
                bundle: .main,
                value: "Adults",
                comment: "Adults category"
            )
        case .senior:
            return NSLocalizedString(
                "age.senior",
                tableName: "HyperPersonalization",
                bundle: .main,
                value: "Seniors",
                comment: "Seniors category"
            )
        }
    }
}`} 
        filename="PLLocalization.swift"
        language="swift"
      />

      <DocTable 
        headers={['Key', 'English', 'Spanish', 'French']}
        rows={[
          ['room.livingRoom', 'Living Room', 'Sala de Estar', 'Salon'],
          ['room.bedroom', 'Bedroom', 'Dormitorio', 'Chambre'],
          ['room.kitchen', 'Kitchen', 'Cocina', 'Cuisine'],
          ['gender.male', "Men's", 'Hombres', 'Hommes'],
          ['gender.female', "Women's", 'Mujeres', 'Femmes'],
          ['age.child', 'Kids', 'Niños', 'Enfants'],
        ]}
      />

      <DocCallout type="info" title="Adding Localization">
        Create a <code>HyperPersonalization.strings</code> file for each supported language in 
        your project's localization directories.
      </DocCallout>

      <DocHeading level={2} id="cache-cleaning">Cache Cleaning</DocHeading>
      <DocParagraph>
        Methods for managing and clearing plugin data to free storage or reset personalization.
      </DocParagraph>

      <DocParagraph>
        Here's what the code below does, step by step:
      </DocParagraph>
      <DocList items={[
        '1. Get cache directory: Find the app\'s cache directory and create HyperPersonalization subdirectory',
        '2. Clear all cache: Delete all cached analysis results, thumbnails, and generated images',
        '3. Clear specific caches: Clear only analysis cache, thumbnail cache, or generated images cache',
        '4. Get cache size: Calculate total size of all cached files',
        '5. Format cache size: Convert bytes to human-readable format (MB, GB)',
        '6. Clear old cache: Delete cache files older than specified date',
        '7. Invalidate in-memory cache: Clear cached data stored in memory',
      ]} />

      <DocHeading level={3}>Part 1: Cache Directory Setup</DocHeading>
      <CodeBlock 
        code={`import HyperPersonalization

/// Cache management for HyperPersonalization data
class PLCacheManager {
    static let shared = PLCacheManager()
    
    private let fileManager = FileManager.default
    private let cacheDirectory: URL
    
    init() {
        let cachesDirectory = fileManager.urls(
            for: .cachesDirectory,
            in: .userDomainMask
        ).first!
        
        cacheDirectory = cachesDirectory.appendingPathComponent(
            "HyperPersonalization",
            isDirectory: true
        )
    }`} 
        filename="PLCacheManager.swift"
        language="swift"
      />

      <DocHeading level={3}>Part 2: Clear Cache Functions</DocHeading>
      <CodeBlock 
        code={`    /// Clear all HyperPersonalization cached data
    func clearAllCache() throws {
        try clearAnalysisCache()
        try clearThumbnailCache()
        try clearGeneratedImagesCache()
        
        // Reset in-memory caches
        PLResultCache.shared.invalidateAll()
        
        print("[HyperPersonalization] All caches cleared")
    }
    
    /// Clear analysis results cache only
    func clearAnalysisCache() throws {
        let analysisDir = cacheDirectory.appendingPathComponent("analysis")
        try removeDirectoryContents(at: analysisDir)
    }
    
    /// Clear thumbnail cache
    func clearThumbnailCache() throws {
        let thumbnailDir = cacheDirectory.appendingPathComponent("thumbnails")
        try removeDirectoryContents(at: thumbnailDir)
    }
    
    /// Clear generated images cache
    func clearGeneratedImagesCache() throws {
        let generatedDir = cacheDirectory.appendingPathComponent("generated")
        try removeDirectoryContents(at: generatedDir)
    }`} 
        filename="PLCacheManager.swift"
        language="swift"
      />

      <DocHeading level={3}>Part 3: Cache Size and Cleanup</DocHeading>
      <CodeBlock 
        code={`    /// Get current cache size in bytes
    func getCacheSize() -> Int64 {
        return calculateDirectorySize(at: cacheDirectory)
    }
    
    /// Get formatted cache size string
    func getFormattedCacheSize() -> String {
        let bytes = getCacheSize()
        let formatter = ByteCountFormatter()
        formatter.allowedUnits = [.useMB, .useGB]
        formatter.countStyle = .file
        return formatter.string(fromByteCount: bytes)
    }
    
    /// Clear cache older than specified date
    func clearCacheOlderThan(_ date: Date) throws {
        let analysisDir = cacheDirectory.appendingPathComponent("analysis")
        
        guard let enumerator = fileManager.enumerator(
            at: analysisDir,
            includingPropertiesForKeys: [.contentModificationDateKey]
        ) else { return }
        
        for case let fileURL as URL in enumerator {
            guard let attributes = try? fileManager.attributesOfItem(atPath: fileURL.path),
                  let modificationDate = attributes[.modificationDate] as? Date else {
                continue
            }
            
            if modificationDate < date {
                try? fileManager.removeItem(at: fileURL)
            }
        }
    }
    
    // MARK: - Private Helpers
    
    private func removeDirectoryContents(at url: URL) throws {
        guard fileManager.fileExists(atPath: url.path) else { return }
        
        let contents = try fileManager.contentsOfDirectory(
            at: url,
            includingPropertiesForKeys: nil
        )
        
        for item in contents {
            try fileManager.removeItem(at: item)
        }
    }
    
    private func calculateDirectorySize(at url: URL) -> Int64 {
        guard let enumerator = fileManager.enumerator(
            at: url,
            includingPropertiesForKeys: [.fileSizeKey]
        ) else { return 0 }
        
        var totalSize: Int64 = 0
        
        for case let fileURL as URL in enumerator {
            guard let size = try? fileURL.resourceValues(
                forKeys: [.fileSizeKey]
            ).fileSize else {
                continue
            }
            totalSize += Int64(size)
        }
        
        return totalSize
    }
}`} 
        filename="PLCacheManager.swift"
        language="swift"
      />

      <DocHeading level={3}>Part 4: Public API</DocHeading>
      <CodeBlock 
        code={`// MARK: - User-Facing API

extension HyperPersonalization {
    
    /// Clear all HyperPersonalization data (for user privacy/reset)
    public static func clearCache() {
        do {
            try PLCacheManager.shared.clearAllCache()
        } catch {
            PLLogger.shared.logScan(
                "Failed to clear cache: \\(error)",
                level: .error
            )
        }
    }
    
    /// Get current cache size
    public static var cacheSize: String {
        PLCacheManager.shared.getFormattedCacheSize()
    }
}`} 
        filename="PLCacheManager.swift"
        language="swift"
      />

      <DocList items={[
        'Analysis cache: Classification results mapped to asset IDs',
        'Thumbnail cache: Optimized thumbnails for UI display',
        'Generated cache: Try-on and visualization results',
        'Use getFormattedCacheSize() to show cache usage to users',
      ]} />

      <DocCallout type="warning" title="Cache Clearing">
        Clearing the analysis cache will require re-scanning the photo library on next use. 
        Consider warning users before clearing.
      </DocCallout>

      <DocHeading level={2} id="lifecycle-management">Lifecycle Management</DocHeading>
      <DocParagraph>
        Properly handle app lifecycle events to pause, resume, and persist scan state.
      </DocParagraph>

      <DocParagraph>
        Here's what the code below does, step by step:
      </DocParagraph>
      <DocList items={[
        '1. Observe app lifecycle: Listen for app events (will resign active, did become active, will terminate)',
        '2. Observe memory warnings: Listen for iOS memory warnings',
        '3. Pause on background: When app goes to background, pause scanning and start background task',
        '4. Resume on foreground: When app comes to foreground, resume scanning',
        '5. Save state on terminate: Save scan progress when app is about to close',
        '6. Handle memory warning: Clear caches and reduce batch size when memory is low',
        '7. Resume from saved state: Continue interrupted scan when app relaunches',
      ]} />

      <DocHeading level={3}>Part 1: Initialize and Observe Events</DocHeading>
      <CodeBlock 
        code={`import HyperPersonalization
import UIKit

/// App lifecycle integration for HyperPersonalization
class PLLifecycleManager {
    static let shared = PLLifecycleManager()
    
    private var scanCoordinator: PLScanCoordinator?
    private var backgroundTaskId: UIBackgroundTaskIdentifier = .invalid
    
    /// Initialize lifecycle observers
    func initialize() {
        observeAppLifecycle()
        observeMemoryWarnings()
    }
    
    private func observeAppLifecycle() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appWillResignActive),
            name: UIApplication.willResignActiveNotification,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appDidBecomeActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appWillTerminate),
            name: UIApplication.willTerminateNotification,
            object: nil
        )
    }
    
    private func observeMemoryWarnings() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleMemoryWarning),
            name: UIApplication.didReceiveMemoryWarningNotification,
            object: nil
        )
    }`} 
        filename="PLLifecycleManager.swift"
        language="swift"
      />

      <DocHeading level={3}>Part 2: Handle Lifecycle Events</DocHeading>
      <CodeBlock 
        code={`    @objc private func appWillResignActive() {
        // Pause non-critical operations
        scanCoordinator?.pauseScan()
        
        // Start background task for ongoing operations
        backgroundTaskId = UIApplication.shared.beginBackgroundTask { [weak self] in
            self?.cleanupBackgroundTask()
        }
        
        PLLogger.shared.logScan("App will resign active, pausing scan")
    }
    
    @objc private func appDidBecomeActive() {
        // Resume operations
        scanCoordinator?.resumeScan()
        
        // End background task if running
        cleanupBackgroundTask()
        
        PLLogger.shared.logScan("App did become active, resuming scan")
    }
    
    @objc private func appWillTerminate() {
        // Save any pending state
        savePendingState()
        
        PLLogger.shared.logScan("App will terminate, saving state")
    }
    
    @objc private func handleMemoryWarning() {
        // Clear non-essential caches
        PLResultCache.shared.evictLeastRecentlyUsed(percentage: 0.5)
        
        // Reduce batch sizes
        scanCoordinator?.reduceBatchSize()
        
        PLLogger.shared.logScan("Memory warning received, reducing footprint", level: .warning)
    }`} 
        filename="PLLifecycleManager.swift"
        language="swift"
      />

      <DocHeading level={3}>Part 3: Background Task and State Management</DocHeading>
      <CodeBlock 
        code={`    private func cleanupBackgroundTask() {
        if backgroundTaskId != .invalid {
            UIApplication.shared.endBackgroundTask(backgroundTaskId)
            backgroundTaskId = .invalid
        }
    }
    
    private func savePendingState() {
        // Persist scan progress for resume
        if let progress = scanCoordinator?.currentProgress {
            UserDefaults.standard.set(
                try? JSONEncoder().encode(progress),
                forKey: "PLPendingScanProgress"
            )
        }
    }
    
    /// Resume scan from saved state (call on app launch)
    func resumeFromSavedState() {
        guard let data = UserDefaults.standard.data(forKey: "PLPendingScanProgress"),
              let progress = try? JSONDecoder().decode(ScanProgress.self, from: data) else {
            return
        }
        
        // Clear saved state
        UserDefaults.standard.removeObject(forKey: "PLPendingScanProgress")
        
        // Resume from saved progress
        PLLogger.shared.logScan("Resuming scan from saved state")
        // ... resume logic
    }
}`} 
        filename="PLLifecycleManager.swift"
        language="swift"
      />

      <DocTable 
        headers={['Event', 'Action', 'Purpose']}
        rows={[
          ['Will Resign Active', 'Pause scan, start background task', 'Conserve resources'],
          ['Did Become Active', 'Resume scan, end background task', 'Continue processing'],
          ['Will Terminate', 'Save pending state', 'Enable resume on relaunch'],
          ['Memory Warning', 'Evict caches, reduce batch size', 'Prevent OOM crash'],
        ]}
      />

      <DocList items={[
        'Initialize PLLifecycleManager early in app launch',
        'Call resumeFromSavedState() after initialization to continue interrupted scans',
        'Memory warnings trigger 50% cache eviction by default',
        'Background tasks allow up to 30 seconds of processing when app is backgrounded',
      ]} />
    </DocSection>
  );
};
