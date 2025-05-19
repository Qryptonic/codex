using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Linq;

public class DebugUIView : MonoBehaviour
{
    [Header("Debug Log Panel")]
    [SerializeField] private GameObject logPanel;
    [SerializeField] private RectTransform logContainer;
    [SerializeField] private GameObject logEntryPrefab;
    [SerializeField] private TMP_Dropdown logFilterDropdown;
    [SerializeField] private Button clearLogsButton;
    [SerializeField] private Toggle autoScrollToggle;
    [SerializeField] private int maxVisibleLogs = 100;

    [Header("System Monitor Panel")]
    [SerializeField] private GameObject systemMonitorPanel;
    [SerializeField] private Button refreshSystemsButton;
    [SerializeField] private RectTransform systemsContainer;
    [SerializeField] private GameObject systemStatusPrefab;
    
    [Header("Performance Panel")]
    [SerializeField] private GameObject performancePanel;
    [SerializeField] private TMP_Text fpsText;
    [SerializeField] private TMP_Text memoryText;
    [SerializeField] private TMP_Text drawCallsText;
    [SerializeField] private Image cpuGraph;
    [SerializeField] private Image gpuGraph;
    
    [Header("AR Debug Panel")]
    [SerializeField] private GameObject arDebugPanel;
    [SerializeField] private TMP_Text arStatusText;
    [SerializeField] private TMP_Text trackingText;
    [SerializeField] private Toggle showARPlanesToggle;
    [SerializeField] private Toggle showPointCloudToggle;
    
    [Header("Tools")]
    [SerializeField] private Button exportDiagnosticsButton;
    [SerializeField] private Button forceCrashButton;
    [SerializeField] private Button resetDataButton;
    [SerializeField] private TMP_Text buildInfoText;

    private DebugManager debugManager;
    private List<GameObject> instantiatedLogEntries = new List<GameObject>();
    private LogType currentLogFilter = LogType.Log;
    private bool autoScroll = true;
    
    private void Start()
    {
        debugManager = FindObjectOfType<DebugManager>();
        if (debugManager == null)
        {
            Debug.LogError("DebugUIView: DebugManager not found in scene!");
            return;
        }
        
        SetupUI();
        PopulateSystemStatus();
        UpdateBuildInfo();
        
        // Initial log panel setup
        logFilterDropdown.onValueChanged.AddListener(OnLogFilterChanged);
        clearLogsButton.onClick.AddListener(ClearLogs);
        autoScrollToggle.onValueChanged.AddListener(ToggleAutoScroll);
        
        // System monitor setup
        refreshSystemsButton.onClick.AddListener(PopulateSystemStatus);
        
        // Tools setup
        exportDiagnosticsButton.onClick.AddListener(ExportDiagnostics);
        forceCrashButton.onClick.AddListener(ForceCrash);
        resetDataButton.onClick.AddListener(ResetAllData);
        
        // AR debug setup
        showARPlanesToggle.onValueChanged.AddListener(ToggleARPlaneVisibility);
        showPointCloudToggle.onValueChanged.AddListener(TogglePointCloudVisibility);
    }
    
    private void Update()
    {
        if (performancePanel.activeSelf)
        {
            UpdatePerformancePanel();
        }
        
        if (arDebugPanel.activeSelf)
        {
            UpdateARDebugPanel();
        }
    }
    
    private void SetupUI()
    {
        // Populate log filter dropdown
        logFilterDropdown.ClearOptions();
        logFilterDropdown.AddOptions(new List<string> { "All", "Info", "Warning", "Error" });
        
        // Set up tab navigation
        SetActivePanel(logPanel);
    }
    
    public void SetActivePanel(GameObject panel)
    {
        logPanel.SetActive(panel == logPanel);
        systemMonitorPanel.SetActive(panel == systemMonitorPanel);
        performancePanel.SetActive(panel == performancePanel);
        arDebugPanel.SetActive(panel == arDebugPanel);
    }
    
