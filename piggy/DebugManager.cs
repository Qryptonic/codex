using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Reflection;
using System.Linq;
using System;

public class DebugManager : MonoBehaviour
{
    [Header("Debug UI")]
    [SerializeField] private GameObject debugCanvas;
    [SerializeField] private GameObject statsPanelPrefab;
    [SerializeField] private Transform statsContainer;
    [SerializeField] private TMP_Dropdown systemSelector;
    [SerializeField] private Toggle logToggle;
    [SerializeField] private Toggle performanceToggle;
    [SerializeField] private Button stressTestButton;
    [SerializeField] private Slider timeScaleSlider;
    [SerializeField] private TMP_Text fpsText;
    [SerializeField] private Image memoryUsageBar;

    [Header("Gizmo Settings")]
    [SerializeField] private bool showARPlacementGizmos = true;
    [SerializeField] private bool showPhysicsGizmos = true;
    [SerializeField] private bool showRaycastGizmos = true;

    // References to all manager systems
    private VirtualPetUnity virtualPet;
    private EmotionEngine emotionEngine;
    private QuestManager questManager;
    private RewardManager rewardManager;
    private AffectionMeter affectionMeter;
    private NotificationManager notificationManager;
    private DataLogger dataLogger;
    private MicroAnimationController microAnimationController;
    private ARPlacement arPlacement;
    private UIManager uiManager;
    private SaveSystem saveSystem;
    private AudioManager audioManager;
    private TutorialManager tutorialManager;
    private CustomizationManager customizationManager;
    private MinigameManager minigameManager;
    private MultiplayerManager multiplayerManager;
    private SeasonalEventManager seasonalEventManager;
    private WeatherManager weatherManager;
    private VoiceRecognitionManager voiceRecognitionManager;
    private ARPhotoModeManager arPhotoModeManager;
    private DayNightCycleManager dayNightCycleManager;
    private EvolutionManager evolutionManager;
    private AchievementManager achievementManager;
    private PersonalitySystem personalitySystem;
    private EmotionalContagionSystem emotionalContagionSystem;
    private SecretDiscoverySystem secretDiscoverySystem;
    private AttachmentSystem attachmentSystem;
    private PhysicsInteractionSystem physicsInteractionSystem;
    private DynamicMusicSystem dynamicMusicSystem;
    private CareFlowSystem careFlowSystem;

    // Dictionary to track system status
    private Dictionary<string, bool> systemStatus = new Dictionary<string, bool>();
    
    // Performance metrics
    private float[] fpsBuffer = new float[30];
    private int fpsBufferIndex = 0;
    private float fpsUpdateInterval = 0.5f;
    private float fpsTimer;
    
    // Log collection
    private List<LogEntry> logEntries = new List<LogEntry>();
    private int maxLogEntries = 1000;
    
    // Stress test params
    private bool stressTestActive = false;
    private int stressTestIterations = 0;
    private int maxStressIterations = 100;

    private void Awake()
    {
        DontDestroyOnLoad(this.gameObject);
        Application.logMessageReceived += HandleLog;
        
        // Get key token for debugging
        Debug.Log("[DebugManager] Initialized with session ID: " + System.Guid.NewGuid().ToString());
    }

    private void Start()
    {
        FindAndRegisterAllSystems();
        PopulateSystemSelector();
        SetupEventListeners();
        
        timeScaleSlider.onValueChanged.AddListener(UpdateTimeScale);
        stressTestButton.onClick.AddListener(RunStressTest);
        logToggle.onValueChanged.AddListener(ToggleLogCollection);
        performanceToggle.onValueChanged.AddListener(TogglePerformanceMonitoring);
        
        // Default hide debug UI in production builds
        #if !DEVELOPMENT_BUILD && !UNITY_EDITOR
        debugCanvas.SetActive(false);
        #endif
    }

    private void Update()
    {
        // Press F1 to toggle debug UI
        if (Input.GetKeyDown(KeyCode.F1))
        {
            debugCanvas.SetActive(!debugCanvas.activeSelf);
        }
        
        // Performance stats update
        if (performanceToggle.isOn)
        {
            UpdatePerformanceStats();
        }
        
        // Stress test iteration
        if (stressTestActive)
        {
            RunStressTestIteration();
        }
    }

