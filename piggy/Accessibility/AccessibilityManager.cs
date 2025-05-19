using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UI;
using TMPro;
using System.Threading.Tasks;

/// <summary>
/// Comprehensive accessibility management system for the Piggy virtual pet game.
/// Handles color blindness modes, text size options, audio alternatives, and more.
/// </summary>
public class AccessibilityManager : MonoBehaviour
{
    [System.Serializable] public class AccessibilitySettingsChangedEvent : UnityEvent<AccessibilitySettings> { }
    
    [Header("UI Settings")]
    [SerializeField] private float[] textSizeMultipliers = { 0.8f, 1.0f, 1.2f, 1.4f, 1.6f };
    [SerializeField] private float defaultTextSizeIndex = 1; // Index 1 = 1.0x (normal)
    [SerializeField] private float uiAnimationSpeedMultiplier = 1.0f;
    [SerializeField] private bool reduceMotionEnabled = false;
    
    [Header("Color Blindness")]
    [SerializeField] private ColorScheme normalColorScheme;
    [SerializeField] private ColorScheme deuteranopiaColorScheme;
    [SerializeField] private ColorScheme protanopiaColorScheme;
    [SerializeField] private ColorScheme tritanopiaColorScheme;
    
    [Header("Audio Settings")]
    [SerializeField] private bool visualAudioCuesEnabled = false;
    [SerializeField] private GameObject visualAudioCuePrefab;
    [SerializeField] private Transform visualAudioCueContainer;
    [SerializeField] private float visualAudioCueDuration = 2.0f;
    [SerializeField] private bool screenReaderHintsEnabled = false;
    
    [Header("Controls")]
    [SerializeField] private float touchAndHoldDelay = 0.5f;
    
    [Header("AR Accessibility")]
    [SerializeField] private bool nonARModeEnabled = false;
    [SerializeField] private GameObject nonARFallbackPrefab;
    
    [Header("Events")]
    public AccessibilitySettingsChangedEvent OnSettingsChanged = new AccessibilitySettingsChangedEvent();
    
    // Dependencies
    private ILogger logger;
    private IDataPersistence dataPersistence;
    
    // Runtime state
    private AccessibilitySettings currentSettings;
    private Dictionary<string, GameObject> activeVisualCues = new Dictionary<string, GameObject>();
    private bool initialized = false;
    
    [Inject]
    public void Construct(ILogger logger, IDataPersistence dataPersistence)
    {
        this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
        this.dataPersistence = dataPersistence ?? throw new ArgumentNullException(nameof(dataPersistence));
    }
    
    private async void Start()
    {
        try
        {
            // Initialize with default settings
            currentSettings = new AccessibilitySettings
            {
                ColorBlindnessMode = ColorBlindnessMode.Normal,
                TextSizeIndex = (int)defaultTextSizeIndex,
                ReduceMotion = reduceMotionEnabled,
                VisualAudioCues = visualAudioCuesEnabled,
                ScreenReaderHints = screenReaderHintsEnabled,
                TouchAndHoldDelay = touchAndHoldDelay,
                NonARMode = nonARModeEnabled
            };
            
            // Load saved settings
            await LoadSettings();
            
            // Apply settings
            ApplySettings(currentSettings);
            
            initialized = true;
            logger.LogInfo("AccessibilityManager initialized successfully");
        }
        catch (Exception ex)
        {
            logger.LogError($"Error initializing AccessibilityManager: {ex.Message}");
            
            // Apply default settings in case of error
            ApplySettings(currentSettings);
            initialized = true;
        }
    }
    
    #region Public API
    
    /// <summary>
    /// Get the current accessibility settings.
    /// </summary>
    /// <returns>The current accessibility settings.</returns>
    public AccessibilitySettings GetSettings()
    {
        return new AccessibilitySettings(currentSettings);
    }
    
