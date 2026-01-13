import { CodeBlock } from '@/components/ui/CodeBlock';
import { DocSection, DocHeading, DocParagraph, DocList, DocCallout, DocTable } from './DocSection';

export const AdvancedIntegrationSection = () => {
  const customModelInjectionCode = `import HyperPersonalization
import CoreML

/// Custom model injection for specialized use cases
class PLModelRegistry {
    static let shared = PLModelRegistry()
    
    private var customModels: [ModelType: MLModel] = [:]
    
    /// Register a custom CoreML model to replace bundled model
    func registerCustomModel(
        _ model: MLModel,
        for type: ModelType
    ) throws {
        // Validate model input/output compatibility
        try validateModelCompatibility(model, for: type)
        
        customModels[type] = model
        
        print("[HyperPersonalization] Registered custom model for \\(type)")
    }
    
    /// Register model from URL (compiled .mlmodelc)
    func registerCustomModel(
        at url: URL,
        for type: ModelType
    ) throws {
        let config = MLModelConfiguration()
        config.computeUnits = .all
        
        let model = try MLModel(contentsOf: url, configuration: config)
        try registerCustomModel(model, for: type)
    }
    
    /// Get model for type (custom or default)
    func model(for type: ModelType) -> MLModel {
        return customModels[type] ?? defaultModel(for: type)
    }
    
    /// Validate model compatibility with expected input/output
    private func validateModelCompatibility(
        _ model: MLModel,
        for type: ModelType
    ) throws {
        let expectedSpec = type.expectedModelSpec
        
        // Check input features
        for (name, expectedType) in expectedSpec.inputs {
            guard let feature = model.modelDescription.inputDescriptionsByName[name] else {
                throw PLError.modelMissingInput(name)
            }
            
            guard feature.type == expectedType else {
                throw PLError.modelInputTypeMismatch(name, expected: expectedType, got: feature.type)
            }
        }
        
        // Check output features
        for (name, expectedType) in expectedSpec.outputs {
            guard let feature = model.modelDescription.outputDescriptionsByName[name] else {
                throw PLError.modelMissingOutput(name)
            }
            
            guard feature.type == expectedType else {
                throw PLError.modelOutputTypeMismatch(name, expected: expectedType, got: feature.type)
            }
        }
    }
}

// MARK: - Model Types

enum ModelType: String, CaseIterable {
    case genderClassification
    case ageClassification
    case roomClassification
    case objectDetection
    case faceEmbedding
    
    var expectedModelSpec: ModelSpec {
        switch self {
        case .genderClassification:
            return ModelSpec(
                inputs: ["image": .image],
                outputs: ["classLabel": .string, "classLabelProbs": .dictionary]
            )
        case .ageClassification:
            return ModelSpec(
                inputs: ["image": .image],
                outputs: ["classLabel": .string, "classLabelProbs": .dictionary]
            )
        case .roomClassification:
            return ModelSpec(
                inputs: ["image": .image],
                outputs: ["classLabel": .string, "confidence": .double]
            )
        case .objectDetection:
            return ModelSpec(
                inputs: ["image": .image],
                outputs: ["coordinates": .multiArray, "confidence": .multiArray]
            )
        case .faceEmbedding:
            return ModelSpec(
                inputs: ["image": .image],
                outputs: ["embedding": .multiArray]
            )
        }
    }
}

struct ModelSpec {
    let inputs: [String: MLFeatureType]
    let outputs: [String: MLFeatureType]
}`;

  const webhooksCallbacksCode = `import HyperPersonalization
import BackgroundTasks

/// Background task management for long-running operations
class PLBackgroundTaskManager {
    static let taskIdentifier = "dev.hyperpersonalization.generation"
    
    /// Register background task handler
    static func registerBackgroundTasks() {
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: taskIdentifier,
            using: nil
        ) { task in
            handleBackgroundTask(task as! BGProcessingTask)
        }
    }
    
    /// Start generation with background continuation support
    func startGenerationWithBackgroundSupport(
        request: GenerationRequest,
        onProgress: @escaping (GenerationProgress) -> Void,
        onComplete: @escaping (Result<GenerationResult, Error>) -> Void
    ) {
        // Start background task
        var backgroundTaskId: UIBackgroundTaskIdentifier = .invalid
        
        backgroundTaskId = UIApplication.shared.beginBackgroundTask {
            // Cleanup on expiration
            UIApplication.shared.endBackgroundTask(backgroundTaskId)
            backgroundTaskId = .invalid
        }
        
        // Perform generation
        Task {
            do {
                let result = try await performGeneration(
                    request: request,
                    onProgress: onProgress
                )
                
                await MainActor.run {
                    onComplete(.success(result))
                    UIApplication.shared.endBackgroundTask(backgroundTaskId)
                }
            } catch {
                await MainActor.run {
                    onComplete(.failure(error))
                    UIApplication.shared.endBackgroundTask(backgroundTaskId)
                }
            }
        }
    }
    
    /// Schedule background processing task
    func scheduleBackgroundGeneration(request: GenerationRequest) {
        let taskRequest = BGProcessingTaskRequest(
            identifier: Self.taskIdentifier
        )
        taskRequest.requiresNetworkConnectivity = true
        taskRequest.requiresExternalPower = false
        
        // Store request for background handler
        persistPendingRequest(request)
        
        do {
            try BGTaskScheduler.shared.submit(taskRequest)
        } catch {
            print("[HyperPersonalization] Failed to schedule background task: \\(error)")
        }
    }
    
    private static func handleBackgroundTask(_ task: BGProcessingTask) {
        // Retrieve pending request and process
        guard let request = loadPendingRequest() else {
            task.setTaskCompleted(success: false)
            return
        }
        
        Task {
            do {
                let _ = try await shared.performGeneration(
                    request: request,
                    onProgress: { _ in }
                )
                task.setTaskCompleted(success: true)
            } catch {
                task.setTaskCompleted(success: false)
            }
        }
        
        task.expirationHandler = {
            // Save state for retry
        }
    }
}`;

  const offlineModeCode = `import HyperPersonalization
import Network

/// Offline mode behavior management
class PLConnectivityManager {
    private let monitor = NWPathMonitor()
    private var isConnected = true
    
    /// Current connectivity state
    var connectionState: ConnectionState {
        isConnected ? .online : .offline
    }
    
    /// Start monitoring network changes
    func startMonitoring() {
        monitor.pathUpdateHandler = { [weak self] path in
            self?.isConnected = path.status == .satisfied
            
            NotificationCenter.default.post(
                name: .plConnectivityChanged,
                object: self?.connectionState
            )
        }
        
        monitor.start(queue: DispatchQueue.global(qos: .utility))
    }
    
    /// Check feature availability based on connectivity
    func isFeatureAvailable(_ feature: PLFeature) -> Bool {
        switch feature {
        case .photoScanning, .roomClassification, .faceDetection,
             .genderClassification, .ageClassification:
            return true // Always available (on-device)
            
        case .faceClustering, .fashionGeneration, .furnitureGeneration:
            return isConnected // Requires network
        }
    }
    
    /// Get offline-safe operation strategy
    func getOperationStrategy(
        for operation: PLOperation
    ) -> OperationStrategy {
        switch (operation, connectionState) {
        case (.scan, _):
            return .executeImmediately
            
        case (.cluster, .online):
            return .executeImmediately
        case (.cluster, .offline):
            return .queueForLater
            
        case (.generate, .online):
            return .executeImmediately
        case (.generate, .offline):
            return .showOfflineWarning
        }
    }
}

// MARK: - Types

enum ConnectionState {
    case online
    case offline
    
    var userMessage: String {
        switch self {
        case .online:
            return "Connected"
        case .offline:
            return "Offline - Some features unavailable"
        }
    }
}

enum PLFeature {
    case photoScanning
    case roomClassification
    case faceDetection
    case genderClassification
    case ageClassification
    case faceClustering
    case fashionGeneration
    case furnitureGeneration
}

enum PLOperation {
    case scan
    case cluster
    case generate
}

enum OperationStrategy {
    case executeImmediately
    case queueForLater
    case showOfflineWarning
}

extension Notification.Name {
    static let plConnectivityChanged = Notification.Name("PLConnectivityChanged")
}`;

  return (
    <DocSection id="advanced-integration">
      <DocHeading level={1}>Phase 8: Advanced Integration</DocHeading>
      <DocParagraph>
        Advanced integration features for custom model injection, background processing, 
        and offline mode handling.
      </DocParagraph>

      <DocHeading level={2} id="custom-models">Custom Model Injection</DocHeading>
      <DocParagraph>
        HyperPersonalization comes with pre-trained AI models for gender, age, and room classification. 
        However, if you've trained your own custom models (maybe for specific room types or demographics), 
        you can replace the default models with your custom ones. This is useful if you need specialized 
        classification that the default models don't handle well.
      </DocParagraph>

      <DocParagraph>
        Here's what the code below does, step by step:
      </DocParagraph>
      <DocList items={[
        '1. Register custom model: Replace default model with your custom CoreML model',
        '2. Validate compatibility: Check that custom model has same input/output format as default',
        '3. Load from URL: Load compiled .mlmodelc file from disk or network',
        '4. Check inputs: Verify model has expected input features (e.g., "image" input)',
        '5. Check outputs: Verify model has expected output features (e.g., "classLabel")',
        '6. Use custom or default: SDK uses custom model if registered, otherwise uses default',
      ]} />

      <DocHeading level={3}>Part 1: Register Custom Model</DocHeading>
      <CodeBlock 
        code={`import HyperPersonalization
import CoreML

/// Custom model injection for specialized use cases
class PLModelRegistry {
    static let shared = PLModelRegistry()
    
    private var customModels: [ModelType: MLModel] = [:]
    
    /// Register a custom CoreML model to replace bundled model
    func registerCustomModel(
        _ model: MLModel,
        for type: ModelType
    ) throws {
        // Validate model input/output compatibility
        try validateModelCompatibility(model, for: type)
        
        customModels[type] = model
        
        print("[HyperPersonalization] Registered custom model for \\(type)")
    }
    
    /// Register model from URL (compiled .mlmodelc)
    func registerCustomModel(
        at url: URL,
        for type: ModelType
    ) throws {
        let config = MLModelConfiguration()
        config.computeUnits = .all
        
        let model = try MLModel(contentsOf: url, configuration: config)
        try registerCustomModel(model, for: type)
    }
    
    /// Get model for type (custom or default)
    func model(for type: ModelType) -> MLModel {
        return customModels[type] ?? defaultModel(for: type)
    }`} 
        filename="PLModelRegistry.swift"
        language="swift"
      />

      <DocHeading level={3}>Part 2: Validate Model Compatibility</DocHeading>
      <CodeBlock 
        code={`    /// Validate model compatibility with expected input/output
    private func validateModelCompatibility(
        _ model: MLModel,
        for type: ModelType
    ) throws {
        let expectedSpec = type.expectedModelSpec
        
        // Check input features
        for (name, expectedType) in expectedSpec.inputs {
            guard let feature = model.modelDescription.inputDescriptionsByName[name] else {
                throw PLError.modelMissingInput(name)
            }
            
            guard feature.type == expectedType else {
                throw PLError.modelInputTypeMismatch(name, expected: expectedType, got: feature.type)
            }
        }
        
        // Check output features
        for (name, expectedType) in expectedSpec.outputs {
            guard let feature = model.modelDescription.outputDescriptionsByName[name] else {
                throw PLError.modelMissingOutput(name)
            }
            
            guard feature.type == expectedType else {
                throw PLError.modelOutputTypeMismatch(name, expected: expectedType, got: feature.type)
            }
        }
    }
}

// MARK: - Model Types

enum ModelType: String, CaseIterable {
    case genderClassification
    case ageClassification
    case roomClassification
    case objectDetection
    case faceEmbedding
    
    var expectedModelSpec: ModelSpec {
        switch self {
        case .genderClassification:
            return ModelSpec(
                inputs: ["image": .image],
                outputs: ["classLabel": .string, "classLabelProbs": .dictionary]
            )
        case .ageClassification:
            return ModelSpec(
                inputs: ["image": .image],
                outputs: ["classLabel": .string, "classLabelProbs": .dictionary]
            )
        case .roomClassification:
            return ModelSpec(
                inputs: ["image": .image],
                outputs: ["classLabel": .string, "confidence": .double]
            )
        case .objectDetection:
            return ModelSpec(
                inputs: ["image": .image],
                outputs: ["coordinates": .multiArray, "confidence": .multiArray]
            )
        case .faceEmbedding:
            return ModelSpec(
                inputs: ["image": .image],
                outputs: ["embedding": .multiArray]
            )
        }
    }
}

struct ModelSpec {
    let inputs: [String: MLFeatureType]
    let outputs: [String: MLFeatureType]
}`} 
        filename="PLModelRegistry.swift"
        language="swift"
      />

      <DocCallout type="warning" title="Model Compatibility">
        Custom models must match the expected input/output signature of the bundled models. 
        The SDK validates compatibility at registration time.
      </DocCallout>

      <DocTable 
        headers={['Model Type', 'Input', 'Output', 'Size']}
        rows={[
          ['Gender Classification', '224×224 RGB Image', 'Label + Probabilities', '~5 MB'],
          ['Age Classification', '224×224 RGB Image', 'Label + Probabilities', '~5 MB'],
          ['Room Classification', '224×224 RGB Image', 'Label + Confidence', '~10 MB'],
          ['Object Detection', '416×416 RGB Image', 'Boxes + Scores', '~25 MB'],
          ['Face Embedding', '160×160 RGB Image', '512-D Vector', '~15 MB'],
        ]}
      />

      <DocHeading level={2} id="webhooks">Webhooks & Background Processing</DocHeading>
      <DocParagraph>
        Sometimes generating personalized images takes a long time (several seconds or even minutes). 
        If the user closes your app or switches to another app while generation is happening, the process 
        might get interrupted. Background processing allows generation to continue even when your app 
        is in the background, so users don't lose their progress.
      </DocParagraph>

      <DocParagraph>
        Here's what the code below does, step by step:
      </DocParagraph>
      <DocList items={[
        '1. Register background task: Register task identifier with BGTaskScheduler',
        '2. Start background task: Use beginBackgroundTask to allow processing when app is backgrounded',
        '3. Perform generation: Run generation in background task',
        '4. Handle expiration: Save state if task expires so it can resume later',
        '5. Schedule background processing: Use BGProcessingTask for longer operations',
        '6. Store pending requests: Save generation requests to disk for background handler',
      ]} />

      <DocHeading level={3}>Part 1: Register and Start Background Task</DocHeading>
      <CodeBlock 
        code={`import HyperPersonalization
import BackgroundTasks

/// Background task management for long-running operations
class PLBackgroundTaskManager {
    static let taskIdentifier = "dev.hyperpersonalization.generation"
    
    /// Register background task handler
    static func registerBackgroundTasks() {
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: taskIdentifier,
            using: nil
        ) { task in
            handleBackgroundTask(task as! BGProcessingTask)
        }
    }
    
    /// Start generation with background continuation support
    func startGenerationWithBackgroundSupport(
        request: GenerationRequest,
        onProgress: @escaping (GenerationProgress) -> Void,
        onComplete: @escaping (Result<GenerationResult, Error>) -> Void
    ) {
        // Start background task
        var backgroundTaskId: UIBackgroundTaskIdentifier = .invalid
        
        backgroundTaskId = UIApplication.shared.beginBackgroundTask {
            // Cleanup on expiration
            UIApplication.shared.endBackgroundTask(backgroundTaskId)
            backgroundTaskId = .invalid
        }
        
        // Perform generation
        Task {
            do {
                let result = try await performGeneration(
                    request: request,
                    onProgress: onProgress
                )
                
                await MainActor.run {
                    onComplete(.success(result))
                    UIApplication.shared.endBackgroundTask(backgroundTaskId)
                }
            } catch {
                await MainActor.run {
                    onComplete(.failure(error))
                    UIApplication.shared.endBackgroundTask(backgroundTaskId)
                }
            }
        }
    }`} 
        filename="PLBackgroundTaskManager.swift"
        language="swift"
      />

      <DocHeading level={3}>Part 2: Schedule and Handle Background Task</DocHeading>
      <CodeBlock 
        code={`    /// Schedule background processing task
    func scheduleBackgroundGeneration(request: GenerationRequest) {
        let taskRequest = BGProcessingTaskRequest(
            identifier: Self.taskIdentifier
        )
        taskRequest.requiresNetworkConnectivity = true
        taskRequest.requiresExternalPower = false
        
        // Store request for background handler
        persistPendingRequest(request)
        
        do {
            try BGTaskScheduler.shared.submit(taskRequest)
        } catch {
            print("[HyperPersonalization] Failed to schedule background task: \\(error)")
        }
    }
    
    private static func handleBackgroundTask(_ task: BGProcessingTask) {
        // Retrieve pending request and process
        guard let request = loadPendingRequest() else {
            task.setTaskCompleted(success: false)
            return
        }
        
        Task {
            do {
                let _ = try await shared.performGeneration(
                    request: request,
                    onProgress: { _ in }
                )
                task.setTaskCompleted(success: true)
            } catch {
                task.setTaskCompleted(success: false)
            }
        }
        
        task.expirationHandler = {
            // Save state for retry
        }
    }
}`} 
        filename="PLBackgroundTaskManager.swift"
        language="swift"
      />

      <DocList items={[
        'Register background task identifier in Info.plist under BGTaskSchedulerPermittedIdentifiers',
        'Use beginBackgroundTask for short operations (< 30 seconds)',
        'Schedule BGProcessingTask for longer operations',
        'Always handle expiration to save state for later resume',
      ]} />

      <DocHeading level={2} id="offline-mode">Offline Mode Behavior</DocHeading>
      <DocParagraph>
        What happens when there's no internet connection? Some features of HyperPersonalization work offline 
        (like analyzing photos on your device), but others need internet (like generating personalized images). 
        This section explains which features work offline and what happens when you try to use features that 
        require internet.
      </DocParagraph>

      <DocParagraph>
        Here's what the code below does, step by step:
      </DocParagraph>
      <DocList items={[
        '1. Monitor connectivity: Use NWPathMonitor to detect when internet connection changes',
        '2. Check feature availability: Determine which features work offline vs online',
        '3. Get operation strategy: Decide what to do for each operation (execute, queue, or warn)',
        '4. Post notifications: Notify app when connectivity changes',
        '5. Queue operations: Store operations that need internet for later execution',
      ]} />

      <DocHeading level={3}>Part 1: Monitor Connectivity</DocHeading>
      <CodeBlock 
        code={`import HyperPersonalization
import Network

/// Offline mode behavior management
class PLConnectivityManager {
    private let monitor = NWPathMonitor()
    private var isConnected = true
    
    /// Current connectivity state
    var connectionState: ConnectionState {
        isConnected ? .online : .offline
    }
    
    /// Start monitoring network changes
    func startMonitoring() {
        monitor.pathUpdateHandler = { [weak self] path in
            self?.isConnected = path.status == .satisfied
            
            NotificationCenter.default.post(
                name: .plConnectivityChanged,
                object: self?.connectionState
            )
        }
        
        monitor.start(queue: DispatchQueue.global(qos: .utility))
    }`} 
        filename="PLConnectivityManager.swift"
        language="swift"
      />

      <DocHeading level={3}>Part 2: Check Feature Availability</DocHeading>
      <CodeBlock 
        code={`    /// Check feature availability based on connectivity
    func isFeatureAvailable(_ feature: PLFeature) -> Bool {
        switch feature {
        case .photoScanning, .roomClassification, .faceDetection,
             .genderClassification, .ageClassification:
            return true // Always available (on-device)
            
        case .faceClustering, .fashionGeneration, .furnitureGeneration:
            return isConnected // Requires network
        }
    }
    
    /// Get offline-safe operation strategy
    func getOperationStrategy(
        for operation: PLOperation
    ) -> OperationStrategy {
        switch (operation, connectionState) {
        case (.scan, _):
            return .executeImmediately
            
        case (.cluster, .online):
            return .executeImmediately
        case (.cluster, .offline):
            return .queueForLater
            
        case (.generate, .online):
            return .executeImmediately
        case (.generate, .offline):
            return .showOfflineWarning
        }
    }
}

// MARK: - Types

enum ConnectionState {
    case online
    case offline
    
    var userMessage: String {
        switch self {
        case .online:
            return "Connected"
        case .offline:
            return "Offline - Some features unavailable"
        }
    }
}

enum PLFeature {
    case photoScanning
    case roomClassification
    case faceDetection
    case genderClassification
    case ageClassification
    case faceClustering
    case fashionGeneration
    case furnitureGeneration
}

enum PLOperation {
    case scan
    case cluster
    case generate
}

enum OperationStrategy {
    case executeImmediately
    case queueForLater
    case showOfflineWarning
}

extension Notification.Name {
    static let plConnectivityChanged = Notification.Name("PLConnectivityChanged")
}`} 
        filename="PLConnectivityManager.swift"
        language="swift"
      />

      <DocTable 
        headers={['Feature', 'Offline', 'Online']}
        rows={[
          ['Photo Scanning', '✅ Available', '✅ Available'],
          ['Room Classification', '✅ Available', '✅ Available'],
          ['Face Detection', '✅ Available', '✅ Available'],
          ['Gender/Age Classification', '✅ Available', '✅ Available'],
          ['Face Clustering', '❌ Queued', '✅ Available'],
          ['Fashion Generation', '❌ Unavailable', '✅ Available'],
          ['Furniture Visualization', '❌ Unavailable', '✅ Available'],
        ]}
      />

      <DocCallout type="info" title="Queued Operations">
        Operations queued while offline are automatically executed when connectivity 
        is restored. Subscribe to <code>.plConnectivityChanged</code> to update your UI.
      </DocCallout>
    </DocSection>
  );
};
