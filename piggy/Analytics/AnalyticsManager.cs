using System;
using System.Collections;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;

/// <summary>
/// Comprehensive analytics system for the Piggy virtual pet game.
/// Tracks user interactions, progression, retention, and more.
/// </summary>
public class AnalyticsManager : MonoBehaviour
{
    [Header("Configuration")]
    [SerializeField] private bool analyticsEnabled = true;
    [SerializeField] private bool userConsentRequired = true;
    [SerializeField] private bool userHasConsented = false;
    [SerializeField] private string appVersion;
    [SerializeField] private float eventBatchInterval = 60f; // Seconds
    [SerializeField] private int maxEventsPerBatch = 100;
    [SerializeField] private bool logEvents = false;
    
    [Header("User Behavior")]
    [SerializeField] private bool trackSessionTime = true;
    [SerializeField] private bool trackFeatureUsage = true;
    [SerializeField] private bool trackUserProgression = true;
    
    [Header("Performance")]
    [SerializeField] private bool trackPerformanceMetrics = true;
    [SerializeField] private float performanceTrackingInterval = 60f; // Seconds
    
    // Dependencies
    private ILogger logger;
    private IDataPersistence dataPersistence;
    private IAnalyticsProvider analyticsProvider;
    
    // Runtime state
    private Queue<AnalyticsEvent> pendingEvents = new Queue<AnalyticsEvent>();
    private DateTime sessionStartTime;
    private DateTime lastActiveTime;
    private Dictionary<string, int> featureUsageCounts = new Dictionary<string, int>();
    private Dictionary<string, float> featureUsageTime = new Dictionary<string, float>();
    private bool initialized = false;
    private string userId = null;
    private bool isSendingBatch = false;
    
    // Performance metrics
    private float averageFps = 0f;
    private float minFps = float.MaxValue;
    private float maxFps = 0f;
    private int frameCount = 0;
    private float fpsAccumulator = 0f;
    
    [Inject]
    public void Construct(
        ILogger logger,
        IDataPersistence dataPersistence,
        IAnalyticsProvider analyticsProvider)
    {
        this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
        this.dataPersistence = dataPersistence ?? throw new ArgumentNullException(nameof(dataPersistence));
        this.analyticsProvider = analyticsProvider ?? throw new ArgumentNullException(nameof(analyticsProvider));
    }
    
    private async void Start()
    {
        try
        {
            // Set app version
            if (string.IsNullOrEmpty(appVersion))
            {
                appVersion = Application.version;
            }
            
            // Initialize analytics provider
            bool providerInitialized = await analyticsProvider.Initialize();
            
            if (!providerInitialized)
            {
                logger.LogWarning("Analytics provider initialization failed. Analytics will be disabled.");
                analyticsEnabled = false;
                return;
            }
            
            // Load user consent if required
            if (userConsentRequired)
            {
                await LoadConsentStatus();
                
                if (!userHasConsented)
                {
                    logger.LogInfo("User has not consented to analytics. Analytics disabled.");
                    analyticsEnabled = false;
                    return;
                }
            }
            
            // Get or generate user ID
            userId = await GetUserID();
            
            // Start session
            sessionStartTime = DateTime.UtcNow;
            lastActiveTime = sessionStartTime;
            
            // Track session start
            TrackEvent("session_start", new Dictionary<string, object>
            {
                { "session_id", Guid.NewGuid().ToString() },
                { "app_version", appVersion },
                { "platform", Application.platform.ToString() },
                { "device_model", SystemInfo.deviceModel },
                { "device_id", SystemInfo.deviceUniqueIdentifier }
            });
            
            // Start batching coroutine
            StartCoroutine(BatchEventsCoroutine());
            
            // Start performance tracking if enabled
            if (trackPerformanceMetrics)
            {
                StartCoroutine(TrackPerformanceCoroutine());
            }
            
            initialized = true;
            logger.LogInfo("AnalyticsManager initialized successfully");
        }
        catch (Exception ex)
        {
            logger.LogError($"Error initializing AnalyticsManager: {ex.Message}");
            analyticsEnabled = false;
        }
    }
    
    private void Update()
    {
        if (analyticsEnabled && trackPerformanceMetrics)
        {
            // Track FPS
            float currentFPS = 1.0f / Time.unscaledDeltaTime;
            fpsAccumulator += currentFPS;
            frameCount++;
            
            minFps = Mathf.Min(minFps, currentFPS);
            maxFps = Mathf.Max(maxFps, currentFPS);
        }
        
        // Update last active time
        lastActiveTime = DateTime.UtcNow;
    }
    
