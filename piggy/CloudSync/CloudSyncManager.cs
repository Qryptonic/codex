using System;
using System.Collections;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Events;
using System.Linq;

/// <summary>
/// Cloud synchronization system for the Piggy virtual pet game.
/// Allows game data to be synchronized across multiple devices.
/// </summary>
public class CloudSyncManager : MonoBehaviour
{
    [System.Serializable] public class SyncCompletedEvent : UnityEvent<bool, string> { }
    
    [Header("Configuration")]
    [SerializeField] private bool autoSyncEnabled = true;
    [SerializeField] private float autoSyncInterval = 300f; // 5 minutes
    [SerializeField] private bool syncOnAppStart = true;
    [SerializeField] private bool syncOnAppPause = true;
    [SerializeField] private int maxRetryCount = 3;
    [SerializeField] private float retryDelay = 5f;
    [SerializeField] private bool logSyncOperations = true;
    
    [Header("Events")]
    public SyncCompletedEvent OnSyncCompleted = new SyncCompletedEvent();
    
    // Dependencies
    private IDataPersistence dataPersistence;
    private ICloudProvider cloudProvider;
    private ILogger logger;
    
    // Runtime state
    private DateTime lastSyncTime;
    private bool syncInProgress = false;
    private bool initialized = false;
    private CancellationTokenSource syncCancellationSource;
    
    [Inject]
    public void Construct(
        IDataPersistence dataPersistence,
        ICloudProvider cloudProvider,
        ILogger logger)
    {
        this.dataPersistence = dataPersistence ?? throw new ArgumentNullException(nameof(dataPersistence));
        this.cloudProvider = cloudProvider ?? throw new ArgumentNullException(nameof(cloudProvider));
        this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }
    
    private async void Start()
    {
        try
        {
            // Initialize cloud provider
            bool cloudAvailable = await cloudProvider.Initialize();
            
            if (!cloudAvailable)
            {
                logger.LogWarning("Cloud provider initialization failed. Cloud sync will be disabled.");
                return;
            }
            
            // Load last sync time
            await LoadLastSyncTime();
            
            // Perform initial sync if configured
            if (syncOnAppStart)
            {
                await SynchronizeAsync();
            }
            
            // Start auto sync if enabled
            if (autoSyncEnabled)
            {
                StartCoroutine(AutoSyncCoroutine());
            }
            
            initialized = true;
            logger.LogInfo("CloudSyncManager initialized successfully");
        }
        catch (Exception ex)
        {
            logger.LogError($"Error initializing CloudSyncManager: {ex.Message}");
        }
    }
    
    private void OnApplicationPause(bool pause)
    {
        if (syncOnAppPause && initialized)
        {
            if (pause)
            {
                // Application is being paused, sync data to cloud
                _ = SynchronizeAsync();
            }
            else
            {
                // Application is resuming, sync data from cloud
                _ = SynchronizeAsync();
            }
        }
    }
    
    private void OnDestroy()
    {
        // Cancel any ongoing sync operation
        if (syncCancellationSource != null)
        {
            syncCancellationSource.Cancel();
            syncCancellationSource.Dispose();
            syncCancellationSource = null;
        }
    }
    
    #region Public API
    
