using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System;
using UnityEngine.Windows.Speech; // Note: Only works on Windows platforms
using System.Linq;

/// <summary>
/// Handles voice recognition for pet commands and interactions
/// </summary>
public class VoiceRecognitionManager : MonoBehaviour {
    [System.Serializable]
    public class VoiceCommand {
        public string commandName;
        public List<string> phrases = new List<string>();
        public bool requiresPetName = false;
        public UnityEngine.Events.UnityEvent onRecognized;
        public float confidenceThreshold = 0.7f;
    }
    
    [Header("Voice Recognition Settings")]
    [SerializeField] private bool enableVoiceRecognition = true;
    [SerializeField] private List<VoiceCommand> voiceCommands = new List<VoiceCommand>();
    [SerializeField] private float recognitionInterval = 0.1f;
    [SerializeField] private float petNameModifier = 1.5f; // Happiness bonus when pet name is recognized
    
    [Header("Pet References")]
    [SerializeField] private VirtualPetUnity pet;
    [SerializeField] private CustomizationManager customizationManager;
    [SerializeField] private MicroAnimationController animationController;
    [SerializeField] private AudioManager audioManager;
    
    [Header("Voice Feedback")]
    [SerializeField] private GameObject recognitionIndicator;
    [SerializeField] private float indicatorDuration = 1.0f;
    [SerializeField] private AudioClip recognitionSound;
    
    [Header("Debug")]
    [SerializeField] private bool debugRecognition = false;
    [SerializeField] private string simulatedCommand = "Play";
    
    private KeywordRecognizer keywordRecognizer;
    private DictationRecognizer dictationRecognizer;
    private Dictionary<string, Action> keywordActions = new Dictionary<string, Action>();
    private bool isListening = false;
    private Coroutine listeningCoroutine;
    private string petName = "";
    
    void Start() {
        if (customizationManager != null) {
            petName = customizationManager.GetPetName();
        }
        
        if (enableVoiceRecognition) {
            InitializeVoiceRecognition();
        }
        
        // Hide recognition indicator initially
        if (recognitionIndicator != null) {
            recognitionIndicator.SetActive(false);
        }
    }
    
    void OnDisable() {
        ShutdownVoiceRecognition();
    }
    
    /// <summary>
    /// Begins listening for voice commands
    /// </summary>
    public void StartListening() {
        if (!enableVoiceRecognition) return;
        
        if (keywordRecognizer != null && !keywordRecognizer.IsRunning) {
            keywordRecognizer.Start();
            isListening = true;
            
            // Show indicator
            if (recognitionIndicator != null) {
                recognitionIndicator.SetActive(true);
            }
            
            // Play sound
            if (audioManager != null && recognitionSound != null) {
                audioManager.Play("ListeningStart");
            }
            
            Debug.Log("[VoiceRecognitionManager] Started listening for commands");
        }
    }
    
    /// <summary>
    /// Stops listening for voice commands
    /// </summary>
    public void StopListening() {
        if (keywordRecognizer != null && keywordRecognizer.IsRunning) {
            keywordRecognizer.Stop();
            isListening = false;
            
            // Hide indicator
            if (recognitionIndicator != null) {
                recognitionIndicator.SetActive(false);
            }
            
            Debug.Log("[VoiceRecognitionManager] Stopped listening for commands");
        }
    }
    
    /// <summary>
    /// Tests voice commands without actual voice input
    /// </summary>
    public void SimulateCommand(string commandName) {
        VoiceCommand command = voiceCommands.Find(c => c.commandName.Equals(commandName, StringComparison.OrdinalIgnoreCase));
        if (command != null) {
            Debug.Log($"[VoiceRecognitionManager] Simulated command: {command.commandName}");
            ExecuteCommand(command);
        } else {
            Debug.LogWarning($"[VoiceRecognitionManager] Command not found: {commandName}");
        }
    }
    
    /// <summary>
    /// Refreshes command list, e.g. after pet name change
    /// </summary>
    public void RefreshCommands() {
        if (customizationManager != null) {
            petName = customizationManager.GetPetName();
        }
        
        // Restart recognition with updated commands
        if (isListening) {
            StopListening();
            InitializeVoiceRecognition();
            StartListening();
        } else {
            InitializeVoiceRecognition();
        }
    }
    
    // Private implementation methods
    