    private void OnApplicationPause(bool pause)
    {
        if (!analyticsEnabled || !initialized)
        {
            return;
        }
        
        if (pause)
        {
            // Application is being paused
            TrackEvent("session_pause", new Dictionary<string, object>
            {
                { "session_duration", (DateTime.UtcNow - sessionStartTime).TotalSeconds }
            });
            
            // Force send pending events
            _ = SendEventBatchAsync();
        }
        else
        {
            // Application is resuming
            TrackEvent("session_resume", new Dictionary<string, object>
            {
                { "pause_duration", (DateTime.UtcNow - lastActiveTime).TotalSeconds }
            });
        }
    }
    
    private void OnApplicationQuit()
    {
        if (!analyticsEnabled || !initialized)
        {
            return;
        }
        
        // Track session end
        TrackEvent("session_end", new Dictionary<string, object>
        {
            { "session_duration", (DateTime.UtcNow - sessionStartTime).TotalSeconds }
        });
        
        // Force send remaining events
        SendEventBatchAsync().Wait();
    }
    
    #region Public API
    
    /// <summary>
    /// Track an analytics event with optional properties.
    /// </summary>
    /// <param name="eventName">The name of the event.</param>
    /// <param name="properties">Optional properties for the event.</param>
    public void TrackEvent(string eventName, Dictionary<string, object> properties = null)
    {
        if (!analyticsEnabled || !initialized)
        {
            return;
        }
        
        try
        {
            var eventProps = properties ?? new Dictionary<string, object>();
            
            // Add common properties
            if (!eventProps.ContainsKey("user_id"))
            {
                eventProps["user_id"] = userId;
            }
            
            if (!eventProps.ContainsKey("app_version"))
            {
                eventProps["app_version"] = appVersion;
            }
            
            // Create event
            var analyticsEvent = new AnalyticsEvent
            {
                Name = eventName,
                Timestamp = DateTime.UtcNow,
                Properties = eventProps
            };
            
            // Add to queue
            pendingEvents.Enqueue(analyticsEvent);
            
            if (logEvents)
            {
                logger.LogInfo($"Analytics event tracked: {eventName}");
            }
        }
        catch (Exception ex)
        {
            logger.LogError($"Error tracking analytics event: {ex.Message}");
        }
    }
    
    /// <summary>
    /// Track when a feature is used.
    /// </summary>
    /// <param name="featureName">The name of the feature.</param>
    /// <param name="properties">Optional properties for the event.</param>
    public void TrackFeatureUsage(string featureName, Dictionary<string, object> properties = null)
    {
        if (!analyticsEnabled || !initialized || !trackFeatureUsage)
        {
            return;
        }
        
        try
        {
            // Increment feature usage count
            if (!featureUsageCounts.ContainsKey(featureName))
            {
                featureUsageCounts[featureName] = 0;
            }
            featureUsageCounts[featureName]++;
            
            // Create properties
            var eventProps = properties ?? new Dictionary<string, object>();
            eventProps["feature_name"] = featureName;
            eventProps["feature_count"] = featureUsageCounts[featureName];
            
            // Track event
            TrackEvent("feature_used", eventProps);
        }
        catch (Exception ex)
        {
            logger.LogError($"Error tracking feature usage: {ex.Message}");
        }
    }
    
    /// <summary>
    /// Track user progression event.
    /// </summary>
    /// <param name="progressionType">The type of progression (e.g., "level", "quest", "achievement").</param>
    /// <param name="progressionName">The name of the progression item.</param>
    /// <param name="status">The status (e.g., "start", "complete", "fail").</param>
    /// <param name="properties">Optional properties for the event.</param>
    public void TrackProgression(string progressionType, string progressionName, string status, Dictionary<string, object> properties = null)
    {
        if (!analyticsEnabled || !initialized || !trackUserProgression)
        {
            return;
        }
        
        try
        {
            // Create properties
            var eventProps = properties ?? new Dictionary<string, object>();
            eventProps["progression_type"] = progressionType;
            eventProps["progression_name"] = progressionName;
            eventProps["progression_status"] = status;
            
            // Track event
            TrackEvent("progression", eventProps);
        }
        catch (Exception ex)
        {
            logger.LogError($"Error tracking progression: {ex.Message}");
        }
    }
    