    /// <summary>
    /// Synchronize local data with cloud data.
    /// </summary>
    /// <returns>True if sync was successful, false otherwise.</returns>
    public async Task<bool> SynchronizeAsync()
    {
        if (syncInProgress)
        {
            logger.LogWarning("Sync already in progress. Please wait for it to complete.");
            return false;
        }
        
        if (!initialized || cloudProvider == null)
        {
            logger.LogWarning("Cloud sync is not initialized or cloud provider is not available.");
            return false;
        }
        
        syncInProgress = true;
        bool success = false;
        string errorMessage = null;
        
        try
        {
            if (logSyncOperations)
            {
                logger.LogInfo("Starting cloud synchronization...");
            }
            
            // Create cancellation token
            syncCancellationSource = new CancellationTokenSource();
            CancellationToken token = syncCancellationSource.Token;
            
            // Check if user is signed in
            if (!await cloudProvider.IsUserSignedIn())
            {
                // Try to sign in
                bool signedIn = await cloudProvider.SignIn(token);
                if (!signedIn)
                {
                    throw new Exception("User is not signed in and automatic sign-in failed.");
                }
            }
            
            // Get local data
            GameData localData = await dataPersistence.LoadGameAsync();
            if (localData == null)
            {
                localData = new GameData();
            }
            
            // Get cloud data
            GameData cloudData = await cloudProvider.LoadGameData(token);
            
            // Check if we have data to sync
            if (cloudData != null)
            {
                // Merge data
                GameData mergedData = await MergeGameData(localData, cloudData);
                
                // Save merged data locally
                await dataPersistence.SaveGameAsync(mergedData);
                
                // Save merged data to cloud
                await cloudProvider.SaveGameData(mergedData, token);
            }
            else
            {
                // No cloud data, upload local data
                await cloudProvider.SaveGameData(localData, token);
            }
            
            // Update last sync time
            lastSyncTime = DateTime.UtcNow;
            await SaveLastSyncTime();
            
            if (logSyncOperations)
            {
                logger.LogInfo("Cloud synchronization completed successfully.");
            }
            
            success = true;
        }
        catch (OperationCanceledException)
        {
            logger.LogWarning("Cloud synchronization was cancelled.");
            errorMessage = "Sync cancelled";
        }
        catch (Exception ex)
        {
            logger.LogError($"Error during cloud synchronization: {ex.Message}");
            errorMessage = ex.Message;
        }
        finally
        {
            syncInProgress = false;
            
            // Dispose cancellation token
            if (syncCancellationSource != null)
            {
                syncCancellationSource.Dispose();
                syncCancellationSource = null;
            }
            
            // Trigger event
            OnSyncCompleted?.Invoke(success, errorMessage);
        }
        
        return success;
    }
    
    /// <summary>
    /// Get the last time data was synchronized with the cloud.
    /// </summary>
    /// <returns>The date and time of the last sync, or DateTime.MinValue if never synced.</returns>
    public DateTime GetLastSyncTime()
    {
        return lastSyncTime;
    }
    
    /// <summary>
    /// Check if the user is currently signed in to the cloud service.
    /// </summary>
    /// <returns>True if signed in, false otherwise.</returns>
    public async Task<bool> IsUserSignedIn()
    {
        if (!initialized || cloudProvider == null)
        {
            return false;
        }
        
        try
        {
            return await cloudProvider.IsUserSignedIn();
        }
        catch (Exception ex)
        {
            logger.LogError($"Error checking if user is signed in: {ex.Message}");
            return false;
        }
    }
    
    /// <summary>
    /// Sign in to the cloud service.
    /// </summary>
    /// <returns>True if sign-in was successful, false otherwise.</returns>
    public async Task<bool> SignIn()
    {
        if (!initialized || cloudProvider == null)
        {
            return false;
        }
        
        try
        {
            // Create cancellation token
            using (var cts = new CancellationTokenSource())
            {
                return await cloudProvider.SignIn(cts.Token);
            }
        }
        catch (Exception ex)
        {
            logger.LogError($"Error signing in to cloud service: {ex.Message}");
            return false;
        }
    }
    
    /// <summary>
    /// Sign out from the cloud service.
    /// </summary>
    /// <returns>True if sign-out was successful, false otherwise.</returns>
    public async Task<bool> SignOut()
    {
        if (!initialized || cloudProvider == null)
        {
            return false;
        }
        
        try
        {
            // Create cancellation token
            using (var cts = new CancellationTokenSource())
            {
                return await cloudProvider.SignOut(cts.Token);
            }
        }
        catch (Exception ex)
        {
            logger.LogError($"Error signing out from cloud service: {ex.Message}");
            return false;
        }
    }
    
