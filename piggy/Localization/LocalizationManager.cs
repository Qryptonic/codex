using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using System.Text.RegularExpressions;
using System.Globalization;
using System.Threading.Tasks;
using UnityEngine.Events;

/// <summary>
/// Comprehensive localization system for the Piggy virtual pet game.
/// Supports multiple languages, RTL text, pluralization, and formatted text.
/// </summary>
public class LocalizationManager : MonoBehaviour
{
    // Events
    [System.Serializable] public class LanguageChangedEvent : UnityEvent<SystemLanguage> { }
    public LanguageChangedEvent OnLanguageChanged = new LanguageChangedEvent();
    
    [Header("Configuration")]
    [SerializeField] private TextAsset[] languageFiles;
    [SerializeField] private SystemLanguage defaultLanguage = SystemLanguage.English;
    [SerializeField] private bool useDeviceLanguage = true;
    [SerializeField] private Font[] languageFonts;
    [SerializeField] private bool enableRTLSupport = true;
    
    [Header("Runtime")]
    [SerializeField] private SystemLanguage currentLanguage;
    [SerializeField, ReadOnly] private int totalTranslationCount;
    [SerializeField, ReadOnly] private bool initialized = false;
    
    // RTL languages
    private static readonly HashSet<SystemLanguage> RTLLanguages = new HashSet<SystemLanguage>
    {
        SystemLanguage.Arabic,
        SystemLanguage.Hebrew,
        SystemLanguage.Farsi
    };
    
    // Dependencies
    private ILogger logger;
    private IDataPersistence dataPersistence;
    
    // Internal data
    private Dictionary<SystemLanguage, Dictionary<string, string>> translations = new Dictionary<SystemLanguage, Dictionary<string, string>>();
    private Dictionary<SystemLanguage, Dictionary<string, PluralRules>> pluralRules = new Dictionary<SystemLanguage, Dictionary<string, PluralRules>>();
    private Dictionary<SystemLanguage, Font> languageFontMap = new Dictionary<SystemLanguage, Font>();
    
    // Fallback language (English)
    private SystemLanguage fallbackLanguage = SystemLanguage.English;
    
    // Cached regex for parameter replacement
    private static readonly Regex ParamRegex = new Regex(@"\{([^{}]+)\}", RegexOptions.Compiled);
    
    [Inject]
    public void Construct(ILogger logger, IDataPersistence dataPersistence)
    {
        this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
        this.dataPersistence = dataPersistence ?? throw new ArgumentNullException(nameof(dataPersistence));
    }
    
    private async void Awake()
    {
        try
        {
            // Load all language files
            InitializeLanguages();
            
            // Initialize font mapping
            InitializeFontMapping();
            
            // Load saved language preference
            var savedLanguage = await LoadLanguagePreference();
            
            // Set initial language
            if (savedLanguage != SystemLanguage.Unknown)
            {
                // Use saved preference
                SetLanguage(savedLanguage);
            }
            else if (useDeviceLanguage)
            {
                // Use device language if available, otherwise fallback
                SystemLanguage deviceLanguage = Application.systemLanguage;
                if (translations.ContainsKey(deviceLanguage))
                {
                    SetLanguage(deviceLanguage);
                }
                else
                {
                    SetLanguage(defaultLanguage);
                }
            }
            else
            {
                // Use configured default
                SetLanguage(defaultLanguage);
            }
            
            initialized = true;
            logger.LogInfo($"Localization initialized with {translations.Count} languages and {totalTranslationCount} total translations");
        }
        catch (Exception ex)
        {
            logger.LogError($"Error initializing LocalizationManager: {ex.Message}");
            
            // Fallback to default language in case of error
            if (!initialized)
            {
                SetLanguage(defaultLanguage);
                initialized = true;
            }
        }
    }
    
    #region Public API
    
    /// <summary>
    /// Get localized text by key.
    /// </summary>
    /// <param name="key">The localization key.</param>
    /// <returns>Localized text or the key itself if not found.</returns>
    public string GetText(string key)
    {
        if (string.IsNullOrEmpty(key))
        {
            return string.Empty;
        }
        
        // Try to get from current language
        if (translations.TryGetValue(currentLanguage, out var currentTranslations) &&
            currentTranslations.TryGetValue(key, out var translation))
        {
            return translation;
        }
        
        // Fallback to default language
        if (currentLanguage != fallbackLanguage &&
            translations.TryGetValue(fallbackLanguage, out var fallbackTranslations) &&
            fallbackTranslations.TryGetValue(key, out var fallbackTranslation))
        {
            return fallbackTranslation;
        }
        
        // Return key as last resort
        return key;
    }
    