    /// <summary>
    /// Update and apply new accessibility settings.
    /// </summary>
    /// <param name="settings">The new settings to apply.</param>
    /// <returns>True if settings were applied successfully, false otherwise.</returns>
    public async Task<bool> UpdateSettings(AccessibilitySettings settings)
    {
        try
        {
            // Apply new settings
            currentSettings = new AccessibilitySettings(settings);
            ApplySettings(currentSettings);
            
            // Save settings
            await SaveSettings();
            
            // Notify listeners
            OnSettingsChanged?.Invoke(currentSettings);
            
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError($"Error updating accessibility settings: {ex.Message}");
            return false;
        }
    }
    
    /// <summary>
    /// Set the color blindness mode.
    /// </summary>
    /// <param name="mode">The color blindness mode to use.</param>
    /// <returns>True if mode was set successfully, false otherwise.</returns>
    public async Task<bool> SetColorBlindnessMode(ColorBlindnessMode mode)
    {
        try
        {
            currentSettings.ColorBlindnessMode = mode;
            ApplyColorScheme(mode);
            
            // Save settings
            await SaveSettings();
            
            // Notify listeners
            OnSettingsChanged?.Invoke(currentSettings);
            
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError($"Error setting color blindness mode: {ex.Message}");
            return false;
        }
    }
    
    /// <summary>
    /// Set the text size index.
    /// </summary>
    /// <param name="sizeIndex">The index of the text size to use (0-4).</param>
    /// <returns>True if size was set successfully, false otherwise.</returns>
    public async Task<bool> SetTextSize(int sizeIndex)
    {
        try
        {
            if (sizeIndex < 0 || sizeIndex >= textSizeMultipliers.Length)
            {
                throw new ArgumentOutOfRangeException(nameof(sizeIndex), $"Size index must be between 0 and {textSizeMultipliers.Length - 1}");
            }
            
            currentSettings.TextSizeIndex = sizeIndex;
            ApplyTextSize(sizeIndex);
            
            // Save settings
            await SaveSettings();
            
            // Notify listeners
            OnSettingsChanged?.Invoke(currentSettings);
            
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError($"Error setting text size: {ex.Message}");
            return false;
        }
    }
    
    /// <summary>
    /// Toggle the reduced motion setting.
    /// </summary>
    /// <param name="enabled">True to enable reduced motion, false to disable.</param>
    /// <returns>True if setting was updated successfully, false otherwise.</returns>
    public async Task<bool> SetReducedMotion(bool enabled)
    {
        try
        {
            currentSettings.ReduceMotion = enabled;
            ApplyReducedMotion(enabled);
            
            // Save settings
            await SaveSettings();
            
            // Notify listeners
            OnSettingsChanged?.Invoke(currentSettings);
            
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError($"Error setting reduced motion: {ex.Message}");
            return false;
        }
    }
    
    /// <summary>
    /// Toggle visual audio cues.
    /// </summary>
    /// <param name="enabled">True to enable visual audio cues, false to disable.</param>
    /// <returns>True if setting was updated successfully, false otherwise.</returns>
    public async Task<bool> SetVisualAudioCues(bool enabled)
    {
        try
        {
            currentSettings.VisualAudioCues = enabled;
            visualAudioCuesEnabled = enabled;
            
            // Save settings
            await SaveSettings();
            
            // Notify listeners
            OnSettingsChanged?.Invoke(currentSettings);
            
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError($"Error setting visual audio cues: {ex.Message}");
            return false;
        }
    }
    
    /// <summary>
    /// Toggle screen reader hints.
    /// </summary>
    /// <param name="enabled">True to enable screen reader hints, false to disable.</param>
    /// <returns>True if setting was updated successfully, false otherwise.</returns>
    public async Task<bool> SetScreenReaderHints(bool enabled)
    {
        try
        {
            currentSettings.ScreenReaderHints = enabled;
            screenReaderHintsEnabled = enabled;
            
            // Save settings
            await SaveSettings();
            
            // Notify listeners
            OnSettingsChanged?.Invoke(currentSettings);
            
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError($"Error setting screen reader hints: {ex.Message}");
            return false;
        }
    }
    