    /// <summary>
    /// Get the username of the currently signed-in user.
    /// </summary>
    /// <returns>The username, or null if not signed in.</returns>
    public async Task<string> GetUsername()
    {
        if (!initialized || cloudProvider == null)
        {
            return null;
        }
        
        try
        {
            return await cloudProvider.GetUsername();
        }
        catch (Exception ex)
        {
            logger.LogError($"Error getting username: {ex.Message}");
            return null;
        }
    }
    
    /// <summary>
    /// Set whether automatic synchronization is enabled.
    /// </summary>
    /// <param name="enabled">True to enable auto sync, false to disable.</param>
    public void SetAutoSyncEnabled(bool enabled)
    {
        autoSyncEnabled = enabled;
        
        if (autoSyncEnabled && !syncInProgress)
        {
            StartCoroutine(AutoSyncCoroutine());
        }
    }
    
    #endregion
    
    #region Private Methods
    
    private async Task<GameData> MergeGameData(GameData localData, GameData cloudData)
    {
        // Create new instance for merged data
        GameData mergedData = new GameData();
        
        try
        {
            // Determine which data is more recent
            bool cloudIsNewer = cloudData.lastPlayTime > localData.lastPlayTime;
            
            // Use the more recent data for basic stats
            if (cloudIsNewer)
            {
                mergedData.hunger = cloudData.hunger;
                mergedData.thirst = cloudData.thirst;
                mergedData.happiness = cloudData.happiness;
                mergedData.health = cloudData.health;
                mergedData.affectionLevel = cloudData.affectionLevel;
                mergedData.lastPlayTime = cloudData.lastPlayTime;
                mergedData.version = Math.Max(localData.version, cloudData.version);
            }
            else
            {
                mergedData.hunger = localData.hunger;
                mergedData.thirst = localData.thirst;
                mergedData.happiness = localData.happiness;
                mergedData.health = localData.health;
                mergedData.affectionLevel = localData.affectionLevel;
                mergedData.lastPlayTime = localData.lastPlayTime;
                mergedData.version = Math.Max(localData.version, cloudData.version);
            }
            
            // Merge collections (use items from both sources)
            
            // Unlocked items
            mergedData.unlockedItems = new List<string>();
            foreach (var item in localData.unlockedItems.Concat(cloudData.unlockedItems).Distinct())
            {
                mergedData.unlockedItems.Add(item);
            }
            
            // Quest progress (use completed quests from both sources)
            mergedData.questProgress = new Dictionary<string, bool>();
            foreach (var quest in localData.questProgress.Keys.Concat(cloudData.questProgress.Keys).Distinct())
            {
                bool localCompleted = localData.questProgress.ContainsKey(quest) && localData.questProgress[quest];
                bool cloudCompleted = cloudData.questProgress.ContainsKey(quest) && cloudData.questProgress[quest];
                
                // If completed in either source, mark as completed
                mergedData.questProgress[quest] = localCompleted || cloudCompleted;
            }
            
            // Settings (prefer local settings, but include cloud-only settings)
            mergedData.settings = new Dictionary<string, object>(localData.settings);
            foreach (var setting in cloudData.settings)
            {
                if (!mergedData.settings.ContainsKey(setting.Key))
                {
                    mergedData.settings[setting.Key] = setting.Value;
                }
            }
            
            // ML data (merge carefully)
            mergedData.mlData = new Dictionary<string, object>();
            // First, copy all keys from local
            foreach (var item in localData.mlData)
            {
                mergedData.mlData[item.Key] = item.Value;
            }
            // Then add cloud-only keys
            foreach (var item in cloudData.mlData)
            {
                if (!mergedData.mlData.ContainsKey(item.Key))
                {
                    mergedData.mlData[item.Key] = item.Value;
                }
            }
            
            // For action history, we might want to merge them carefully
            if (localData.mlData.ContainsKey("action_history") && cloudData.mlData.ContainsKey("action_history"))
            {
                // This is simplified - in a real implementation we'd parse and merge the histories
                if (cloudIsNewer)
                {
                    mergedData.mlData["action_history"] = cloudData.mlData["action_history"];
                }
                else
                {
                    mergedData.mlData["action_history"] = localData.mlData["action_history"];
                }
            }
            
            if (logSyncOperations)
            {
                logger.LogInfo($"Data merged successfully. Used {(cloudIsNewer ? "cloud" : "local")} as base for stats.");
            }
            
            return mergedData;
        }
        catch (Exception ex)
        {
            logger.LogError($"Error merging game data: {ex.Message}");
            
            // In case of error, return the more recent data set
            if (cloudData.lastPlayTime > localData.lastPlayTime)
            {
                return cloudData;
            }
            else
            {
                return localData;
            }
        }
    }
    