    private void FindAndRegisterAllSystems()
    {
        virtualPet = FindObjectOfType<VirtualPetUnity>();
        emotionEngine = FindObjectOfType<EmotionEngine>();
        questManager = FindObjectOfType<QuestManager>();
        rewardManager = FindObjectOfType<RewardManager>();
        affectionMeter = FindObjectOfType<AffectionMeter>();
        notificationManager = FindObjectOfType<NotificationManager>();
        dataLogger = FindObjectOfType<DataLogger>();
        microAnimationController = FindObjectOfType<MicroAnimationController>();
        arPlacement = FindObjectOfType<ARPlacement>();
        uiManager = FindObjectOfType<UIManager>();
        saveSystem = FindObjectOfType<SaveSystem>();
        audioManager = FindObjectOfType<AudioManager>();
        tutorialManager = FindObjectOfType<TutorialManager>();
        customizationManager = FindObjectOfType<CustomizationManager>();
        minigameManager = FindObjectOfType<MinigameManager>();
        multiplayerManager = FindObjectOfType<MultiplayerManager>();
        seasonalEventManager = FindObjectOfType<SeasonalEventManager>();
        weatherManager = FindObjectOfType<WeatherManager>();
        voiceRecognitionManager = FindObjectOfType<VoiceRecognitionManager>();
        arPhotoModeManager = FindObjectOfType<ARPhotoModeManager>();
        dayNightCycleManager = FindObjectOfType<DayNightCycleManager>();
        evolutionManager = FindObjectOfType<EvolutionManager>();
        achievementManager = FindObjectOfType<AchievementManager>();
        personalitySystem = FindObjectOfType<PersonalitySystem>();
        emotionalContagionSystem = FindObjectOfType<EmotionalContagionSystem>();
        secretDiscoverySystem = FindObjectOfType<SecretDiscoverySystem>();
        attachmentSystem = FindObjectOfType<AttachmentSystem>();
        physicsInteractionSystem = FindObjectOfType<PhysicsInteractionSystem>();
        dynamicMusicSystem = FindObjectOfType<DynamicMusicSystem>();
        careFlowSystem = FindObjectOfType<CareFlowSystem>();
        
        // Register systems with statuses
        RegisterSystemStatus("VirtualPet", virtualPet != null);
        RegisterSystemStatus("EmotionEngine", emotionEngine != null);
        RegisterSystemStatus("QuestManager", questManager != null);
        RegisterSystemStatus("RewardManager", rewardManager != null);
        RegisterSystemStatus("AffectionMeter", affectionMeter != null);
        RegisterSystemStatus("NotificationManager", notificationManager != null);
        RegisterSystemStatus("DataLogger", dataLogger != null);
        RegisterSystemStatus("MicroAnimationController", microAnimationController != null);
        RegisterSystemStatus("ARPlacement", arPlacement != null);
        RegisterSystemStatus("UIManager", uiManager != null);
        RegisterSystemStatus("SaveSystem", saveSystem != null);
        RegisterSystemStatus("AudioManager", audioManager != null);
        RegisterSystemStatus("TutorialManager", tutorialManager != null);
        RegisterSystemStatus("CustomizationManager", customizationManager != null);
        RegisterSystemStatus("MinigameManager", minigameManager != null);
        RegisterSystemStatus("MultiplayerManager", multiplayerManager != null);
        RegisterSystemStatus("SeasonalEventManager", seasonalEventManager != null);
        RegisterSystemStatus("WeatherManager", weatherManager != null);
        RegisterSystemStatus("VoiceRecognitionManager", voiceRecognitionManager != null);
        RegisterSystemStatus("ARPhotoModeManager", arPhotoModeManager != null);
        RegisterSystemStatus("DayNightCycleManager", dayNightCycleManager != null);
        RegisterSystemStatus("EvolutionManager", evolutionManager != null);
        RegisterSystemStatus("AchievementManager", achievementManager != null);
        RegisterSystemStatus("PersonalitySystem", personalitySystem != null);
        RegisterSystemStatus("EmotionalContagionSystem", emotionalContagionSystem != null);
        RegisterSystemStatus("SecretDiscoverySystem", secretDiscoverySystem != null);
        RegisterSystemStatus("AttachmentSystem", attachmentSystem != null);
        RegisterSystemStatus("PhysicsInteractionSystem", physicsInteractionSystem != null);
        RegisterSystemStatus("DynamicMusicSystem", dynamicMusicSystem != null);
        RegisterSystemStatus("CareFlowSystem", careFlowSystem != null);
    }