    /// <summary>
    /// Set the touch and hold delay.
    /// </summary>
    /// <param name="delay">The delay in seconds.</param>
    /// <returns>True if setting was updated successfully, false otherwise.</returns>
    public async Task<bool> SetTouchAndHoldDelay(float delay)
    {
        try
        {
            if (delay < 0.1f || delay > 2.0f)
            {
                throw new ArgumentOutOfRangeException(nameof(delay), "Delay must be between 0.1 and 2.0 seconds");
            }
            
            currentSettings.TouchAndHoldDelay = delay;
            touchAndHoldDelay = delay;
            
            // Save settings
            await SaveSettings();
            
            // Notify listeners
            OnSettingsChanged?.Invoke(currentSettings);
            
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError($"Error setting touch and hold delay: {ex.Message}");
            return false;
        }
    }
    
    /// <summary>
    /// Toggle non-AR mode.
    /// </summary>
    /// <param name="enabled">True to enable non-AR mode, false to disable.</param>
    /// <returns>True if setting was updated successfully, false otherwise.</returns>
    public async Task<bool> SetNonARMode(bool enabled)
    {
        try
        {
            currentSettings.NonARMode = enabled;
            nonARModeEnabled = enabled;
            
            ApplyNonARMode(enabled);
            
            // Save settings
            await SaveSettings();
            
            // Notify listeners
            OnSettingsChanged?.Invoke(currentSettings);
            
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError($"Error setting non-AR mode: {ex.Message}");
            return false;
        }
    }
    
    /// <summary>
    /// Get the color scheme for the current color blindness mode.
    /// </summary>
    /// <returns>The current color scheme.</returns>
    public ColorScheme GetCurrentColorScheme()
    {
        return GetColorScheme(currentSettings.ColorBlindnessMode);
    }
    
    /// <summary>
    /// Get the color scheme for a specific color blindness mode.
    /// </summary>
    /// <param name="mode">The color blindness mode.</param>
    /// <returns>The color scheme for the specified mode.</returns>
    public ColorScheme GetColorScheme(ColorBlindnessMode mode)
    {
        switch (mode)
        {
            case ColorBlindnessMode.Deuteranopia:
                return deuteranopiaColorScheme;
            case ColorBlindnessMode.Protanopia:
                return protanopiaColorScheme;
            case ColorBlindnessMode.Tritanopia:
                return tritanopiaColorScheme;
            default:
                return normalColorScheme;
        }
    }
    
    /// <summary>
    /// Get the current text size multiplier.
    /// </summary>
    /// <returns>The text size multiplier.</returns>
    public float GetTextSizeMultiplier()
    {
        int index = Mathf.Clamp(currentSettings.TextSizeIndex, 0, textSizeMultipliers.Length - 1);
        return textSizeMultipliers[index];
    }
    
    /// <summary>
    /// Create a visual audio cue.
    /// </summary>
    /// <param name="audioType">The type of audio (e.g., "feed", "drink", "play").</param>
    /// <param name="position">The position in world space.</param>
    /// <param name="color">The color of the visual cue.</param>
    public void CreateVisualAudioCue(string audioType, Vector3 position, Color color)
    {
        if (!visualAudioCuesEnabled || visualAudioCuePrefab == null || visualAudioCueContainer == null)
        {
            return;
        }
        
        try
        {
            // Check if we already have an active cue for this audio type
            if (activeVisualCues.TryGetValue(audioType, out GameObject existingCue) && existingCue != null)
            {
                // Update existing cue
                existingCue.transform.position = position;
                var image = existingCue.GetComponentInChildren<Image>();
                if (image != null)
                {
                    image.color = color;
                }
                
                // Reset the timer
                StartCoroutine(RemoveVisualCueAfterDelay(audioType, visualAudioCueDuration));
                return;
            }
            
            // Create new visual cue
            GameObject cue = Instantiate(visualAudioCuePrefab, position, Quaternion.identity, visualAudioCueContainer);
            cue.name = $"VisualCue_{audioType}";
            
            // Set color
            var cueImage = cue.GetComponentInChildren<Image>();
            if (cueImage != null)
            {
                cueImage.color = color;
            }
            
            // Set text
            var cueText = cue.GetComponentInChildren<TMP_Text>();
            if (cueText != null)
            {
                cueText.text = audioType.ToUpper();
            }
            
            // Add to active cues
            activeVisualCues[audioType] = cue;
            
            // Remove after delay
            StartCoroutine(RemoveVisualCueAfterDelay(audioType, visualAudioCueDuration));
        }
        catch (Exception ex)
        {
            logger.LogError($"Error creating visual audio cue: {ex.Message}");
        }
    }
    
