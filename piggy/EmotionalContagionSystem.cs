using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using UnityEngine.UI;

/// <summary>
/// Detects player emotions and allows pet to respond empathetically
/// </summary>
public class EmotionalContagionSystem : MonoBehaviour {
    [System.Serializable]
    public class EmotionResponse {
        public string emotionType; // "Happy", "Sad", "Angry", "Surprised", etc.
        public string animationTrigger;
        public string soundEffect;
        public string[] dialogueOptions;
        [Range(0f, 1f)]
        public float moodTransmissionStrength = 0.5f;
        public float cooldownSeconds = 300f; // 5 minutes
    }
    
    [Header("Emotion Detection")]
    [SerializeField] private bool detectPlayerEmotions = true;
    [SerializeField] private float detectionInterval = 5f;
    [SerializeField] private float emotionConfidenceThreshold = 0.6f;
    [SerializeField] private bool useCameraForDetection = true;
    [SerializeField] private bool useSimulatedEmotions = false;
    
    [Header("Emotion Responses")]
    [SerializeField] private List<EmotionResponse> emotionResponses = new List<EmotionResponse>();
    [SerializeField] private float empathyLevel = 0.7f;
    [SerializeField] private float cheerUpStrength = 0.3f;
    [SerializeField] private bool prioritizeCheeringUp = true;
    
    [Header("References")]
    [SerializeField] private VirtualPetUnity pet;
    [SerializeField] private MicroAnimationController animationController;
    [SerializeField] private AudioManager audioManager;
    [SerializeField] private NotificationManager notificationManager;
    [SerializeField] private PersonalitySystem personalitySystem;
    [SerializeField] private RawImage cameraFeedImage;
    
    [Header("Debug")]
    [SerializeField] private bool showEmotionDebug = false;
    [SerializeField] private string simulatedEmotion = "Happy";
    
    private WebCamTexture webCamTexture;
    private Dictionary<string, float> lastResponseTimes = new Dictionary<string, float>();
    private string currentPlayerEmotion = "Neutral";
    private float playerEmotionConfidence = 0f;
    private float lastDetectionTime = 0f;
    
    void Start() {
        // Initialize camera if using camera detection
        if (detectPlayerEmotions && useCameraForDetection) {
            InitializeCamera();
        }
        
        // Start detection coroutine
        if (detectPlayerEmotions) {
            StartCoroutine(EmotionDetectionRoutine());
        }
    }
    
    /// <summary>
    /// Manually triggers a player emotion (for testing or external input)
    /// </summary>
    public void SetPlayerEmotion(string emotion, float confidence = 1.0f) {
        if (string.IsNullOrEmpty(emotion)) return;
        
        currentPlayerEmotion = emotion;
        playerEmotionConfidence = confidence;
        
        if (confidence >= emotionConfidenceThreshold) {
            RespondToEmotion(emotion);
        }
    }
    
    /// <summary>
    /// Gets the current detected player emotion
    /// </summary>
    public string GetPlayerEmotion() {
        return currentPlayerEmotion;
    }
    
    /// <summary>
    /// Gets the confidence level of the current emotion detection
    /// </summary>
    public float GetEmotionConfidence() {
        return playerEmotionConfidence;
    }
    
    /// <summary>
    /// Toggles emotion detection on/off
    /// </summary>
    public void ToggleEmotionDetection(bool enable) {
        detectPlayerEmotions = enable;
        
        if (enable && !useCameraForDetection) {
            StartCoroutine(EmotionDetectionRoutine());
        } else if (!enable && webCamTexture != null && webCamTexture.isPlaying) {
            webCamTexture.Stop();
        }
    }
    
    // Private implementation methods
    
    private void InitializeCamera() {
        // Check for camera permission
        #if UNITY_IOS
        if (!Application.HasUserAuthorization(UserAuthorization.WebCam)) {
            StartCoroutine(RequestCameraPermission());
            return;
        }
        #endif
        
        // Set up webcam texture
        WebCamDevice[] devices = WebCamTexture.devices;
        if (devices.Length == 0) {
            Debug.LogWarning("[EmotionalContagion] No camera detected. Using simulated emotions.");
            useSimulatedEmotions = true;
            useCameraForDetection = false;
            return;
        }
        
        // Use front-facing camera if available
        WebCamDevice device = devices[0];
        foreach (var d in devices) {
            #if UNITY_IOS || UNITY_ANDROID
            if (d.isFrontFacing) {
                device = d;
                break;
            }
            #endif
        }
        
        // Create webcam texture
        webCamTexture = new WebCamTexture(device.name, 640, 480, 30);
        webCamTexture.Play();
        
        // Assign to UI element if available
        if (cameraFeedImage != null) {
            cameraFeedImage.texture = webCamTexture;
            cameraFeedImage.gameObject.SetActive(false); // Hide by default
        }
    }
    