    private void RegisterSystemStatus(string systemName, bool isActive)
    {
        systemStatus[systemName] = isActive;
        
        if (!isActive)
        {
            Debug.LogWarning($"[DebugManager] System '{systemName}' not found in scene!");
        }
        else
        {
            Debug.Log($"[DebugManager] System '{systemName}' registered successfully.");
        }
    }

    private void PopulateSystemSelector()
    {
        systemSelector.ClearOptions();
        
        List<string> options = new List<string>{"All Systems"};
        options.AddRange(systemStatus.Keys.ToList());
        
        systemSelector.AddOptions(options);
        systemSelector.onValueChanged.AddListener(DisplaySystemStats);
    }

    private void SetupEventListeners()
    {
        // Subscribe to key events for cross-system monitoring
        if (virtualPet != null)
        {
            virtualPet.OnStatsChanged.AddListener(LogStatChange);
        }
        
        if (emotionEngine != null)
        {
            emotionEngine.OnEmotionChanged.AddListener(LogEmotionChange);
        }
        
        if (rewardManager != null)
        {
            rewardManager.OnRewardGiven.AddListener(LogRewardGiven);
        }
        
        if (questManager != null)
        {
            questManager.OnQuestCompleted.AddListener(LogQuestComplete);
        }
    }

    private void DisplaySystemStats(int index)
    {
        // Clear existing stat panels
        foreach (Transform child in statsContainer)
        {
            Destroy(child.gameObject);
        }
        
        if (index == 0) // All Systems
        {
            foreach (var system in systemStatus)
            {
                if (system.Value) // Only show active systems
                {
                    CreateStatsPanelForSystem(system.Key);
                }
            }
        }
        else if (index > 0 && index <= systemStatus.Count)
        {
            string systemName = systemSelector.options[index].text;
            CreateStatsPanelForSystem(systemName);
        }
    }

    private void CreateStatsPanelForSystem(string systemName)
    {
        GameObject panel = Instantiate(statsPanelPrefab, statsContainer);
        StatsPanel statPanel = panel.GetComponent<StatsPanel>();
        if (statPanel != null)
        {
            statPanel.Initialize(systemName);
            
            // Get component by name and reflect on its public properties
            Component targetSystem = GetSystemByName(systemName);
            if (targetSystem != null)
            {
                List<string> propertyInfo = GetPublicPropertiesAndFields(targetSystem);
                statPanel.PopulateStats(propertyInfo);
            }
        }
    }

    private Component GetSystemByName(string name)
    {
        switch (name)
        {
            case "VirtualPet": return virtualPet;
            case "EmotionEngine": return emotionEngine;
            case "QuestManager": return questManager;
            case "RewardManager": return rewardManager;
            case "AffectionMeter": return affectionMeter;
            case "NotificationManager": return notificationManager;
            case "DataLogger": return dataLogger;
            case "MicroAnimationController": return microAnimationController;
            case "ARPlacement": return arPlacement;
            case "UIManager": return uiManager;
            case "SaveSystem": return saveSystem;
            case "AudioManager": return audioManager;
            case "TutorialManager": return tutorialManager;
            case "CustomizationManager": return customizationManager;
            case "MinigameManager": return minigameManager;
            case "MultiplayerManager": return multiplayerManager;
            case "SeasonalEventManager": return seasonalEventManager;
            case "WeatherManager": return weatherManager;
            case "VoiceRecognitionManager": return voiceRecognitionManager;
            case "ARPhotoModeManager": return arPhotoModeManager;
            case "DayNightCycleManager": return dayNightCycleManager;
            case "EvolutionManager": return evolutionManager;
            case "AchievementManager": return achievementManager;
            case "PersonalitySystem": return personalitySystem;
            case "EmotionalContagionSystem": return emotionalContagionSystem;
            case "SecretDiscoverySystem": return secretDiscoverySystem;
            case "AttachmentSystem": return attachmentSystem;
            case "PhysicsInteractionSystem": return physicsInteractionSystem;
            case "DynamicMusicSystem": return dynamicMusicSystem;
            case "CareFlowSystem": return careFlowSystem;
            default: return null;
        }
    }

