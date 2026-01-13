import { CodeBlock } from '@/components/ui/CodeBlock';
import { DocSection, DocHeading, DocParagraph, DocList, DocCallout, DocTable } from './DocSection';

export const TestingSupportSection = () => {
  const mockTestModeCode = `import HyperPersonalization

/// Debug mode configuration for development and testing
class PLDebugConfiguration {
    static var isDebugModeEnabled = false
    static var mockDataProvider: PLMockDataProvider?
    
    /// Enable debug mode with mock data
    static func enableDebugMode(
        with provider: PLMockDataProvider = .default
    ) {
        isDebugModeEnabled = true
        mockDataProvider = provider
        
        print("[HyperPersonalization] Debug mode enabled with mock data")
    }
    
    /// Disable debug mode
    static func disableDebugMode() {
        isDebugModeEnabled = false
        mockDataProvider = nil
    }
}

/// Mock data provider for testing
class PLMockDataProvider {
    static let \`default\` = PLMockDataProvider()
    
    /// Generate mock room analysis results
    func mockRoomAnalysis() -> [SelectedRoom] {
        return [
            SelectedRoom(
                assetId: "mock_living_room_1",
                roomType: .livingRoom,
                confidence: 0.92,
                thumbnailURL: Bundle.main.url(forResource: "mock_living_room", withExtension: "jpg")
            ),
            SelectedRoom(
                assetId: "mock_bedroom_1",
                roomType: .bedroom,
                confidence: 0.88,
                thumbnailURL: Bundle.main.url(forResource: "mock_bedroom", withExtension: "jpg")
            )
        ]
    }
    
    /// Generate mock face analysis results
    func mockFaceAnalysis() -> BestFacesResult {
        return BestFacesResult(
            bestMale: SelectedFace(
                assetId: "mock_male_1",
                profile: FashionProfile(
                    gender: .male,
                    genderConfidence: 0.95,
                    ageGroup: .adult,
                    ageConfidence: 0.87
                ),
                clusterSize: 15,
                clarityScore: 0.91
            ),
            bestFemale: SelectedFace(
                assetId: "mock_female_1",
                profile: FashionProfile(
                    gender: .female,
                    genderConfidence: 0.93,
                    ageGroup: .adult,
                    ageConfidence: 0.85
                ),
                clusterSize: 12,
                clarityScore: 0.89
            ),
            bestKid: nil
        )
    }
    
    /// Generate mock clustering results
    func mockClusteringResult() -> ClusteringResult {
        return ClusteringResult(
            clusters: [
                FaceCluster(
                    clusterId: "cluster_1",
                    memberCount: 15,
                    members: (1...15).map { i in
                        ClusterMember(
                            assetId: "face_\\(i)",
                            distanceFromCentroid: Float.random(in: 0.1...0.5),
                            clarityScore: Float.random(in: 0.7...0.95)
                        )
                    },
                    centroid: Array(repeating: 0.0, count: 512)
                )
            ],
            noise: ["noise_1", "noise_2"],
            processingTime: 1.5
        )
    }
    
    /// Simulate generation with delay
    func mockGeneration(
        delay: TimeInterval = 2.0
    ) async -> GenerationResult {
        try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
        
        return GenerationResult(
            generatedImageURL: URL(string: "https://mock.hyperpersonalization.dev/generated/mock_result.jpg")!,
            processingTime: delay,
            confidence: 0.88
        )
    }
}`;

  const loggingTracingCode = `import HyperPersonalization
import os.log

/// Comprehensive logging for debugging
class PLLogger {
    static let shared = PLLogger()
    
    private let subsystem = "dev.hyperpersonalization.sdk"
    
    // Log categories
    private lazy var scanLog = OSLog(subsystem: subsystem, category: "Scan")
    private lazy var modelLog = OSLog(subsystem: subsystem, category: "Model")
    private lazy var apiLog = OSLog(subsystem: subsystem, category: "API")
    private lazy var cacheLog = OSLog(subsystem: subsystem, category: "Cache")
    
    /// Log verbosity level
    var verbosity: LogVerbosity = .info
    
    /// Log scan lifecycle events
    func logScan(
        _ message: String,
        assetId: String? = nil,
        level: LogLevel = .info
    ) {
        guard level.rawValue >= verbosity.rawValue else { return }
        
        let formattedMessage = formatMessage(
            message,
            metadata: ["assetId": assetId].compactMapValues { $0 }
        )
        
        os_log("%{public}@", log: scanLog, type: level.osLogType, formattedMessage)
    }
    
    /// Log model inference events
    func logModel(
        _ message: String,
        modelType: ModelType,
        inferenceTime: TimeInterval? = nil,
        level: LogLevel = .info
    ) {
        guard level.rawValue >= verbosity.rawValue else { return }
        
        var metadata: [String: String] = ["model": modelType.rawValue]
        if let time = inferenceTime {
            metadata["inferenceTime"] = String(format: "%.2fms", time * 1000)
        }
        
        let formattedMessage = formatMessage(message, metadata: metadata)
        os_log("%{public}@", log: modelLog, type: level.osLogType, formattedMessage)
    }
    
    /// Log API interactions
    func logAPI(
        _ message: String,
        endpoint: String,
        statusCode: Int? = nil,
        duration: TimeInterval? = nil,
        level: LogLevel = .info
    ) {
        guard level.rawValue >= verbosity.rawValue else { return }
        
        var metadata: [String: String] = ["endpoint": endpoint]
        if let code = statusCode { metadata["status"] = String(code) }
        if let dur = duration { metadata["duration"] = String(format: "%.2fs", dur) }
        
        let formattedMessage = formatMessage(message, metadata: metadata)
        os_log("%{public}@", log: apiLog, type: level.osLogType, formattedMessage)
    }
    
    /// Trace full asset lifecycle
    func traceAsset(
        id: String,
        stage: ProcessingStage,
        result: Any? = nil
    ) {
        let stageEmoji: String = {
            switch stage {
            case .loaded: return "📥"
            case .preprocessed: return "🔄"
            case .analyzed: return "🔍"
            case .clustered: return "👥"
            case .selected: return "✅"
            case .generated: return "🎨"
            case .failed: return "❌"
            }
        }()
        
        let message = "\\(stageEmoji) [\\(id)] \\(stage.rawValue)"
        logScan(message, assetId: id, level: .debug)
    }
    
    private func formatMessage(
        _ message: String,
        metadata: [String: String]
    ) -> String {
        guard !metadata.isEmpty else { return message }
        
        let metaString = metadata
            .map { "\\($0.key)=\\($0.value)" }
            .joined(separator: " ")
        
        return "\\(message) [\\(metaString)]"
    }
}

// MARK: - Types

enum LogVerbosity: Int {
    case debug = 0
    case info = 1
    case warning = 2
    case error = 3
}

enum LogLevel: Int {
    case debug = 0
    case info = 1
    case warning = 2
    case error = 3
    
    var osLogType: OSLogType {
        switch self {
        case .debug: return .debug
        case .info: return .info
        case .warning: return .default
        case .error: return .error
        }
    }
}

enum ProcessingStage: String {
    case loaded = "Loaded"
    case preprocessed = "Preprocessed"
    case analyzed = "Analyzed"
    case clustered = "Clustered"
    case selected = "Selected"
    case generated = "Generated"
    case failed = "Failed"
}`;

  const errorCodeReferenceCode = `import HyperPersonalization

/// HyperPersonalization Error Codes
enum PLErrorCode: String, Error {
    // Permission Errors (1xx)
    case permissionDenied = "ERR_PERMISSION_DENIED"
    case permissionRestricted = "ERR_PERMISSION_RESTRICTED"
    case permissionNotDetermined = "ERR_PERMISSION_NOT_DETERMINED"
    
    // Image Processing Errors (2xx)
    case imageLoadFailed = "ERR_IMAGE_LOAD_FAILED"
    case imageEncodingFailed = "ERR_IMAGE_ENCODING_FAILED"
    case imageTooSmall = "ERR_IMAGE_TOO_SMALL"
    case imageCorrupted = "ERR_IMAGE_CORRUPTED"
    
    // Face Detection Errors (3xx)
    case faceNotFound = "ERR_FACE_NOT_FOUND"
    case multipleFacesFound = "ERR_MULTIPLE_FACES_FOUND"
    case faceTooSmall = "ERR_FACE_TOO_SMALL"
    case faceObscured = "ERR_FACE_OBSCURED"
    
    // Model Errors (4xx)
    case modelLoadFailed = "ERR_MODEL_LOAD_FAILED"
    case modelInferenceFailed = "ERR_MODEL_INFERENCE_FAILED"
    case modelIncompatible = "ERR_MODEL_INCOMPATIBLE"
    case modelInputInvalid = "ERR_MODEL_INPUT_INVALID"
    
    // API Errors (5xx)
    case apiTimeout = "ERR_API_TIMEOUT"
    case apiRateLimited = "ERR_API_RATE_LIMITED"
    case apiServerError = "ERR_API_SERVER_ERROR"
    case apiAuthFailed = "ERR_API_AUTH_FAILED"
    case apiInvalidResponse = "ERR_API_INVALID_RESPONSE"
    
    // Generation Errors (6xx)
    case generationFailed = "ERR_GENERATION_FAILED"
    case generationLowQuality = "ERR_GENERATION_LOW_QUALITY"
    case generationTimeout = "ERR_GENERATION_TIMEOUT"
    
    // Cache Errors (7xx)
    case cacheReadFailed = "ERR_CACHE_READ_FAILED"
    case cacheWriteFailed = "ERR_CACHE_WRITE_FAILED"
    case cacheCorrupted = "ERR_CACHE_CORRUPTED"
    
    /// User-facing error message
    var userMessage: String {
        switch self {
        case .permissionDenied:
            return "Photo access denied. Please enable in Settings."
        case .faceNotFound:
            return "No face detected in image. Please try another photo."
        case .apiTimeout:
            return "Request timed out. Please check your connection."
        case .generationFailed:
            return "Unable to generate image. Please try again."
        default:
            return "An error occurred. Please try again."
        }
    }
    
    /// Troubleshooting steps
    var troubleshootingSteps: [String] {
        switch self {
        case .permissionDenied:
            return [
                "Open Settings app",
                "Navigate to Privacy > Photos",
                "Find your app and enable access"
            ]
        case .faceNotFound:
            return [
                "Ensure face is clearly visible",
                "Use a well-lit photo",
                "Avoid photos with sunglasses or masks"
            ]
        case .apiTimeout:
            return [
                "Check internet connection",
                "Try again in a few moments",
                "Contact support if issue persists"
            ]
        case .modelLoadFailed:
            return [
                "Restart the app",
                "Clear app cache",
                "Reinstall if issue persists"
            ]
        default:
            return ["Try again", "Contact support if issue persists"]
        }
    }
}`;

  return (
    <DocSection id="testing-support">
      <DocHeading level={1}>Phase 9: Testing & Support</DocHeading>
      <DocParagraph>
        Testing utilities, debug mode, comprehensive logging, and error reference 
        documentation for development and troubleshooting.
      </DocParagraph>

      <DocHeading level={2} id="mock-test-mode">Mocking & Test Mode</DocHeading>
      <DocParagraph>
        When developing your app, you don't want to wait for real photo analysis every time you test. 
        Mock mode lets you use fake (mock) data that simulates what real analysis would return. This makes 
        development much faster - you can test your UI and features without actually processing photos. 
        Mock data includes realistic results like "this is a living room with 92% confidence" or "this person is male".
      </DocParagraph>

      <CodeBlock 
        code={mockTestModeCode} 
        filename="PLDebugConfiguration.swift"
        language="swift"
      />

      <DocCallout type="info" title="Debug Mode Usage">
        Enable debug mode early in your app lifecycle (e.g., in AppDelegate or during 
        scheme-based initialization) for consistent mock behavior.
      </DocCallout>

      <DocList items={[
        'Mock data includes realistic confidence scores and asset IDs',
        'Simulated delays mimic real API response times',
        'All mock data is deterministic for predictable UI testing',
        'Debug mode is automatically disabled in Release builds',
      ]} />

      <DocHeading level={2} id="logging-tracing">Logging & Tracing</DocHeading>
      <DocParagraph>
        When something goes wrong, you need to know what happened. Logging means recording what the app is doing 
        so you can debug problems. HyperPersonalization logs important events like "started analyzing photo", 
        "found 3 faces", "classification confidence: 0.95", etc. These logs help you understand what's happening 
        and fix issues when they occur.
      </DocParagraph>

      <CodeBlock 
        code={loggingTracingCode} 
        filename="PLLogger.swift"
        language="swift"
      />

      <DocTable 
        headers={['Log Category', 'Content', 'Typical Use']}
        rows={[
          ['Scan', 'Asset loading, batch processing', 'Debug scan progress'],
          ['Model', 'Inference times, predictions', 'Performance tuning'],
          ['API', 'Request/response, errors', 'Network debugging'],
          ['Cache', 'Read/write operations', 'Storage debugging'],
        ]}
      />

      <DocHeading level={2} id="error-reference">Error Code Reference</DocHeading>
      <DocParagraph>
        Complete reference of all HyperPersonalization error codes with troubleshooting guidance.
      </DocParagraph>

      <CodeBlock 
        code={errorCodeReferenceCode} 
        filename="PLErrorCode.swift"
        language="swift"
      />

      <DocTable 
        headers={['Error Code', 'Category', 'Troubleshooting']}
        rows={[
          ['ERR_PERMISSION_DENIED', 'Permission', 'Enable photo access in Settings'],
          ['ERR_FACE_NOT_FOUND', 'Detection', 'Use clear, well-lit photos'],
          ['ERR_MODEL_LOAD_FAILED', 'Model', 'Restart app, reinstall if needed'],
          ['ERR_API_TIMEOUT', 'Network', 'Check connection, retry'],
          ['ERR_API_RATE_LIMITED', 'Network', 'Wait and retry after cooldown'],
          ['ERR_GENERATION_FAILED', 'Generation', 'Try different photo/product'],
          ['ERR_CACHE_CORRUPTED', 'Storage', 'Clear SDK cache'],
        ]}
      />

      <DocCallout type="warning" title="Production Logging">
        Set <code>PLLogger.shared.verbosity = .warning</code> in production to reduce 
        log volume while still capturing important issues.
      </DocCallout>
    </DocSection>
  );
};