    /// <summary>
    /// Start tracking time spent on a feature.
    /// </summary>
    /// <param name="featureName">The name of the feature.</param>
    public void StartFeatureTimer(string featureName)
    {
        if (!analyticsEnabled || !initialized || !trackFeatureUsage)
        {
            return;
        }
        
        try
        {
            featureUsageTime[featureName] = Time.realtimeSinceStartup;
        }
        catch (Exception ex)
        {
            logger.LogError($"Error starting feature timer: {ex.Message}");
        }
    }
    
    /// <summary>
    /// Stop tracking time spent on a feature and report it.
    /// </summary>
    /// <param name="featureName">The name of the feature.</param>
    /// <param name="properties">Optional properties for the event.</param>
    public void StopFeatureTimer(string featureName, Dictionary<string, object> properties = null)
    {
        if (!analyticsEnabled || !initialized || !trackFeatureUsage)
        {
            return;
        }
        
        try
        {
            if (!featureUsageTime.ContainsKey(featureName))
            {
                return;
            }
            
            float startTime = featureUsageTime[featureName];
            float duration = Time.realtimeSinceStartup - startTime;
            
            // Remove from tracking
            featureUsageTime.Remove(featureName);
            
            // Create properties
            var eventProps = properties ?? new Dictionary<string, object>();
            eventProps["feature_name"] = featureName;
            eventProps["duration"] = duration;
            
            // Track event
            TrackEvent("feature_time", eventProps);
        }
        catch (Exception ex)
        {
            logger.LogError($"Error stopping feature timer: {ex.Message}");
        }
    }
    
    /// <summary>
    /// Track when the user completes a tutorial step.
    /// </summary>
    /// <param name="tutorialName">The name of the tutorial.</param>
    /// <param name="stepName">The name of the step.</param>
    /// <param name="properties">Optional properties for the event.</param>
    public void TrackTutorialStep(string tutorialName, string stepName, Dictionary<string, object> properties = null)
    {
        if (!analyticsEnabled || !initialized || !trackUserProgression)
        {
            return;
        }
        
        try
        {
            // Create properties
            var eventProps = properties ?? new Dictionary<string, object>();
            eventProps["tutorial_name"] = tutorialName;
            eventProps["step_name"] = stepName;
            
            // Track event
            TrackEvent("tutorial_step", eventProps);
        }
        catch (Exception ex)
        {
            logger.LogError($"Error tracking tutorial step: {ex.Message}");
        }
    }
    
    /// <summary>
    /// Track when the user makes a purchase.
    /// </summary>
    /// <param name="itemName">The name of the item purchased.</param>
    /// <param name="itemType">The type of the item (e.g., "currency", "customization").</param>
    /// <param name="amount">The amount of the item purchased.</param>
    /// <param name="currencyType">The type of currency used (e.g., "coins", "gems").</param>
    /// <param name="properties">Optional properties for the event.</param>
    public void TrackPurchase(string itemName, string itemType, int amount, string currencyType, Dictionary<string, object> properties = null)
    {
        if (!analyticsEnabled || !initialized)
        {
            return;
        }
        
        try
        {
            // Create properties
            var eventProps = properties ?? new Dictionary<string, object>();
            eventProps["item_name"] = itemName;
            eventProps["item_type"] = itemType;
            eventProps["amount"] = amount;
            eventProps["currency_type"] = currencyType;
            
            // Track event
            TrackEvent("purchase", eventProps);
        }
        catch (Exception ex)
        {
            logger.LogError($"Error tracking purchase: {ex.Message}");
        }
    }
    
    /// <summary>
    /// Track when an error occurs in the game.
    /// </summary>
    /// <param name="errorType">The type of error.</param>
    /// <param name="errorMessage">The error message.</param>
    /// <param name="stackTrace">Optional stack trace.</param>
    public void TrackError(string errorType, string errorMessage, string stackTrace = null)
    {
        if (!analyticsEnabled || !initialized)
        {
            return;
        }
        
        try
        {
            // Create properties
            var eventProps = new Dictionary<string, object>
            {
                { "error_type", errorType },
                { "error_message", errorMessage }
            };
            
            if (!string.IsNullOrEmpty(stackTrace))
            {
                eventProps["stack_trace"] = stackTrace;
            }
            
            // Track event
            TrackEvent("error", eventProps);
        }
        catch (Exception ex)
        {
            logger.LogError($"Error tracking error event: {ex.Message}");
        }
    }
    
    /// <summary>
    /// Set user properties that will be included in all future events.
    /// </summary>
    /// <param name="properties">The properties to set.</param>
    public async Task<bool> SetUserProperties(Dictionary<string, object> properties)
    {
        if (!analyticsEnabled || !initialized)
        {
            return false;
        }
        
        try
        {
            // Set user properties in the analytics provider
            return await analyticsProvider.SetUserProperties(userId, properties);
        }
        catch (Exception ex)
        {
            logger.LogError($"Error setting user properties: {ex.Message}");
            return false;
        }
    }
    