    /// <summary>
    /// Get localized text with parameter substitution.
    /// </summary>
    /// <param name="key">The localization key.</param>
    /// <param name="parameters">Dictionary of parameter names and values.</param>
    /// <returns>Localized text with parameters or the key itself if not found.</returns>
    public string GetText(string key, Dictionary<string, string> parameters)
    {
        string baseText = GetText(key);
        
        if (parameters == null || parameters.Count == 0)
        {
            return baseText;
        }
        
        // Replace parameters in format {name}
        return ParamRegex.Replace(baseText, match => {
            string paramName = match.Groups[1].Value;
            return parameters.TryGetValue(paramName, out string value) ? value : match.Value;
        });
    }
    
    /// <summary>
    /// Get localized text with parameter substitution using object values.
    /// </summary>
    /// <param name="key">The localization key.</param>
    /// <param name="parameters">Dictionary of parameter names and object values.</param>
    /// <returns>Localized text with parameters or the key itself if not found.</returns>
    public string GetText(string key, Dictionary<string, object> parameters)
    {
        // Convert object parameters to strings
        var stringParams = new Dictionary<string, string>();
        foreach (var param in parameters)
        {
            stringParams[param.Key] = param.Value?.ToString() ?? string.Empty;
        }
        
        return GetText(key, stringParams);
    }
    
    /// <summary>
    /// Get localized text with plural forms based on count.
    /// </summary>
    /// <param name="key">The localization key.</param>
    /// <param name="count">The count for plural form selection.</param>
    /// <returns>Localized text with correct plural form or the key itself if not found.</returns>
    public string GetPluralText(string key, int count)
    {
        // Get plural rule for current language
        if (!pluralRules.TryGetValue(currentLanguage, out var rules) ||
            !rules.TryGetValue(key, out var pluralRule))
        {
            // Try fallback language
            if (currentLanguage != fallbackLanguage && 
                pluralRules.TryGetValue(fallbackLanguage, out var fallbackRules) &&
                fallbackRules.TryGetValue(key, out pluralRule))
            {
                // Use fallback rules
            }
            else
            {
                // No plural rule found, use regular text with count parameter
                return GetText(key, new Dictionary<string, string> { { "count", count.ToString() } });
            }
        }
        
        // Get the appropriate form based on count
        string form = pluralRule.GetForm(count);
        
        // Get the translation for this form
        string pluralKey = $"{key}.{form}";
        string translation = GetText(pluralKey);
        
        // If translation is the same as key, try base key
        if (translation == pluralKey)
        {
            translation = GetText(key);
        }
        
        // Replace {count} parameter
        return GetText(translation, new Dictionary<string, string> { { "count", count.ToString() } });
    }
    
    /// <summary>
    /// Get font for current language.
    /// </summary>
    /// <returns>The font for the current language or null if not defined.</returns>
    public Font GetCurrentLanguageFont()
    {
        if (languageFontMap.TryGetValue(currentLanguage, out var font))
        {
            return font;
        }
        
        // Try fallback
        if (currentLanguage != fallbackLanguage && languageFontMap.TryGetValue(fallbackLanguage, out var fallbackFont))
        {
            return fallbackFont;
        }
        
        return null;
    }
    
    /// <summary>
    /// Check if current language is right-to-left.
    /// </summary>
    /// <returns>True if current language is RTL, false otherwise.</returns>
    public bool IsCurrentLanguageRTL()
    {
        return RTLLanguages.Contains(currentLanguage) && enableRTLSupport;
    }
    