    /// <summary>
    /// Provide a screen reader hint for UI element focus.
    /// </summary>
    /// <param name="elementName">The name of the UI element.</param>
    /// <param name="description">A description of the element's function.</param>
    /// <param name="value">Optional current value of the element.</param>
    public void ProvideScreenReaderHint(string elementName, string description, string value = null)
    {
        if (!screenReaderHintsEnabled)
        {
            return;
        }
        
        try
        {
            // Construct hint text
            string hintText = elementName;
            
            if (!string.IsNullOrEmpty(description))
            {
                hintText += $", {description}";
            }
            
            if (!string.IsNullOrEmpty(value))
            {
                hintText += $", {value}";
            }
            
            // Set UI accessibility properties
            // In a real implementation, this would interact with the platform's screen reader
            // For Unity, you might use custom accessibility plugins
            
            logger.LogInfo($"Screen reader hint: {hintText}");
        }
        catch (Exception ex)
        {
            logger.LogError($"Error providing screen reader hint: {ex.Message}");
        }
    }
    
    #endregion
    
    #region Implementation Methods
    
    private void ApplySettings(AccessibilitySettings settings)
    {
        ApplyColorScheme(settings.ColorBlindnessMode);
        ApplyTextSize(settings.TextSizeIndex);
        ApplyReducedMotion(settings.ReduceMotion);
        visualAudioCuesEnabled = settings.VisualAudioCues;
        screenReaderHintsEnabled = settings.ScreenReaderHints;
        touchAndHoldDelay = settings.TouchAndHoldDelay;
        ApplyNonARMode(settings.NonARMode);
    }
    
    private void ApplyColorScheme(ColorBlindnessMode mode)
    {
        ColorScheme scheme = GetColorScheme(mode);
        
        // Find and update all UI elements with the ColorSchemeApplier component
        var appliers = FindObjectsOfType<ColorSchemeApplier>();
        foreach (var applier in appliers)
        {
            applier.ApplyColorScheme(scheme);
        }
        
        logger.LogInfo($"Applied color scheme for {mode} mode");
    }
    
    private void ApplyTextSize(int sizeIndex)
    {
        if (sizeIndex < 0 || sizeIndex >= textSizeMultipliers.Length)
        {
            logger.LogWarning($"Invalid text size index: {sizeIndex}. Using default.");
            sizeIndex = (int)defaultTextSizeIndex;
        }
        
        float multiplier = textSizeMultipliers[sizeIndex];
        
        // Find and update all TextMeshProUGUI components
        var textElements = FindObjectsOfType<TMP_Text>();
        foreach (var text in textElements)
        {
            // Check if the text element has the TextSizeApplier component
            var applier = text.GetComponent<TextSizeApplier>();
            if (applier != null)
            {
                applier.ApplyTextSize(multiplier);
            }
        }
        
        logger.LogInfo($"Applied text size multiplier: {multiplier}");
    }
    
    private void ApplyReducedMotion(bool enabled)
    {
        reduceMotionEnabled = enabled;
        uiAnimationSpeedMultiplier = enabled ? 0.5f : 1.0f;
        
        // Find and update all UI animations
        var animators = FindObjectsOfType<Animator>();
        foreach (var animator in animators)
        {
            // Check if this is a UI animator
            if (animator.gameObject.layer == LayerMask.NameToLayer("UI"))
            {
                animator.speed = uiAnimationSpeedMultiplier;
            }
        }
        
        logger.LogInfo($"Applied reduced motion: {enabled}, animation speed: {uiAnimationSpeedMultiplier}");
    }
    