    /// <summary>
    /// Set user consent for analytics.
    /// </summary>
    /// <param name="consent">True if the user consents, false otherwise.</param>
    /// <returns>True if the operation was successful, false otherwise.</returns>
    public async Task<bool> SetUserConsent(bool consent)
    {
        try
        {
            userHasConsented = consent;
            
            // Save consent status
            await SaveConsentStatus();
            
            // Update analytics enabled status
            analyticsEnabled = !userConsentRequired || userHasConsented;
            
            if (initialized && analyticsEnabled)
            {
                // Track consent event
                TrackEvent("user_consent", new Dictionary<string, object>
                {
                    { "consent", consent }
                });
            }
            
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError($"Error setting user consent: {ex.Message}");
            return false;
        }
    }
    
    /// <summary>
    /// Check if user has consented to analytics.
    /// </summary>
    /// <returns>True if the user has consented, false otherwise.</returns>
    public bool HasUserConsented()
    {
        return userHasConsented;
    }
    
    #endregion
    
    #region Implementation Methods
    
    private async Task<bool> SendEventBatchAsync()
    {
        if (isSendingBatch || pendingEvents.Count == 0)
        {
            return true;
        }
        
        isSendingBatch = true;
        
        try
        {
            // Prepare batch of events
            List<AnalyticsEvent> batch = new List<AnalyticsEvent>();
            
            int count = Math.Min(pendingEvents.Count, maxEventsPerBatch);
            for (int i = 0; i < count; i++)
            {
                batch.Add(pendingEvents.Dequeue());
            }
            
            // Send batch to analytics provider
            bool success = await analyticsProvider.SendEvents(batch);
            
            if (!success)
            {
                // Put events back in queue
                foreach (var evt in batch)
                {
                    pendingEvents.Enqueue(evt);
                }
                
                logger.LogWarning($"Failed to send analytics batch of {batch.Count} events.");
                return false;
            }
            
            if (logEvents)
            {
                logger.LogInfo($"Sent analytics batch of {batch.Count} events.");
            }
            
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError($"Error sending analytics batch: {ex.Message}");
            return false;
        }
        finally
        {
            isSendingBatch = false;
        }
    }
    
    private IEnumerator BatchEventsCoroutine()
    {
        while (true)
        {
            yield return new WaitForSeconds(eventBatchInterval);
            
            if (analyticsEnabled && initialized && pendingEvents.Count > 0)
            {
                _ = SendEventBatchAsync();
            }
        }
    }
    
    private IEnumerator TrackPerformanceCoroutine()
    {
        while (true)
        {
            yield return new WaitForSeconds(performanceTrackingInterval);
            
            if (analyticsEnabled && initialized && trackPerformanceMetrics && frameCount > 0)
            {
                // Calculate average FPS
                averageFps = fpsAccumulator / frameCount;
                
                // Track performance event
                TrackEvent("performance", new Dictionary<string, object>
                {
                    { "avg_fps", averageFps },
                    { "min_fps", minFps },
                    { "max_fps", maxFps },
                    { "memory_usage", System.GC.GetTotalMemory(false) / (1024 * 1024) }, // MB
                    { "battery_level", SystemInfo.batteryLevel },
                    { "battery_status", SystemInfo.batteryStatus.ToString() }
                });
                
                // Reset performance metrics
                fpsAccumulator = 0f;
                frameCount = 0;
                minFps = float.MaxValue;
                maxFps = 0f;
            }
        }
    }
    
    private async Task<string> GetUserID()
    {
        try
        {
            var gameData = await dataPersistence.LoadGameAsync();
            if (gameData?.settings == null || !gameData.settings.ContainsKey("analytics_user_id"))
            {
                // Generate new user ID
                string newUserId = Guid.NewGuid().ToString();
                
                // Save user ID
                if (gameData == null)
                {
                    gameData = new GameData();
                }
                
                if (gameData.settings == null)
                {
                    gameData.settings = new Dictionary<string, object>();
                }
                
                gameData.settings["analytics_user_id"] = newUserId;
                await dataPersistence.SaveGameAsync(gameData);
                
                return newUserId;
            }
            
            return gameData.settings["analytics_user_id"] as string;
        }
        catch (Exception ex)
        {
            logger.LogError($"Error getting user ID: {ex.Message}");
            return Guid.NewGuid().ToString();
        }
    }
    
