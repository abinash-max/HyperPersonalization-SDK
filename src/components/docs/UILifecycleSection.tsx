import { CodeBlock } from '@/components/ui/CodeBlock';
import { DocSection, DocHeading, DocParagraph, DocList, DocCallout, DocTable } from './DocSection';

export const UILifecycleSection = () => {
  const localizationCode = `import PersonaLens

/// Localization support for PersonaLens UI strings
class PLLocalization {
    
    /// Get localized room type name
    static func localizedName(for roomType: PLRoomType) -> String {
        switch roomType {
        case .livingRoom:
            return NSLocalizedString(
                "room.livingRoom",
                tableName: "PersonaLens",
                bundle: .main,
                value: "Living Room",
                comment: "Living room category"
            )
        case .bedroom:
            return NSLocalizedString(
                "room.bedroom",
                tableName: "PersonaLens",
                bundle: .main,
                value: "Bedroom",
                comment: "Bedroom category"
            )
        case .kitchen:
            return NSLocalizedString(
                "room.kitchen",
                tableName: "PersonaLens",
                bundle: .main,
                value: "Kitchen",
                comment: "Kitchen category"
            )
        case .bathroom:
            return NSLocalizedString(
                "room.bathroom",
                tableName: "PersonaLens",
                bundle: .main,
                value: "Bathroom",
                comment: "Bathroom category"
            )
        case .office:
            return NSLocalizedString(
                "room.office",
                tableName: "PersonaLens",
                bundle: .main,
                value: "Office",
                comment: "Office/study category"
            )
        case .outdoor:
            return NSLocalizedString(
                "room.outdoor",
                tableName: "PersonaLens",
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
                tableName: "PersonaLens",
                bundle: .main,
                value: "Men's",
                comment: "Male fashion category"
            )
        case .female:
            return NSLocalizedString(
                "gender.female",
                tableName: "PersonaLens",
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
                tableName: "PersonaLens",
                bundle: .main,
                value: "Kids",
                comment: "Children's category"
            )
        case .teen:
            return NSLocalizedString(
                "age.teen",
                tableName: "PersonaLens",
                bundle: .main,
                value: "Teens",
                comment: "Teenagers category"
            )
        case .adult:
            return NSLocalizedString(
                "age.adult",
                tableName: "PersonaLens",
                bundle: .main,
                value: "Adults",
                comment: "Adults category"
            )
        case .senior:
            return NSLocalizedString(
                "age.senior",
                tableName: "PersonaLens",
                bundle: .main,
                value: "Seniors",
                comment: "Seniors category"
            )
        }
    }
}

// MARK: - Localizable.strings (PersonaLens.strings)

/*
 English (en.lproj/PersonaLens.strings):
 
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

  const cacheCleaningCode = `import PersonaLens

/// Cache management for PersonaLens data
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
            "PersonaLens",
            isDirectory: true
        )
    }
    
    /// Clear all PersonaLens cached data
    func clearAllCache() throws {
        try clearAnalysisCache()
        try clearThumbnailCache()
        try clearGeneratedImagesCache()
        
        // Reset in-memory caches
        PLResultCache.shared.invalidateAll()
        
        print("[PersonaLens] All caches cleared")
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

extension PersonaLens {
    
    /// Clear all PersonaLens data (for user privacy/reset)
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

  const lifecycleManagementCode = `import PersonaLens
import UIKit

/// App lifecycle integration for PersonaLens
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
        lifecycle handling for PersonaLens.
      </DocParagraph>

      <DocHeading level={2} id="localization">Localization</DocHeading>
      <DocParagraph>
        PersonaLens provides localization support for all user-facing category names 
        and labels.
      </DocParagraph>

      <CodeBlock 
        code={localizationCode} 
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
        Create a <code>PersonaLens.strings</code> file for each supported language in 
        your project's localization directories.
      </DocCallout>

      <DocHeading level={2} id="cache-cleaning">Cache Cleaning</DocHeading>
      <DocParagraph>
        Methods for managing and clearing SDK data to free storage or reset personalization.
      </DocParagraph>

      <CodeBlock 
        code={cacheCleaningCode} 
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

      <CodeBlock 
        code={lifecycleManagementCode} 
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