    private void ApplyNonARMode(bool enabled)
    {
        nonARModeEnabled = enabled;
        
        // Find AR components and disable them if non-AR mode is enabled
        var arComponents = FindObjectsOfType<MonoBehaviour>().Where(mb => mb.GetType().Name.Contains("AR"));
        foreach (var component in arComponents)
        {
            component.enabled = !enabled;
        }
        
        // Enable non-AR fallback if available
        if (nonARFallbackPrefab != null)
        {
            var existingFallback = GameObject.Find("NonARFallback");
            if (enabled && existingFallback == null)
            {
                var fallback = Instantiate(nonARFallbackPrefab);
                fallback.name = "NonARFallback";
            }
            else if (!enabled && existingFallback != null)
            {
                Destroy(existingFallback);
            }
        }
        
        logger.LogInfo($"Applied non-AR mode: {enabled}");
    }
    
    private IEnumerator RemoveVisualCueAfterDelay(string audioType, float delay)
    {
        yield return new WaitForSeconds(delay);
        
        if (activeVisualCues.TryGetValue(audioType, out GameObject cue) && cue != null)
        {
            Destroy(cue);
            activeVisualCues.Remove(audioType);
        }
    }
    
    #endregion
    
    #region Persistence
    
    private async Task LoadSettings()
    {
        try
        {
            var gameData = await dataPersistence.LoadGameAsync();
            if (gameData?.settings == null || !gameData.settings.ContainsKey("accessibility"))
            {
                // No saved settings, use defaults
                return;
            }
            
            string settingsJson = gameData.settings["accessibility"] as string;
            if (string.IsNullOrEmpty(settingsJson))
            {
                return;
            }
            
            var settings = JsonUtility.FromJson<AccessibilitySettings>(settingsJson);
            if (settings != null)
            {
                currentSettings = settings;
            }
        }
        catch (Exception ex)
        {
            logger.LogError($"Error loading accessibility settings: {ex.Message}");
        }
    }
    
    private async Task SaveSettings()
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
            
            // Save accessibility settings
            string settingsJson = JsonUtility.ToJson(currentSettings);
            gameData.settings["accessibility"] = settingsJson;
            
            // Save to persistent storage
            await dataPersistence.SaveGameAsync(gameData);
        }
        catch (Exception ex)
        {
            logger.LogError($"Error saving accessibility settings: {ex.Message}");
        }
    }
    
    #endregion
}

#region Support Classes

/// <summary>
/// Color blindness modes.
/// </summary>
public enum ColorBlindnessMode
{
    Normal,
    Deuteranopia,
    Protanopia,
    Tritanopia
}

/// <summary>
/// Color scheme for UI elements.
/// </summary>
[System.Serializable]
public class ColorScheme
{
    public Color primaryColor = Color.white;
    public Color secondaryColor = Color.gray;
    public Color accentColor = Color.blue;
    public Color backgroundColor = Color.black;
    public Color textColor = Color.white;
    public Color warningColor = Color.yellow;
    public Color errorColor = Color.red;
    public Color successColor = Color.green;
    
    // UI-specific colors
    public Color buttonColor = Color.blue;
    public Color buttonHighlightColor = Color.cyan;
    public Color sliderColor = Color.green;
    public Color toggleColor = Color.magenta;
}

/// <summary>
/// Accessibility settings that can be saved and loaded.
/// </summary>
[System.Serializable]
public class AccessibilitySettings
{
    public ColorBlindnessMode ColorBlindnessMode = ColorBlindnessMode.Normal;
    public int TextSizeIndex = 1;
    public bool ReduceMotion = false;
    public bool VisualAudioCues = false;
    public bool ScreenReaderHints = false;
    public float TouchAndHoldDelay = 0.5f;
    public bool NonARMode = false;
    