    private async Task LoadConsentStatus()
    {
        try
        {
            var gameData = await dataPersistence.LoadGameAsync();
            if (gameData?.settings == null || !gameData.settings.ContainsKey("analytics_consent"))
            {
                userHasConsented = false;
                return;
            }
            
            object consentObj = gameData.settings["analytics_consent"];
            
            if (consentObj is bool boolConsent)
            {
                userHasConsented = boolConsent;
            }
            else if (consentObj is string strConsent)
            {
                userHasConsented = strConsent.ToLower() == "true";
            }
            else
            {
                userHasConsented = false;
            }
        }
        catch (Exception ex)
        {
            logger.LogError($"Error loading consent status: {ex.Message}");
            userHasConsented = false;
        }
    }
    
    private async Task SaveConsentStatus()
    {
        try
        {
            var gameData = await dataPersistence.LoadGameAsync();
            if (gameData == null)
            {
                gameData = new GameData();
            }
            
            // Initialize settings if needed
            if (gameData.settings == null)
            {
                gameData.settings = new Dictionary<string, object>();
            }
            
            // Save consent status
            gameData.settings["analytics_consent"] = userHasConsented;
            
            // Save to persistent storage
            await dataPersistence.SaveGameAsync(gameData);
        }
        catch (Exception ex)
        {
            logger.LogError($"Error saving consent status: {ex.Message}");
        }
    }
    
    #endregion
}

/// <summary>
/// Analytics event data structure.
/// </summary>
public class AnalyticsEvent
{
    public string Name { get; set; }
    public DateTime Timestamp { get; set; }
    public Dictionary<string, object> Properties { get; set; }
}

/// <summary>
/// Interface for analytics providers.
/// </summary>
public interface IAnalyticsProvider
{
    /// <summary>
    /// Initialize the analytics provider.
    /// </summary>
    /// <returns>True if initialization was successful, false otherwise.</returns>
    Task<bool> Initialize();
    
    /// <summary>
    /// Send a batch of events to the analytics service.
    /// </summary>
    /// <param name="events">The events to send.</param>
    /// <returns>True if sending was successful, false otherwise.</returns>
    Task<bool> SendEvents(List<AnalyticsEvent> events);
    
    /// <summary>
    /// Set user properties in the analytics service.
    /// </summary>
    /// <param name="userId">The user ID.</param>
    /// <param name="properties">The properties to set.</param>
    /// <returns>True if setting was successful, false otherwise.</returns>
    Task<bool> SetUserProperties(string userId, Dictionary<string, object> properties);
}

/// <summary>
/// Implementation of IAnalyticsProvider for Firebase Analytics.
/// </summary>
public class FirebaseAnalyticsProvider : IAnalyticsProvider
{
    private readonly ILogger logger;
    
    public FirebaseAnalyticsProvider(ILogger logger)
    {
        this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }
    
    public Task<bool> Initialize()
    {
        // Firebase initialization code would go here
        logger.LogInfo("Firebase analytics provider initialized successfully");
        return Task.FromResult(true);
    }
    
    public Task<bool> SendEvents(List<AnalyticsEvent> events)
    {
        try
        {
            // Firebase event logging code would go here
            foreach (var evt in events)
            {
                // Convert event properties to Firebase format
                Dictionary<string, object> firebaseParams = new Dictionary<string, object>();
                foreach (var prop in evt.Properties)
                {
                    // Firebase has restrictions on parameter names and values
                    // We would handle those restrictions here
                    firebaseParams[prop.Key] = prop.Value;
                }
                
                // Log event to Firebase
                // Firebase.Analytics.FirebaseAnalytics.LogEvent(evt.Name, firebaseParams);
            }
            
            return Task.FromResult(true);
        }
        catch (Exception ex)
        {
            logger.LogError($"Error sending events to Firebase: {ex.Message}");
            return Task.FromResult(false);
        }
    }
    
    public Task<bool> SetUserProperties(string userId, Dictionary<string, object> properties)
    {
        try
        {
            // Set Firebase user ID
            // Firebase.Analytics.FirebaseAnalytics.SetUserId(userId);
            
            // Set user properties
            foreach (var prop in properties)
            {
                // Firebase.Analytics.FirebaseAnalytics.SetUserProperty(prop.Key, prop.Value.ToString());
            }
            
            return Task.FromResult(true);
        }
        catch (Exception ex)
        {
            logger.LogError($"Error setting user properties in Firebase: {ex.Message}");
            return Task.FromResult(false);
        }
    }
}