    private List<string> GetPublicPropertiesAndFields(Component component)
    {
        List<string> result = new List<string>();
        
        if (component == null) return result;
        
        // Get properties
        PropertyInfo[] properties = component.GetType().GetProperties(BindingFlags.Public | BindingFlags.Instance);
        foreach (var prop in properties)
        {
            try
            {
                var value = prop.GetValue(component);
                result.Add($"{prop.Name}: {value}");
            }
            catch (Exception)
            {
                result.Add($"{prop.Name}: [Error reading value]");
            }
        }
        
        // Get fields
        FieldInfo[] fields = component.GetType().GetFields(BindingFlags.Public | BindingFlags.Instance);
        foreach (var field in fields)
        {
            try
            {
                var value = field.GetValue(component);
                result.Add($"{field.Name}: {value}");
            }
            catch (Exception)
            {
                result.Add($"{field.Name}: [Error reading value]");
            }
        }
        
        return result;
    }

    // Event logging methods
    private void LogStatChange(string statName, float newValue)
    {
        AddLogEntry(LogType.Log, $"[VirtualPet] Stat changed: {statName} = {newValue:F2}");
    }

    private void LogEmotionChange(string newEmotion, float intensity)
    {
        AddLogEntry(LogType.Log, $"[EmotionEngine] Emotion changed: {newEmotion} (intensity: {intensity:F2})");
    }

    private void LogRewardGiven(string rewardType, int amount)
    {
        AddLogEntry(LogType.Log, $"[RewardManager] Reward given: {rewardType} x{amount}");
    }

    private void LogQuestComplete(string questName)
    {
        AddLogEntry(LogType.Log, $"[QuestManager] Quest completed: {questName}");
    }

    // Performance monitoring
    private void UpdatePerformanceStats()
    {
        fpsTimer += Time.unscaledDeltaTime;
        
        if (fpsTimer >= fpsUpdateInterval)
        {
            // Calculate FPS
            float fps = 1.0f / Time.unscaledDeltaTime;
            fpsBuffer[fpsBufferIndex] = fps;
            fpsBufferIndex = (fpsBufferIndex + 1) % fpsBuffer.Length;
            
            float averageFps = fpsBuffer.Sum() / fpsBuffer.Count(f => f > 0);
            fpsText.text = $"FPS: {averageFps:F1}";
            
            // Set color based on performance
            if (averageFps < 30)
                fpsText.color = Color.red;
            else if (averageFps < 45)
                fpsText.color = Color.yellow;
            else
                fpsText.color = Color.green;
            
            // Update memory usage (approximate)
            float memoryUsage = (float)System.GC.GetTotalMemory(false) / (1024 * 1024); // MB
            float maxMemory = SystemInfo.systemMemorySize / 2; // Half of system memory as target
            
            memoryUsageBar.fillAmount = Mathf.Clamp01(memoryUsage / maxMemory);
            
            if (memoryUsageBar.fillAmount > 0.8f)
                memoryUsageBar.color = Color.red;
            else if (memoryUsageBar.fillAmount > 0.5f)
                memoryUsageBar.color = Color.yellow;
            else
                memoryUsageBar.color = Color.green;
            
            fpsTimer = 0;
        }
    }

    // Time scale adjustment
    private void UpdateTimeScale(float value)
    {
        Time.timeScale = value;
        Debug.Log($"[DebugManager] Time scale set to: {value:F2}x");
    }

    // Stress testing
    private void RunStressTest()
    {
        if (stressTestActive)
        {
            StopStressTest();
            return;
        }
        
        stressTestActive = true;
        stressTestIterations = 0;
        stressTestButton.GetComponentInChildren<TMP_Text>().text = "Stop Stress Test";
        
        Debug.Log("[DebugManager] Starting stress test");
        StartCoroutine(LogResourceUsageDuringStressTest());
    }
    
