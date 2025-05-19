using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System;
using System.Reflection;
using System.Linq;

public class DebugConsole : MonoBehaviour
{
    [Header("Console UI")]
    [SerializeField] private GameObject consolePanel;
    [SerializeField] private TMP_InputField inputField;
    [SerializeField] private RectTransform outputContainer;
    [SerializeField] private GameObject commandOutputPrefab;
    [SerializeField] private TMP_Text commandHistoryText;
    [SerializeField] private Button submitButton;
    [SerializeField] private Button clearButton;
    [SerializeField] private TMP_Dropdown commandHistoryDropdown;

    [Header("Settings")]
    [SerializeField] private int maxCommandHistory = 20;
    [SerializeField] private int maxOutputEntries = 100;
    [SerializeField] private KeyCode toggleKey = KeyCode.BackQuote;

    // Command history
    private List<string> commandHistory = new List<string>();
    private List<GameObject> outputEntries = new List<GameObject>();
    private int historyIndex = -1;

    // Dictionary of registered commands
    private Dictionary<string, CommandInfo> commands = new Dictionary<string, CommandInfo>();

    // References to game systems
    private DebugManager debugManager;
    private VirtualPetUnity virtualPet;
    private SaveSystem saveSystem;
    private NotificationManager notificationManager;
    private EmotionEngine emotionEngine;

    private void Awake()
    {
        // Hide by default
        consolePanel.SetActive(false);
        
        // Find references
        debugManager = FindObjectOfType<DebugManager>();
        virtualPet = FindObjectOfType<VirtualPetUnity>();
        saveSystem = FindObjectOfType<SaveSystem>();
        notificationManager = FindObjectOfType<NotificationManager>();
        emotionEngine = FindObjectOfType<EmotionEngine>();
        
        RegisterCommands();
    }

    private void Start()
    {
        // Set up UI
        inputField.onEndEdit.AddListener(OnInputSubmit);
        submitButton.onClick.AddListener(ExecuteCurrentCommand);
        clearButton.onClick.AddListener(ClearOutput);
        commandHistoryDropdown.onValueChanged.AddListener(SelectHistoryCommand);
        
        // Initial help text
        AddOutput("<color=#AAFFAA>Piggy Debug Console</color>\nType <color=#FFFF00>help</color> for a list of commands", false);
    }

    private void Update()
    {
        // Toggle console with backtick key
        if (Input.GetKeyDown(toggleKey))
        {
            ToggleConsole();
        }
        
        // Navigate history with up/down arrows when input field is focused
        if (inputField.isFocused)
        {
            if (Input.GetKeyDown(KeyCode.UpArrow))
            {
                NavigateHistory(-1);
            }
            else if (Input.GetKeyDown(KeyCode.DownArrow))
            {
                NavigateHistory(1);
            }
        }
    }

    public void ToggleConsole()
    {
        consolePanel.SetActive(!consolePanel.activeSelf);
        
        if (consolePanel.activeSelf)
        {
            inputField.Select();
            inputField.ActivateInputField();
        }
    }

    private void RegisterCommands()
    {
        // System Commands
        RegisterCommand("help", "Show list of available commands", CmdHelp);
        RegisterCommand("clear", "Clear console output", CmdClear);
        RegisterCommand("version", "Show game version", CmdVersion);
        RegisterCommand("fps", "Toggle FPS display", CmdFps);
        RegisterCommand("info", "Show system information", CmdInfo);
        RegisterCommand("quit", "Quit the game", CmdQuit);
        RegisterCommand("scene", "Load a scene by name", CmdScene);
        
        // Game Commands
        RegisterCommand("stats", "Show pet stats", CmdStats);
        RegisterCommand("heal", "Heal the pet to max health", CmdHeal);
        RegisterCommand("feed", "Feed the pet", CmdFeed);
        RegisterCommand("drink", "Give the pet water", CmdDrink);
        RegisterCommand("play", "Play with the pet", CmdPlay);
        RegisterCommand("unlock", "Unlock a specific item or feature", CmdUnlock);
        RegisterCommand("emotion", "Set pet emotion", CmdEmotion);
        
        // Debug Commands
        RegisterCommand("save", "Save game data", CmdSave);
        RegisterCommand("load", "Load game data", CmdLoad);
        RegisterCommand("delete", "Delete saved data", CmdDelete);
        RegisterCommand("notify", "Show test notification", CmdNotify);
        RegisterCommand("reset", "Reset game to initial state", CmdReset);
        RegisterCommand("stress", "Run stress test", CmdStress);
        RegisterCommand("check", "Check system dependencies", CmdCheck);
        RegisterCommand("export", "Export diagnostics", CmdExport);
    }