    private IEnumerator RequestCameraPermission() {
        yield return Application.RequestUserAuthorization(UserAuthorization.WebCam);
        
        if (Application.HasUserAuthorization(UserAuthorization.WebCam)) {
            InitializeCamera();
        } else {
            Debug.LogWarning("[EmotionalContagion] Camera permission denied. Using simulated emotions.");
            useSimulatedEmotions = true;
            useCameraForDetection = false;
        }
    }
    
    private IEnumerator EmotionDetectionRoutine() {
        while (detectPlayerEmotions) {
            if (Time.time - lastDetectionTime >= detectionInterval) {
                DetectPlayerEmotion();
                lastDetectionTime = Time.time;
            }
            
            yield return new WaitForSeconds(detectionInterval);
        }
    }
    
    private void DetectPlayerEmotion() {
        if (useSimulatedEmotions) {
            // Use simulated emotions for testing
            if (showEmotionDebug) {
                currentPlayerEmotion = simulatedEmotion;
                playerEmotionConfidence = 0.9f;
                
                RespondToEmotion(currentPlayerEmotion);
            }
            return;
        }
        
        if (useCameraForDetection && webCamTexture != null && webCamTexture.isPlaying) {
            // Capture frame for emotion detection
            Texture2D snapshot = new Texture2D(webCamTexture.width, webCamTexture.height);
            snapshot.SetPixels(webCamTexture.GetPixels());
            snapshot.Apply();
            
            // In a real implementation, you would:
            // 1. Send this image to an emotion detection API
            // 2. Process the results
            // For now, we'll just simulate random emotions occasionally
            
            if (UnityEngine.Random.value < 0.3f) {
                string[] emotions = { "Happy", "Sad", "Angry", "Surprised", "Neutral" };
                currentPlayerEmotion = emotions[UnityEngine.Random.Range(0, emotions.Length)];
                playerEmotionConfidence = UnityEngine.Random.Range(0.6f, 1.0f);
                
                if (playerEmotionConfidence >= emotionConfidenceThreshold) {
                    RespondToEmotion(currentPlayerEmotion);
                }
            }
            
            // Clean up
            Destroy(snapshot);
        }
    }
    
    private void RespondToEmotion(string emotion) {
        // Find matching response
        EmotionResponse response = emotionResponses.Find(r => r.emotionType.Equals(emotion, System.StringComparison.OrdinalIgnoreCase));
        if (response == null) return;
        
        // Check cooldown
        if (lastResponseTimes.ContainsKey(emotion)) {
            if (Time.time - lastResponseTimes[emotion] < response.cooldownSeconds) {
                return;
            }
        }
        
        // Consider pet personality
        float responseModifier = 1.0f;
        if (personalitySystem != null) {
            // Empathetic pets respond more strongly
            float empathy = personalitySystem.GetTraitValue(PersonalitySystem.PersonalityTrait.TraitCategory.Affection);
            responseModifier = Mathf.Lerp(0.5f, 1.5f, (empathy + 100f) / 200f);
            
            // Social pets respond more to human emotions
            float sociability = personalitySystem.GetTraitValue(PersonalitySystem.PersonalityTrait.TraitCategory.Social);
            responseModifier *= Mathf.Lerp(0.7f, 1.3f, (sociability + 100f) / 200f);
        }
        
        // Apply response
        ApplyEmotionResponse(response, responseModifier);
        
        // Update timestamp
        lastResponseTimes[emotion] = Time.time;
        
        Debug.Log($"[EmotionalContagion] Responding to player emotion: {emotion} with modifier {responseModifier}");
    }
    