    private void StopStressTest()
    {
        stressTestActive = false;
        stressTestButton.GetComponentInChildren<TMP_Text>().text = "Run Stress Test";
        Debug.Log($"[DebugManager] Stress test completed after {stressTestIterations} iterations");
    }
    
    private void RunStressTestIteration()
    {
        if (stressTestIterations >= maxStressIterations)
        {
            StopStressTest();
            return;
        }
        
        // Trigger various system interactions to stress test
        if (virtualPet != null)
        {
            float random = UnityEngine.Random.value;
            if (random < 0.33f)
                virtualPet.Feed();
            else if (random < 0.66f)
                virtualPet.Drink();
            else
                virtualPet.Play();
        }
        
        // Trigger AR placement updates if available
        if (arPlacement != null)
        {
            arPlacement.UpdatePlacement(new Vector3(
                UnityEngine.Random.Range(-5f, 5f),
                0,
                UnityEngine.Random.Range(-5f, 5f)));
        }
        
        // Trigger audio
        if (audioManager != null)
        {
            string[] soundTypes = {"feed", "drink", "play", "happy", "sad"};
            audioManager.PlaySound(soundTypes[UnityEngine.Random.Range(0, soundTypes.Length)]);
        }
        
        stressTestIterations++;
    }
    
    private IEnumerator LogResourceUsageDuringStressTest()
    {
        while (stressTestActive)
        {
            float memoryUsage = (float)System.GC.GetTotalMemory(false) / (1024 * 1024); // MB
            float fps = 1.0f / Time.unscaledDeltaTime;
            
            Debug.Log($"[DebugManager] Stress Test - Iteration: {stressTestIterations}/{maxStressIterations}, Memory: {memoryUsage:F1} MB, FPS: {fps:F1}");
            
            yield return new WaitForSeconds(1.0f);
        }
    }

    // Log collection
    private void HandleLog(string logString, string stackTrace, LogType type)
    {
        if (logToggle.isOn)
        {
            AddLogEntry(type, logString);
        }
    }
    
    private void AddLogEntry(LogType type, string message)
    {
        LogEntry entry = new LogEntry
        {
            timestamp = DateTime.Now,
            type = type,
            message = message
        };
        
        logEntries.Add(entry);
        
        // Limit size of log
        if (logEntries.Count > maxLogEntries)
        {
            logEntries.RemoveAt(0);
        }
    }
    
    private void ToggleLogCollection(bool isOn)
    {
        if (isOn)
        {
            Debug.Log("[DebugManager] Log collection enabled");
        }
        else
        {
            Debug.Log("[DebugManager] Log collection disabled");
            logEntries.Clear();
        }
    }
    
    private void TogglePerformanceMonitoring(bool isOn)
    {
        if (isOn)
        {
            Debug.Log("[DebugManager] Performance monitoring enabled");
        }
        else
        {
            Debug.Log("[DebugManager] Performance monitoring disabled");
        }
    }
    
    // Dependency checking
    public void CheckDependencies()
    {
        Debug.Log("[DebugManager] Checking system dependencies...");
        
        // Check key dependencies between systems
        if (virtualPet != null && emotionEngine != null)
        {
            // VirtualPet should affect EmotionEngine
            bool connected = false;
            foreach (var del in virtualPet.OnStatsChanged.GetPersistentEventCount())
            {
                // This is an approximation, as we can't directly inspect delegates
                connected = true;
                break;
            }
            
            Debug.Log($"[DebugManager] VirtualPet -> EmotionEngine connection: {(connected ? "OK" : "MISSING")}");
        }
        
        // Check save system
        if (saveSystem != null && virtualPet != null)
        {
            Debug.Log("[DebugManager] Testing save system...");
            // Attempt to save and load
            saveSystem.SaveGame();
            saveSystem.LoadGame();
            Debug.Log("[DebugManager] Save system test complete");
        }
        
        // Check AR foundational systems
        if (arPlacement != null)
        {
            Debug.Log($"[DebugManager] AR Foundation status: {(arPlacement.IsARAvailable() ? "Available" : "Not Available")}");
        }
        
        // Report any missing core systems
        List<string> missingSystems = new List<string>();
        foreach (var system in systemStatus)
        {
            if (!system.Value)
            {
                missingSystems.Add(system.Key);
            }
        }
        
        if (missingSystems.Count > 0)
        {
            Debug.LogWarning($"[DebugManager] Missing core systems: {string.Join(", ", missingSystems)}");
        }
        else
        {
            Debug.Log("[DebugManager] All core systems present");
        }
    }
    