    private void RegisterCommand(string name, string description, Func<string[], string> handler)
    {
        commands[name.ToLower()] = new CommandInfo
        {
            name = name.ToLower(),
            description = description,
            handler = handler
        };
    }

    private void OnInputSubmit(string text)
    {
        if (Input.GetKeyDown(KeyCode.Return) || Input.GetKeyDown(KeyCode.KeypadEnter))
        {
            ExecuteCurrentCommand();
        }
    }

    private void ExecuteCurrentCommand()
    {
        string input = inputField.text.Trim();
        
        if (string.IsNullOrEmpty(input))
            return;
            
        AddToHistory(input);
        
        string result = ExecuteCommand(input);
        AddOutput($"<color=#AAAAFF>> {input}</color>\n{result}");
        
        inputField.text = "";
        inputField.Select();
        inputField.ActivateInputField();
    }

    private string ExecuteCommand(string input)
    {
        // Parse command and arguments
        string[] parts = input.Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 0)
            return "Empty command";
            
        string cmd = parts[0].ToLower();
        string[] args = parts.Skip(1).ToArray();
        
        // Execute command
        if (commands.ContainsKey(cmd))
        {
            try
            {
                return commands[cmd].handler(args);
            }
            catch (Exception ex)
            {
                return $"<color=#FF6666>Error executing command: {ex.Message}</color>";
            }
        }
        else
        {
            return $"<color=#FF6666>Unknown command: '{cmd}'. Type 'help' for a list of commands.</color>";
        }
    }

    private void AddOutput(string text, bool addTimestamp = true)
    {
        GameObject entryObj = Instantiate(commandOutputPrefab, outputContainer);
        TMP_Text outputText = entryObj.GetComponentInChildren<TMP_Text>();
        
        string timestamp = addTimestamp ? $"[{DateTime.Now.ToString("HH:mm:ss")}] " : "";
        outputText.text = timestamp + text;
        
        outputEntries.Add(entryObj);
        
        // Limit entries
        if (outputEntries.Count > maxOutputEntries)
        {
            GameObject oldestEntry = outputEntries[0];
            outputEntries.RemoveAt(0);
            Destroy(oldestEntry);
        }
        
        // Scroll to bottom
        Canvas.ForceUpdateCanvases();
        ((RectTransform)outputContainer.transform).anchoredPosition = 
            new Vector2(((RectTransform)outputContainer.transform).anchoredPosition.x, 0);
    }
    
    private void AddToHistory(string command)
    {
        // Don't add duplicate of last command
        if (commandHistory.Count > 0 && commandHistory[commandHistory.Count - 1] == command)
            return;
            
        commandHistory.Add(command);
        
        // Limit history size
        if (commandHistory.Count > maxCommandHistory)
        {
            commandHistory.RemoveAt(0);
        }
        
        // Reset history navigation index
        historyIndex = -1;
        
        // Update dropdown
        UpdateHistoryDropdown();
    }
    
    private void UpdateHistoryDropdown()
    {
        commandHistoryDropdown.ClearOptions();
        
        List<string> options = new List<string> { "Command History" };
        options.AddRange(commandHistory.AsEnumerable().Reverse());
        
        commandHistoryDropdown.AddOptions(options);
    }
    
    private void NavigateHistory(int direction)
    {
        if (commandHistory.Count == 0)
            return;
            
        historyIndex = Mathf.Clamp(historyIndex + direction, -1, commandHistory.Count - 1);
        
        if (historyIndex == -1)
        {
            inputField.text = "";
        }
        else
        {
            inputField.text = commandHistory[commandHistory.Count - 1 - historyIndex];
            inputField.MoveToEndOfLine(false, false);
        }
    }
    
    private void SelectHistoryCommand(int index)
    {
        if (index <= 0)
            return;
            
        inputField.text = commandHistoryDropdown.options[index].text;
        inputField.Select();
        inputField.ActivateInputField();
        inputField.MoveToEndOfLine(false, false);
        
        // Reset dropdown
        commandHistoryDropdown.value = 0;
    }
    
    private void ClearOutput()
    {
        foreach (var entry in outputEntries)
        {
            Destroy(entry);
        }
        outputEntries.Clear();
    }
    
    // Command Handlers
    
    private string CmdHelp(string[] args)
    {
        string result = "<color=#AAFFAA>Available Commands:</color>\n";
        
        foreach (var command in commands.Values.OrderBy(c => c.name))
        {
            result += $"<color=#FFFF00>{command.name}</color> - {command.description}\n";
        }
        
        return result;
    }
    
    private string CmdClear(string[] args)
    {
        ClearOutput();
        return "";
    }
    
    private string CmdVersion(string[] args)
    {
        return $"Piggy Version: {Application.version}\n" +
               $"Unity Version: {Application.unityVersion}\n" +
               $"Build Date: {GetBuildDate()}";
    }
    
    private string CmdFps(string[] args)
    {
        if (debugManager != null)
        {
            bool currentState = debugManager.IsFpsDisplayEnabled();
            bool newState = !currentState;
            debugManager.SetFpsDisplayEnabled(newState);
            return $"FPS display {(newState ? "enabled" : "disabled")}";
        }
        
        return "DebugManager not found";
    }
    
    private string CmdInfo(string[] args)
    {
        return $"Device: {SystemInfo.deviceModel}\n" +
               $"OS: {SystemInfo.operatingSystem}\n" +
               $"CPU: {SystemInfo.processorType}, {SystemInfo.processorCount} cores\n" +
               $"RAM: {SystemInfo.systemMemorySize} MB\n" +
               $"GPU: {SystemInfo.graphicsDeviceName}\n" +
               $"Screen: {Screen.width}x{Screen.height} @ {Screen.dpi} DPI";
    }
    
    private string CmdQuit(string[] args)
    {
        Application.Quit();
        return "Quitting application...";
    }
    
    private string CmdScene(string[] args)
    {
        if (args.Length < 1)
            return "Usage: scene <scene_name>";
            
        string sceneName = args[0];
        
        try
        {
            UnityEngine.SceneManagement.SceneManager.LoadScene(sceneName);
            return $"Loading scene: {sceneName}";
        }
        catch (Exception ex)
        {
            return $"Error loading scene: {ex.Message}";
        }
    }
    
    private string CmdStats(string[] args)
    {
        if (virtualPet == null)
            return "VirtualPet not found";
            
        return $"Pet Stats:\n" +
               $"Hunger: {virtualPet.Hunger:F1}\n" +
               $"Thirst: {virtualPet.Thirst:F1}\n" +
               $"Happiness: {virtualPet.Happiness:F1}\n" +
               $"Health: {virtualPet.Health:F1}\n" +
               $"Affection: {affectionMeter?.GetAffectionLevel() ?? 0:F1}";
    }
    
    private string CmdHeal(string[] args)
    {
        if (virtualPet == null)
            return "VirtualPet not found";
            
        virtualPet.Health = 100f;
        virtualPet.Hunger = 100f;
        virtualPet.Thirst = 100f;
        virtualPet.Happiness = 100f;
        
        return "Pet healed to full health";
    }
    
    private string CmdFeed(string[] args)
    {
        if (virtualPet == null)
            return "VirtualPet not found";
            
        float amount = 25f;
        if (args.Length > 0 && float.TryParse(args[0], out float customAmount))
        {
            amount = customAmount;
        }
        
        virtualPet.Feed(amount);
        return $"Fed pet (+{amount} hunger)";
    }
    
    private string CmdDrink(string[] args)
    {
        if (virtualPet == null)
            return "VirtualPet not found";
            
        float amount = 25f;
        if (args.Length > 0 && float.TryParse(args[0], out float customAmount))
        {
            amount = customAmount;
        }
        
        virtualPet.Drink(amount);
        return $"Pet drank water (+{amount} thirst)";
    }
    
    private string CmdPlay(string[] args)
    {
        if (virtualPet == null)
            return "VirtualPet not found";
            
        float amount = 25f;
        if (args.Length > 0 && float.TryParse(args[0], out float customAmount))
        {
            amount = customAmount;
        }
        
        virtualPet.Play(amount);
        return $"Played with pet (+{amount} happiness)";
    }
    
    private string CmdUnlock(string[] args)
    {
        if (args.Length < 1)
            return "Usage: unlock <item_name>";
            
        string itemName = args[0];
        
        // Implement this based on your unlock system
        if (achievementManager != null)
        {
            achievementManager.UnlockAchievement(itemName);
            return $"Unlocked: {itemName}";
        }
        
        return "Unlock system not found";
    }
    
    private string CmdEmotion(string[] args)
    {
        if (emotionEngine == null)
            return "EmotionEngine not found";
            
        if (args.Length < 1)
            return "Usage: emotion <emotion_name> [intensity]";
            
        string emotionName = args[0];
        float intensity = 1.0f;
        
        if (args.Length > 1 && float.TryParse(args[1], out float customIntensity))
        {
            intensity = Mathf.Clamp01(customIntensity);
        }
        
        emotionEngine.SetEmotion(emotionName, intensity);
        return $"Set pet emotion to {emotionName} (intensity: {intensity:F2})";
    }
    
    private string CmdSave(string[] args)
    {
        if (saveSystem == null)
            return "SaveSystem not found";
            
        try
        {
            saveSystem.SaveGame();
            return "Game saved successfully";
        }
        catch (Exception ex)
        {
            return $"Error saving game: {ex.Message}";
        }
    }
    
    private string CmdLoad(string[] args)
    {
        if (saveSystem == null)
            return "SaveSystem not found";
            
        try
        {
            saveSystem.LoadGame();
            return "Game loaded successfully";
        }
        catch (Exception ex)
        {
            return $"Error loading game: {ex.Message}";
        }
    }
    
    private string CmdDelete(string[] args)
    {
        if (saveSystem == null)
            return "SaveSystem not found";
            
        try
        {
            saveSystem.DeleteAllSaves();
            return "All save data deleted";
        }
        catch (Exception ex)
        {
            return $"Error deleting saves: {ex.Message}";
        }
    }
    
    private string CmdNotify(string[] args)
    {
        if (notificationManager == null)
            return "NotificationManager not found";
            
        string message = "Test notification";
        if (args.Length > 0)
        {
            message = string.Join(" ", args);
        }
        
        notificationManager.ShowNotification(message);
        return $"Notification shown: \"{message}\"";
    }
    
    private string CmdReset(string[] args)
    {
        // Reset all systems (this is a drastic action)
        PlayerPrefs.DeleteAll();
        
        if (saveSystem != null)
        {
            saveSystem.DeleteAllSaves();
        }
        
        return "Game reset to initial state. Restart recommended.";
    }
    
    private string CmdStress(string[] args)
    {
        if (debugManager == null)
            return "DebugManager not found";
            
        int iterations = 100;
        if (args.Length > 0 && int.TryParse(args[0], out int customIterations))
        {
            iterations = customIterations;
        }
        
        debugManager.RunStressTest(iterations);
        return $"Running stress test with {iterations} iterations";
    }
    
    private string CmdCheck(string[] args)
    {
        if (debugManager == null)
            return "DebugManager not found";
            
        debugManager.CheckDependencies();
        return "System dependency check started. See logs for results.";
    }
    
    private string CmdExport(string[] args)
    {
        if (debugManager == null)
            return "DebugManager not found";
            
        string path = debugManager.ExportDiagnostics();
        return $"Diagnostics exported to: {path}";
    }
    
    // Helper methods
    
    private string GetBuildDate()
    {
        DateTime buildDate = new DateTime(2000, 1, 1).AddDays(PlayerSettings.bundleVersion.GetHashCode() % 1000);
        return buildDate.ToString("yyyy-MM-dd");
    }
    
    private void OnDestroy()
    {
        // Clean up event handlers
        inputField.onEndEdit.RemoveAllListeners();
        submitButton.onClick.RemoveAllListeners();
        clearButton.onClick.RemoveAllListeners();
        commandHistoryDropdown.onValueChanged.RemoveAllListeners();
    }
}

// Command info class
public class CommandInfo
{
    public string name;
    public string description;
    public Func<string[], string> handler;
}

// Extensions for DebugManager to support console commands
public static class DebugManagerExtensions
{
    public static bool IsFpsDisplayEnabled(this DebugManager manager)
    {
        // This would check if FPS display is enabled
        return true; // Replace with actual implementation
    }
    
    public static void SetFpsDisplayEnabled(this DebugManager manager, bool enabled)
    {
        // This would toggle FPS display
        Debug.Log($"[DebugConsole] FPS display {(enabled ? "enabled" : "disabled")}");
    }
    
    public static void RunStressTest(this DebugManager manager, int iterations)
    {
        // This would run a stress test
        Debug.Log($"[DebugConsole] Running stress test with {iterations} iterations");
    }
    
    public static string ExportDiagnostics(this DebugManager manager)
    {
        // This would export diagnostics
        manager.ExportDiagnostics();
        return Application.persistentDataPath + "/diagnostics.txt";
    }
}