    // Copy constructor
    public AccessibilitySettings() { }
    
    public AccessibilitySettings(AccessibilitySettings other)
    {
        ColorBlindnessMode = other.ColorBlindnessMode;
        TextSizeIndex = other.TextSizeIndex;
        ReduceMotion = other.ReduceMotion;
        VisualAudioCues = other.VisualAudioCues;
        ScreenReaderHints = other.ScreenReaderHints;
        TouchAndHoldDelay = other.TouchAndHoldDelay;
        NonARMode = other.NonARMode;
    }
}

/// <summary>
/// Component that applies color schemes to UI elements.
/// </summary>
public class ColorSchemeApplier : MonoBehaviour
{
    [SerializeField] private ColorSchemeTarget target = ColorSchemeTarget.Primary;
    
    // Cached components
    private Image image;
    private TMP_Text text;
    private Button button;
    private Toggle toggle;
    private Slider slider;
    
    private void Awake()
    {
        // Cache components
        image = GetComponent<Image>();
        text = GetComponent<TMP_Text>();
        button = GetComponent<Button>();
        toggle = GetComponent<Toggle>();
        slider = GetComponent<Slider>();
    }
    
    public void ApplyColorScheme(ColorScheme scheme)
    {
        Color targetColor = GetTargetColor(scheme);
        
        // Apply color to appropriate component
        if (image != null)
        {
            image.color = targetColor;
        }
        
        if (text != null)
        {
            text.color = targetColor;
        }
        
        if (button != null && button.targetGraphic != null)
        {
            ColorBlock colors = button.colors;
            colors.normalColor = targetColor;
            colors.highlightedColor = scheme.buttonHighlightColor;
            button.colors = colors;
        }
        
        if (toggle != null && toggle.targetGraphic != null)
        {
            ColorBlock colors = toggle.colors;
            colors.normalColor = targetColor;
            toggle.colors = colors;
        }
        
        if (slider != null && slider.fillRect != null)
        {
            var fillImage = slider.fillRect.GetComponent<Image>();
            if (fillImage != null)
            {
                fillImage.color = targetColor;
            }
        }
    }
    
    private Color GetTargetColor(ColorScheme scheme)
    {
        switch (target)
        {
            case ColorSchemeTarget.Primary:
                return scheme.primaryColor;
            case ColorSchemeTarget.Secondary:
                return scheme.secondaryColor;
            case ColorSchemeTarget.Accent:
                return scheme.accentColor;
            case ColorSchemeTarget.Background:
                return scheme.backgroundColor;
            case ColorSchemeTarget.Text:
                return scheme.textColor;
            case ColorSchemeTarget.Warning:
                return scheme.warningColor;
            case ColorSchemeTarget.Error:
                return scheme.errorColor;
            case ColorSchemeTarget.Success:
                return scheme.successColor;
            case ColorSchemeTarget.Button:
                return scheme.buttonColor;
            case ColorSchemeTarget.Slider:
                return scheme.sliderColor;
            case ColorSchemeTarget.Toggle:
                return scheme.toggleColor;
            default:
                return scheme.primaryColor;
        }
    }
    
    public enum ColorSchemeTarget
    {
        Primary,
        Secondary,
        Accent,
        Background,
        Text,
        Warning,
        Error,
        Success,
        Button,
        Slider,
        Toggle
    }
}

/// <summary>
/// Component that applies text size to UI elements.
/// </summary>
public class TextSizeApplier : MonoBehaviour
{
    [SerializeField] private float baseSize = 14f;
    
    // Cached components
    private TMP_Text text;
    
    private void Awake()
    {
        // Cache component
        text = GetComponent<TMP_Text>();
        
        if (text != null)
        {
            baseSize = text.fontSize;
        }
    }
    
    public void ApplyTextSize(float multiplier)
    {
        if (text != null)
        {
            text.fontSize = baseSize * multiplier;
        }
    }
}

#endregion