    private void InitializeVoiceRecognition() {
        #if UNITY_STANDALONE_WIN || UNITY_EDITOR_WIN
        
        // Build list of keywords to recognize
        List<string> keywords = new List<string>();
        keywordActions.Clear();
        
        foreach (VoiceCommand command in voiceCommands) {
            foreach (string phrase in command.phrases) {
                string keyword = phrase;
                
                if (command.requiresPetName) {
                    keyword = $"{petName} {phrase}";
                }
                
                keywords.Add(keyword);
                
                // Add action for this keyword
                keywordActions[keyword] = () => ExecuteCommand(command);
            }
        }
        
        // Create keyword recognizer
        if (keywords.Count > 0) {
            keywordRecognizer = new KeywordRecognizer(keywords.ToArray());
            keywordRecognizer.OnPhraseRecognized += OnKeywordRecognized;
        } else {
            Debug.LogWarning("[VoiceRecognitionManager] No valid keywords found");
        }
        
        if (debugRecognition) {
            Debug.Log($"[VoiceRecognitionManager] Initialized with {keywords.Count} keywords: {string.Join(", ", keywords)}");
        }
        
        #else
        Debug.LogWarning("[VoiceRecognitionManager] Windows Speech Recognition is only available on Windows platforms.");
        #endif
    }
    
    private void ShutdownVoiceRecognition() {
        #if UNITY_STANDALONE_WIN || UNITY_EDITOR_WIN
        if (keywordRecognizer != null) {
            if (keywordRecognizer.IsRunning) {
                keywordRecognizer.Stop();
            }
            keywordRecognizer.OnPhraseRecognized -= OnKeywordRecognized;
            keywordRecognizer.Dispose();
            keywordRecognizer = null;
        }
        
        if (dictationRecognizer != null) {
            if (dictationRecognizer.Status != DictationRecognizerStatus.Stopped) {
                dictationRecognizer.Stop();
            }
            dictationRecognizer.Dispose();
            dictationRecognizer = null;
        }
        #endif
        
        isListening = false;
    }
    
    #if UNITY_STANDALONE_WIN || UNITY_EDITOR_WIN
    private void OnKeywordRecognized(PhraseRecognizedEventArgs args) {
        string keyword = args.text;
        float confidence = args.confidence;
        
        if (debugRecognition) {
            Debug.Log($"[VoiceRecognitionManager] Recognized: '{keyword}' with confidence {confidence}");
        }
        
        // Find the matching command
        foreach (VoiceCommand command in voiceCommands) {
            foreach (string phrase in command.phrases) {
                string comparePhrase = command.requiresPetName ? $"{petName} {phrase}" : phrase;
                
                if (keyword.Equals(comparePhrase, StringComparison.OrdinalIgnoreCase) && 
                    ConfidenceToFloat(confidence) >= command.confidenceThreshold) {
                    
                    // Execute on main thread
                    StartCoroutine(ExecuteCommandOnMainThread(command));
                    return;
                }
            }
        }
    }
    #endif
    
    private IEnumerator ExecuteCommandOnMainThread(VoiceCommand command) {
        yield return null; // Wait for next frame
        ExecuteCommand(command);
    }
    
    private void ExecuteCommand(VoiceCommand command) {
        // Show recognition indicator
        if (recognitionIndicator != null) {
            StartCoroutine(FlashIndicator());
        }
        
        // Play recognition sound
        if (audioManager != null && recognitionSound != null) {
            audioManager.Play("CommandRecognized");
        }
        
        // Pet name recognition bonus
        if (command.requiresPetName && pet != null) {
            pet.Happiness = Mathf.Min(pet.Happiness + petNameModifier, 100f);
            
            // Play happy animation
            if (animationController != null) {
                animationController.PlayAnimation("Happy");
            }
        }
        
        // Invoke the associated action
        command.onRecognized?.Invoke();
        
        // Log the command
        Debug.Log($"[VoiceRecognitionManager] Executed command: {command.commandName}");
    }
    
    private IEnumerator FlashIndicator() {
        if (recognitionIndicator != null) {
            recognitionIndicator.SetActive(true);
            yield return new WaitForSeconds(indicatorDuration);
            recognitionIndicator.SetActive(false);
        }
    }
    
    private float ConfidenceToFloat(ConfidenceLevel confidence) {
        switch (confidence) {
            case ConfidenceLevel.High:
                return 0.9f;
            case ConfidenceLevel.Medium:
                return 0.6f;
            case ConfidenceLevel.Low:
                return 0.3f;
            default:
                return 0.0f;
        }
    }
    
    void OnApplicationFocus(bool hasFocus) {
        // Automatically start/stop listening when app focus changes
        if (hasFocus) {
            if (isListening) {
                StartListening();
            }
        } else {
            if (isListening) {
                StopListening();
            }
        }
    }
    
    void OnDestroy() {
        ShutdownVoiceRecognition();
    }
    
    void Update() {
        // Debug mode - simulate command
        if (debugRecognition && Input.GetKeyDown(KeyCode.Space)) {
            SimulateCommand(simulatedCommand);
        }
    }
}