    private void ApplyEmotionResponse(EmotionResponse response, float modifier) {
        if (pet == null) return;
        
        // Play animation if specified
        if (!string.IsNullOrEmpty(response.animationTrigger) && animationController != null) {
            animationController.PlayAnimation(response.animationTrigger);
        }
        
        // Play sound if specified
        if (!string.IsNullOrEmpty(response.soundEffect) && audioManager != null) {
            audioManager.Play(response.soundEffect);
        }
        
        // Show dialogue if available
        if (response.dialogueOptions != null && response.dialogueOptions.Length > 0 && notificationManager != null) {
            // Get personalized dialogue if available
            string dialogue;
            if (personalitySystem != null) {
                dialogue = personalitySystem.GetPersonalizedDialogue(response.emotionType);
                
                // Fall back to response dialogue if no personality-specific dialogue
                if (string.IsNullOrEmpty(dialogue)) {
                    dialogue = response.dialogueOptions[UnityEngine.Random.Range(0, response.dialogueOptions.Length)];
                }
            } else {
                dialogue = response.dialogueOptions[UnityEngine.Random.Range(0, response.dialogueOptions.Length)];
            }
            
            notificationManager.TriggerAlert(dialogue);
        }
        
        // Affect pet mood based on player emotion
        if (response.emotionType.Equals("Happy", System.StringComparison.OrdinalIgnoreCase)) {
            // Happiness is contagious
            float moodBoost = response.moodTransmissionStrength * modifier * empathyLevel;
            pet.Happiness = Mathf.Min(pet.Happiness + moodBoost * 10f, 100f);
        } 
        else if (response.emotionType.Equals("Sad", System.StringComparison.OrdinalIgnoreCase)) {
            if (prioritizeCheeringUp) {
                // Try to cheer up the player
                TryToCheerUpPlayer();
            } else {
                // Sadness is contagious
                float moodReduction = response.moodTransmissionStrength * modifier * empathyLevel;
                pet.Happiness = Mathf.Max(pet.Happiness - moodReduction * 5f, 0f);
            }
        }
        else if (response.emotionType.Equals("Angry", System.StringComparison.OrdinalIgnoreCase)) {
            // Respond to anger (maybe fear or concern)
            float reactionStrength = response.moodTransmissionStrength * modifier;
            pet.Happiness = Mathf.Max(pet.Happiness - reactionStrength * 3f, 0f);
        }
    }
    
    private void TryToCheerUpPlayer() {
        if (animationController != null) {
            // Play a cute, cheering animation
            string[] cheerUpAnimations = { "Playful", "Cute", "Dance", "HeartEyes" };
            string anim = cheerUpAnimations[UnityEngine.Random.Range(0, cheerUpAnimations.Length)];
            animationController.PlayAnimation(anim);
        }
        
        if (notificationManager != null) {
            // Show an encouraging message
            string[] cheerUpMessages = { 
                "Don't be sad! I'm here for you!",
                "*nuzzles you gently*",
                "You're the best! Let me cheer you up!",
                "Would a little dance help? *wiggle wiggle*",
                "*looks up with big, hopeful eyes*"
            };
            
            string message = cheerUpMessages[UnityEngine.Random.Range(0, cheerUpMessages.Length)];
            notificationManager.TriggerAlert(message);
        }
        
        if (audioManager != null) {
            // Play a happy sound
            audioManager.Play("CheerUp");
        }
    }
    
    void OnGUI() {
        if (showEmotionDebug && Application.isEditor) {
            GUILayout.BeginArea(new Rect(10, 100, 300, 200));
            GUILayout.Label("Emotion Detection Debug:");
            GUILayout.Label($"Current Emotion: {currentPlayerEmotion}");
            GUILayout.Label($"Confidence: {playerEmotionConfidence:F2}");
            
            if (GUILayout.Button("Simulate Happy")) SetPlayerEmotion("Happy");
            if (GUILayout.Button("Simulate Sad")) SetPlayerEmotion("Sad");
            if (GUILayout.Button("Simulate Angry")) SetPlayerEmotion("Angry");
            if (GUILayout.Button("Simulate Surprised")) SetPlayerEmotion("Surprised");
            
            GUILayout.EndArea();
        }
    }
    
    void OnApplicationQuit() {
        // Clean up webcam
        if (webCamTexture != null && webCamTexture.isPlaying) {
            webCamTexture.Stop();
        }
    }
}