    private async Task LoadLastSyncTime()
    {
        try
        {
            var gameData = await dataPersistence.LoadGameAsync();
            if (gameData?.settings == null || !gameData.settings.ContainsKey("last_sync_time"))
            {
                lastSyncTime = DateTime.MinValue;
                return;
            }
            
            string timeStr = gameData.settings["last_sync_time"] as string;
            if (DateTime.TryParse(timeStr, out DateTime syncTime))
            {
                lastSyncTime = syncTime;
            }
            else
            {
                lastSyncTime = DateTime.MinValue;
            }
        }
        catch (Exception ex)
        {
            logger.LogError($"Error loading last sync time: {ex.Message}");
            lastSyncTime = DateTime.MinValue;
        }
    }
    
    private async Task SaveLastSyncTime()
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
            
            // Save last sync time
            gameData.settings["last_sync_time"] = lastSyncTime.ToString("o");
            
            // Save to persistent storage
            await dataPersistence.SaveGameAsync(gameData);
        }
        catch (Exception ex)
        {
            logger.LogError($"Error saving last sync time: {ex.Message}");
        }
    }
    
    private IEnumerator AutoSyncCoroutine()
    {
        while (autoSyncEnabled && initialized)
        {
            // Wait for sync interval
            yield return new WaitForSeconds(autoSyncInterval);
            
            // Check if we need to sync
            if (!syncInProgress)
            {
                // Perform sync in background
                _ = SynchronizeWithRetryAsync();
            }
        }
    }
    
    private async Task<bool> SynchronizeWithRetryAsync()
    {
        int retryCount = 0;
        bool success = false;
        
        while (retryCount < maxRetryCount && !success)
        {
            if (retryCount > 0)
            {
                // Wait before retry
                await Task.Delay(TimeSpan.FromSeconds(retryDelay * retryCount));
                
                if (logSyncOperations)
                {
                    logger.LogInfo($"Retrying cloud synchronization (attempt {retryCount + 1}/{maxRetryCount})...");
                }
            }
            
            success = await SynchronizeAsync();
            
            if (!success)
            {
                retryCount++;
            }
        }
        
        return success;
    }
    
    #endregion
}

/// <summary>
/// Interface for cloud providers that can store and retrieve game data.
/// </summary>
public interface ICloudProvider
{
    /// <summary>
    /// Initialize the cloud provider.
    /// </summary>
    /// <returns>True if initialization was successful, false otherwise.</returns>
    Task<bool> Initialize();
    
    /// <summary>
    /// Check if the user is signed in.
    /// </summary>
    /// <returns>True if signed in, false otherwise.</returns>
    Task<bool> IsUserSignedIn();
    
    /// <summary>
    /// Sign in to the cloud service.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>True if sign-in was successful, false otherwise.</returns>
    Task<bool> SignIn(CancellationToken cancellationToken);
    
    /// <summary>
    /// Sign out from the cloud service.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>True if sign-out was successful, false otherwise.</returns>
    Task<bool> SignOut(CancellationToken cancellationToken);
    
    /// <summary>
    /// Load game data from the cloud.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The loaded game data, or null if no data exists or an error occurred.</returns>
    Task<GameData> LoadGameData(CancellationToken cancellationToken);
    