    // Editor Gizmos
    private void OnDrawGizmos()
    {
        if (!Application.isPlaying) return;
        
        if (showARPlacementGizmos && arPlacement != null)
        {
            // Draw AR surface detection
            Vector3 position = arPlacement.GetCurrentPlacement();
            Gizmos.color = Color.green;
            Gizmos.DrawWireSphere(position, 0.1f);
            Gizmos.DrawLine(position, position + Vector3.up * 0.5f);
        }
        
        if (showPhysicsGizmos && physicsInteractionSystem != null)
        {
            // Draw interaction points
            Gizmos.color = Color.blue;
            foreach (var point in physicsInteractionSystem.GetInteractionPoints())
            {
                Gizmos.DrawSphere(point, 0.05f);
            }
        }
        
        if (showRaycastGizmos && Input.touchCount > 0)
        {
            // Draw touch raycast
            Camera mainCamera = Camera.main;
            if (mainCamera != null)
            {
                Touch touch = Input.GetTouch(0);
                Ray ray = mainCamera.ScreenPointToRay(touch.position);
                Gizmos.color = Color.yellow;
                Gizmos.DrawRay(ray.origin, ray.direction * 10f);
            }
        }
    }
    
    public void ExportDiagnostics()
    {
        StringBuilder sb = new StringBuilder();
        
        sb.AppendLine("=== PIGGY DIAGNOSTICS REPORT ===");
        sb.AppendLine($"Generated: {DateTime.Now}");
        sb.AppendLine($"Device: {SystemInfo.deviceModel}");
        sb.AppendLine($"OS: {SystemInfo.operatingSystem}");
        sb.AppendLine($"Memory: {SystemInfo.systemMemorySize} MB");
        sb.AppendLine($"Graphics: {SystemInfo.graphicsDeviceName}");
        sb.AppendLine("===== SYSTEM STATUS =====");
        
        foreach (var system in systemStatus)
        {
            sb.AppendLine($"{system.Key}: {(system.Value ? "Active" : "Missing")}");
        }
        
        sb.AppendLine("===== RECENT LOGS =====");
        foreach (var log in logEntries.TakeLast(50))
        {
            sb.AppendLine($"[{log.timestamp.ToString("HH:mm:ss")}] {log.type}: {log.message}");
        }
        
        // Save to file
        string path = Application.persistentDataPath + "/diagnostics.txt";
        System.IO.File.WriteAllText(path, sb.ToString());
        
        Debug.Log($"[DebugManager] Diagnostics exported to: {path}");
    }
    
    private void OnDestroy()
    {
        Application.logMessageReceived -= HandleLog;
    }
}

// Stats panel component
public class StatsPanel : MonoBehaviour
{
    [SerializeField] private TMP_Text titleText;
    [SerializeField] private TMP_Text statsText;
    [SerializeField] private Image statusImage;
    
    public void Initialize(string systemName)
    {
        titleText.text = systemName;
    }
    
    public void PopulateStats(List<string> stats)
    {
        statsText.text = string.Join("\n", stats);
    }
    
    public void SetStatus(bool isActive)
    {
        statusImage.color = isActive ? Color.green : Color.red;
    }
}

// Log entry structure
[System.Serializable]
public class LogEntry
{
    public DateTime timestamp;
    public LogType type;
    public string message;
}

// Extension for ARPlacement
public static class ARPlacementExtensions
{
    public static bool IsARAvailable(this ARPlacement arPlacement)
    {
        if (arPlacement == null) return false;
        
        // This would check if AR Foundation is properly initialized
        return true; // Replace with actual implementation
    }
}

// Extension for PhysicsInteractionSystem
public static class PhysicsInteractionExtensions
{
    public static List<Vector3> GetInteractionPoints(this PhysicsInteractionSystem system)
    {
        if (system == null) return new List<Vector3>();
        
        // This would return the active interaction points
        return new List<Vector3>(); // Replace with actual implementation
    }
}