    /// <summary>
    /// Set the active language.
    /// </summary>
    /// <param name="language">The language to set.</param>
    /// <returns>True if language was set successfully, false otherwise.</returns>
    public bool SetLanguage(SystemLanguage language)
    {
        try
        {
            // Check if language is supported
            if (!translations.ContainsKey(language))
            {
                logger.LogWarning($"Language {language} is not supported, falling back to {defaultLanguage}");
                language = defaultLanguage;
                
                // If default is also not supported, use fallback
                if (!translations.ContainsKey(language))
                {
                    language = fallbackLanguage;
                }
            }
            
            // Set language
            SystemLanguage oldLanguage = currentLanguage;
            currentLanguage = language;
            
            // Save preference
            _ = SaveLanguagePreference(language);
            
            // Notify listeners if language changed
            if (oldLanguage != currentLanguage)
            {
                OnLanguageChanged?.Invoke(currentLanguage);
            }
            
            logger.LogInfo($"Language set to {language} with {translations[language].Count} translations");
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError($"Error setting language: {ex.Message}");
            return false;
        }
    }
    
    /// <summary>
    /// Get the list of supported languages.
    /// </summary>
    /// <returns>Array of supported languages.</returns>
    public SystemLanguage[] GetSupportedLanguages()
    {
        return translations.Keys.ToArray();
    }
    
    /// <summary>
    /// Gets the current language.
    /// </summary>
    /// <returns>The current language.</returns>
    public SystemLanguage GetCurrentLanguage()
    {
        return currentLanguage;
    }
    
    /// <summary>
    /// Get the display name of a language.
    /// </summary>
    /// <param name="language">The language to get the name for.</param>
    /// <returns>The localized display name of the language.</returns>
    public string GetLanguageDisplayName(SystemLanguage language)
    {
        string key = $"language.{language.ToString().ToLowerInvariant()}";
        string localizedName = GetText(key);
        
        // If not found, return the enum name
        if (localizedName == key)
        {
            return language.ToString();
        }
        
        return localizedName;
    }
    
    #endregion
    
    #region Initialization
    
    private void InitializeLanguages()
    {
        totalTranslationCount = 0;
        
        foreach (var file in languageFiles)
        {
            if (file == null)
            {
                continue;
            }
            
            try
            {
                // Parse language file
                var (language, langTranslations, langPluralRules) = ParseLanguageFile(file);
                
                // Add to translations dictionary
                translations[language] = langTranslations;
                pluralRules[language] = langPluralRules;
                
                totalTranslationCount += langTranslations.Count;
            }
            catch (Exception ex)
            {
                logger.LogError($"Error parsing language file {file.name}: {ex.Message}");
            }
        }
    }
    
    private (SystemLanguage, Dictionary<string, string>, Dictionary<string, PluralRules>) ParseLanguageFile(TextAsset file)
    {
        Dictionary<string, string> langTranslations = new Dictionary<string, string>();
        Dictionary<string, PluralRules> langPluralRules = new Dictionary<string, PluralRules>();
        SystemLanguage language = SystemLanguage.Unknown;
        
        // Parse language file (JSON format)
        var jsonData = JsonUtility.FromJson<LanguageData>(file.text);
        
        // Parse language code
        if (Enum.TryParse(jsonData.language, true, out SystemLanguage parsedLanguage))
        {
            language = parsedLanguage;
        }
        else
        {
            throw new Exception($"Invalid language code: {jsonData.language}");
        }
        
        // Parse translations
        foreach (var entry in jsonData.translations)
        {
            langTranslations[entry.key] = entry.value;
        }
        
        // Parse plural rules
        foreach (var rule in jsonData.pluralRules)
        {
            langPluralRules[rule.key] = new PluralRules
            {
                Zero = rule.zero,
                One = rule.one,
                Two = rule.two,
                Few = rule.few,
                Many = rule.many,
                Other = rule.other
            };
        }
        
        return (language, langTranslations, langPluralRules);
    }
    
    private void InitializeFontMapping()
    {
        foreach (var font in languageFonts)
        {
            if (font == null)
            {
                continue;
            }
            
            string fontName = font.name;
            
            // Try to parse language from font name
            // Format should be "Font_LanguageName"
            int underscoreIndex = fontName.IndexOf('_');
            if (underscoreIndex >= 0 && underscoreIndex < fontName.Length - 1)
            {
                string langName = fontName.Substring(underscoreIndex + 1);
                
                if (Enum.TryParse(langName, true, out SystemLanguage lang))
                {
                    languageFontMap[lang] = font;
                }
            }
        }
    }
    