    /// <summary>
    /// Save game data to the cloud.
    /// </summary>
    /// <param name="data">The game data to save.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>True if save was successful, false otherwise.</returns>
    Task<bool> SaveGameData(GameData data, CancellationToken cancellationToken);
    
    /// <summary>
    /// Get the username of the currently signed-in user.
    /// </summary>
    /// <returns>The username, or null if not signed in.</returns>
    Task<string> GetUsername();
}

/// <summary>
/// Implementation of ICloudProvider for Apple Game Center.
/// </summary>
public class GameCenterCloudProvider : ICloudProvider
{
    private readonly ILogger logger;
    
    public GameCenterCloudProvider(ILogger logger)
    {
        this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }
    
    public async Task<bool> Initialize()
    {
        // Game Center initialization code would go here
        await Task.Delay(100); // Simulate async initialization
        
        // For this example, we'll always return true
        logger.LogInfo("Game Center cloud provider initialized successfully");
        return true;
    }
    
    public async Task<bool> IsUserSignedIn()
    {
        // Check if user is signed in to Game Center
        await Task.Delay(100); // Simulate async operation
        
        // For this example, return true
        return true;
    }
    
    public async Task<bool> SignIn(CancellationToken cancellationToken)
    {
        // Sign in to Game Center
        await Task.Delay(1000, cancellationToken); // Simulate async sign-in
        
        logger.LogInfo("Successfully signed in to Game Center");
        return true;
    }
    
    public async Task<bool> SignOut(CancellationToken cancellationToken)
    {
        // Sign out from Game Center
        await Task.Delay(100, cancellationToken); // Simulate async sign-out
        
        logger.LogInfo("Successfully signed out from Game Center");
        return true;
    }
    
    public async Task<GameData> LoadGameData(CancellationToken cancellationToken)
    {
        try
        {
            // Load data from iCloud
            await Task.Delay(1000, cancellationToken); // Simulate loading
            
            // In a real implementation, we would load data from iCloud here
            logger.LogInfo("Successfully loaded game data from Game Center cloud");
            
            // Return mock data for this example
            return new GameData
            {
                hunger = 75f,
                thirst = 80f,
                happiness = 90f,
                health = 95f,
                affectionLevel = 5,
                lastPlayTime = DateTime.UtcNow.AddHours(-2),
                unlockedItems = new List<string> { "hat", "glasses" },
                questProgress = new Dictionary<string, bool>
                {
                    { "tutorial", true },
                    { "first_play", true }
                },
                settings = new Dictionary<string, object>
                {
                    { "music_volume", 0.8f },
                    { "sfx_volume", 0.7f }
                },
                mlData = new Dictionary<string, object>
                {
                    { "action_history", "[]" },
                    { "personality_traits", "{}" }
                }
            };
        }
        catch (OperationCanceledException)
        {
            logger.LogWarning("Loading game data from Game Center was cancelled");
            throw;
        }
        catch (Exception ex)
        {
            logger.LogError($"Error loading game data from Game Center: {ex.Message}");
            return null;
        }
    }
    
    public async Task<bool> SaveGameData(GameData data, CancellationToken cancellationToken)
    {
        try
        {
            // Save data to iCloud
            await Task.Delay(1000, cancellationToken); // Simulate saving
            
            // In a real implementation, we would save data to iCloud here
            logger.LogInfo("Successfully saved game data to Game Center cloud");
            return true;
        }
        catch (OperationCanceledException)
        {
            logger.LogWarning("Saving game data to Game Center was cancelled");
            throw;
        }
        catch (Exception ex)
        {
            logger.LogError($"Error saving game data to Game Center: {ex.Message}");
            return false;
        }
    }
    
    public async Task<string> GetUsername()
    {
        // Get username from Game Center
        await Task.Delay(100); // Simulate async operation
        
        // Return mock username for this example
        return "PiggyPlayer123";
    }
}