    // Log Panel Methods
    public void AddLogEntry(LogEntry logEntry)
    {
        // Filter logs based on selection
        bool shouldDisplay = ShouldDisplayLog(logEntry.type);
        
        if (shouldDisplay)
        {
            GameObject entryObj = Instantiate(logEntryPrefab, logContainer);
            TMP_Text logText = entryObj.GetComponentInChildren<TMP_Text>();
            Image background = entryObj.GetComponent<Image>();
            
            // Format time
            string timeStr = logEntry.timestamp.ToString("HH:mm:ss.fff");
            
            // Set text content
            logText.text = $"[{timeStr}] {logEntry.message}";
            
            // Set color based on log type
            switch (logEntry.type)
            {
                case LogType.Error:
                case LogType.Exception:
                case LogType.Assert:
                    background.color = new Color(0.8f, 0.3f, 0.3f, 0.5f);
                    break;
                case LogType.Warning:
                    background.color = new Color(0.8f, 0.8f, 0.3f, 0.5f);
                    break;
                default:
                    background.color = new Color(0.2f, 0.2f, 0.2f, 0.5f);
                    break;
            }
            
            instantiatedLogEntries.Add(entryObj);
            
            // Limit displayed logs
            if (instantiatedLogEntries.Count > maxVisibleLogs)
            {
                GameObject oldestEntry = instantiatedLogEntries[0];
                instantiatedLogEntries.RemoveAt(0);
                Destroy(oldestEntry);
            }
            
            // Auto-scroll
            if (autoScroll)
            {
                Canvas.ForceUpdateCanvases();
                ((RectTransform)logContainer.transform).anchoredPosition = 
                    new Vector2(((RectTransform)logContainer.transform).anchoredPosition.x, 0);
            }
        }
    }
    
    private bool ShouldDisplayLog(LogType type)
    {
        if (currentLogFilter == LogType.Log) // "All" selected
            return true;
            
        return type == currentLogFilter;
    }
    
    private void OnLogFilterChanged(int value)
    {
        switch (value)
        {
            case 0: currentLogFilter = LogType.Log; break; // All
            case 1: currentLogFilter = LogType.Log; break; // Info
            case 2: currentLogFilter = LogType.Warning; break;
            case 3: currentLogFilter = LogType.Error; break;
            default: currentLogFilter = LogType.Log; break;
        }
        
        RefreshLogDisplay();
    }
    
    private void RefreshLogDisplay()
    {
        ClearLogs();
        // Would refresh logs from DebugManager's stored logs
    }
    
    private void ClearLogs()
    {
        foreach (var entry in instantiatedLogEntries)
        {
            Destroy(entry);
        }
        instantiatedLogEntries.Clear();
    }
    
    private void ToggleAutoScroll(bool value)
    {
        autoScroll = value;
    }
    
    // System Monitor Methods
    private void PopulateSystemStatus()
    {
        // Clear existing entries
        foreach (Transform child in systemsContainer)
        {
            Destroy(child.gameObject);
        }
        
        // Get all systems
        Dictionary<string, bool> systemStatus = debugManager.GetSystemStatus();
        
        foreach (var system in systemStatus)
        {
            GameObject statusObj = Instantiate(systemStatusPrefab, systemsContainer);
            SystemStatusUI statusUI = statusObj.GetComponent<SystemStatusUI>();
            
            if (statusUI != null)
            {
                statusUI.SetSystem(system.Key, system.Value);
            }
        }
    }
    
    // Performance Panel Methods
    private void UpdatePerformancePanel()
    {
        // Update FPS
        float fps = 1.0f / Time.unscaledDeltaTime;
        fpsText.text = $"FPS: {fps:F1}";
        
        // Color based on performance
        if (fps < 30)
            fpsText.color = Color.red;
        else if (fps < 45)
            fpsText.color = Color.yellow;
        else
            fpsText.color = Color.green;
        
        // Memory usage
        float memoryUsage = System.GC.GetTotalMemory(false) / (1024f * 1024f); // MB
        memoryText.text = $"Memory: {memoryUsage:F1} MB";
        
        // Draw calls (Unity Profiler required)
        drawCallsText.text = $"Draw Calls: {UnityEngine.Rendering.DebugManager.instance != null ? "See Profiler" : "N/A"}";
        
        // Update CPU/GPU load indicators
        // In a real implementation, these would be tracked over time with proper monitoring
        cpuGraph.fillAmount = Mathf.Lerp(cpuGraph.fillAmount, Mathf.Clamp01(1.0f / fps / 0.033f), Time.deltaTime * 2);
        gpuGraph.fillAmount = Mathf.Lerp(gpuGraph.fillAmount, Mathf.Clamp01((1.0f / fps) / 0.033f * 0.8f), Time.deltaTime * 2);
    }
    