    #endregion
    
    #region Persistence
    
    private async Task<SystemLanguage> LoadLanguagePreference()
    {
        try
        {
            var gameData = await dataPersistence.LoadGameAsync();
            if (gameData?.settings == null || !gameData.settings.ContainsKey("language"))
            {
                return SystemLanguage.Unknown;
            }
            
            string languageStr = gameData.settings["language"] as string;
            if (Enum.TryParse(languageStr, true, out SystemLanguage language))
            {
                return language;
            }
            
            return SystemLanguage.Unknown;
        }
        catch (Exception ex)
        {
            logger.LogError($"Error loading language preference: {ex.Message}");
            return SystemLanguage.Unknown;
        }
    }
    
    private async Task SaveLanguagePreference(SystemLanguage language)
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
            
            // Save language preference
            gameData.settings["language"] = language.ToString();
            
            // Save to persistent storage
            await dataPersistence.SaveGameAsync(gameData);
        }
        catch (Exception ex)
        {
            logger.LogError($"Error saving language preference: {ex.Message}");
        }
    }
    
    #endregion
    
    #region Editor Support
    
    [ContextMenu("Generate Language Template")]
    private void GenerateLanguageTemplate()
    {
        #if UNITY_EDITOR
        var template = new LanguageData
        {
            language = "English",
            translations = new TranslationEntry[]
            {
                new TranslationEntry { key = "app.name", value = "Piggy" },
                new TranslationEntry { key = "pet.stats.hunger", value = "Hunger: {value}%" },
                new TranslationEntry { key = "pet.stats.thirst", value = "Thirst: {value}%" },
                new TranslationEntry { key = "pet.stats.happiness", value = "Happiness: {value}%" },
                new TranslationEntry { key = "pet.stats.health", value = "Health: {value}%" },
                new TranslationEntry { key = "items.count.one", value = "{count} item" },
                new TranslationEntry { key = "items.count.other", value = "{count} items" },
                new TranslationEntry { key = "language.english", value = "English" },
                new TranslationEntry { key = "language.french", value = "Français" },
                new TranslationEntry { key = "language.spanish", value = "Español" },
                new TranslationEntry { key = "language.german", value = "Deutsch" },
                new TranslationEntry { key = "language.japanese", value = "日本語" },
                new TranslationEntry { key = "language.chinese", value = "中文" },
                new TranslationEntry { key = "language.korean", value = "한국어" },
                new TranslationEntry { key = "language.arabic", value = "العربية" },
            },
            pluralRules = new PluralRuleEntry[]
            {
                new PluralRuleEntry
                {
                    key = "items.count",
                    zero = "zero",
                    one = "one",
                    two = "two",
                    few = "few",
                    many = "many",
                    other = "other"
                }
            }
        };
        
        string json = JsonUtility.ToJson(template, true);
        System.IO.File.WriteAllText("Assets/Resources/Localization/English.json", json);
        UnityEditor.AssetDatabase.Refresh();
        Debug.Log("Language template generated at Assets/Resources/Localization/English.json");
        #endif
    }
    
    #endregion
    
    #region Types
    
    [System.Serializable]
    private class LanguageData
    {
        public string language;
        public TranslationEntry[] translations;
        public PluralRuleEntry[] pluralRules;
    }
    
    [System.Serializable]
    private class TranslationEntry
    {
        public string key;
        public string value;
    }
    
    [System.Serializable]
    private class PluralRuleEntry
    {
        public string key;
        public string zero;
        public string one;
        public string two;
        public string few;
        public string many;
        public string other;
    }
    
    private class PluralRules
    {
        public string Zero;
        public string One;
        public string Two;
        public string Few;
        public string Many;
        public string Other;
        
        public string GetForm(int count)
        {
            // Simple plural rules for English by default
            if (count == 0 && !string.IsNullOrEmpty(Zero))
                return Zero;
            if (count == 1 && !string.IsNullOrEmpty(One))
                return One;
            if (count == 2 && !string.IsNullOrEmpty(Two))
                return Two;
            
            // Default to "other" form
            return !string.IsNullOrEmpty(Other) ? Other : "other";
        }
    }
    
    #endregion
}

// Editor attribute for read-only fields
public class ReadOnlyAttribute : PropertyAttribute { }