    // AR Debug Panel Methods
    private void UpdateARDebugPanel()
    {
        // This would be connected to ARPlacement or similar system
        bool arAvailable = FindObjectOfType<ARPlacement>() != null;
        
        arStatusText.text = $"AR Status: {(arAvailable ? "Available" : "Not Available")}";
        trackingText.text = $"Tracking: {(arAvailable ? "Active" : "Inactive")}";
    }
    
    private void ToggleARPlaneVisibility(bool isVisible)
    {
        var arPlacement = FindObjectOfType<ARPlacement>();
        if (arPlacement != null)
        {
            // arPlacement.SetPlaneVisualizationActive(isVisible);
            Debug.Log($"[DebugUIView] AR plane visualization: {(isVisible ? "ON" : "OFF")}");
        }
    }
    
    private void TogglePointCloudVisibility(bool isVisible)
    {
        var arPlacement = FindObjectOfType<ARPlacement>();
        if (arPlacement != null)
        {
            // arPlacement.SetPointCloudVisualizationActive(isVisible);
            Debug.Log($"[DebugUIView] AR point cloud visualization: {(isVisible ? "ON" : "OFF")}");
        }
    }
    
    // Tools Methods
    private void ExportDiagnostics()
    {
        debugManager.ExportDiagnostics();
        
        // Show feedback
        StartCoroutine(ShowToast("Diagnostics exported!"));
    }
    
    private void ForceCrash()
    {
        // Show confirmation dialog
        bool confirmed = EditorUtility.DisplayDialog(
            "Force Crash",
            "Are you sure you want to force a crash for testing purposes?",
            "Yes", "Cancel");
            
        if (confirmed)
        {
            Debug.LogError("FORCED CRASH TRIGGERED BY DEBUG MENU");
            // Force division by zero
            int zero = 0;
            int crash = 1 / zero;
        }
    }
    
    private void ResetAllData()
    {
        // Show confirmation dialog
        bool confirmed = EditorUtility.DisplayDialog(
            "Reset All Data",
            "This will delete ALL game data including saves, progress, and settings. Are you sure?",
            "Yes, Reset Everything", "Cancel");
            
        if (confirmed)
        {
            PlayerPrefs.DeleteAll();
            Debug.Log("[DebugUIView] All PlayerPrefs data deleted");
            
            // Delete any save files
            var saveSystem = FindObjectOfType<SaveSystem>();
            if (saveSystem != null)
            {
                saveSystem.DeleteAllSaves();
            }
            
            StartCoroutine(ShowToast("All data reset! App restart recommended."));
        }
    }
    
    private void UpdateBuildInfo()
    {
        buildInfoText.text = $"Build: {Application.version} ({Application.buildGUID})\n" +
                            $"Unity: {Application.unityVersion}\n" +
                            $"Platform: {Application.platform}";
    }
    
    private IEnumerator ShowToast(string message)
    {
        // This would show a toast notification
        Debug.Log($"[DebugUIView] TOAST: {message}");
        yield return new WaitForSeconds(2.0f);
    }
}

// UI for system status entry
public class SystemStatusUI : MonoBehaviour
{
    [SerializeField] private TMP_Text systemNameText;
    [SerializeField] private Image statusIndicator;
    [SerializeField] private Button viewDetailsButton;
    
    private string systemName;
    
    public void SetSystem(string name, bool isActive)
    {
        systemName = name;
        systemNameText.text = name;
        statusIndicator.color = isActive ? Color.green : Color.red;
        
        viewDetailsButton.onClick.AddListener(ViewSystemDetails);
    }
    
    private void ViewSystemDetails()
    {
        // Would show detailed system info dialog
        Debug.Log($"[DebugUIView] Showing details for system: {systemName}");
    }
}