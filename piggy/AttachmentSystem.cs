using UnityEngine;
using System;
using System.Collections;
using System.Collections.Generic;

/// <summary>
/// Manages deeper attachment mechanics including memory and separation
/// </summary>
public class AttachmentSystem : MonoBehaviour {
    [System.Serializable]
    public class MemoryEvent {
        public string eventId;
        public string eventType; // "Feed", "Play", "Trip", "Birthday", etc.
        public string description;
        public DateTime timestamp;
        public float significanceValue; // 0-100
        public float decayRate = 0.05f; // per day
        public bool isPinnedMemory = false; // Important memories that don't decay
        public Sprite memoryImage;
    }
    
    [System.Serializable]
    public class SeparationState {
        public DateTime lastInteractionTime;
        public float anxietyLevel = 0f; // 0-100
        public float lonelinessFactor = 1f; // Multiplier for mood drop
        public float reunionBoostFactor = 1f; // Multiplier for reunion happiness
        public int missedCareRoutines = 0;
        public bool isSeparationAnxious = false;
    }
    
    [System.Serializable]
    public class AttachmentProfile {
        public float baseAttachmentLevel = 50f; // 0-100
        public float attachmentGrowthRate = 0.2f; // Per positive interaction
        public float attachmentDecayRate = 0.05f; // Per day
        public float currentAttachmentLevel = 50f;
        public float recognitionLevel = 0f; // How well pet recognizes you
        public float trustLevel = 50f; // Trust level affects responses
        public float separationResiliency = 50f; // Ability to handle separation
        public List<string> petNames = new List<string>(); // Names pet responds to
    }
    
    [Header("Attachment Settings")]
    [SerializeField] private AttachmentProfile attachment = new AttachmentProfile();
    [SerializeField] private SeparationState separation = new SeparationState();
    [SerializeField] private bool enableSeparationAnxiety = true;
    [SerializeField] private float maxSeparationAnxiety = 60f;
    [SerializeField] private float minSeparationHours = 24f;
    [SerializeField] private float maxRecognitionGrowth = 100f;
    
    [Header("Memory Settings")]
    [SerializeField] private List<MemoryEvent> memories = new List<MemoryEvent>();
    [SerializeField] private int maxMemories = 50;
    [SerializeField] private int maxActiveMemories = 5;
    [SerializeField] private float memoryReferenceChance = 0.2f; // Chance to mention a memory
    [SerializeField] private float memorySignificanceThreshold = 70f;
    
    [Header("References")]
    [SerializeField] private VirtualPetUnity pet;
    [SerializeField] private NotificationManager notificationManager;
    [SerializeField] private MicroAnimationController animationController;
    [SerializeField] private AudioManager audioManager;
    [SerializeField] private PersonalitySystem personalitySystem;
    
    [Header("Debug")]
    [SerializeField] private bool showAttachmentDebug = false;
    
    private bool isFirstReunionAfterSeparation = false;
    private DateTime lastMemoryDecayTime;
    private DateTime lastAttachmentUpdate;
    
    void Start() {
        // Load saved attachment data
        LoadAttachmentData();
        
        // Check separation state
        CheckSeparationState();
        
        // Subscribe to events
        SubscribeToEvents();
        
        // Initialize timestamps
        lastMemoryDecayTime = DateTime.Now;
        lastAttachmentUpdate = DateTime.Now;
    }
    
    void Update() {
        // Only run attachment checks periodically to save performance
        if (Time.frameCount % 300 == 0) { // Every 300 frames
            // Update attachment metrics
            UpdateAttachment();
            
            // Decay memories
            DecayMemories();
        }
    }
    
    /// <summary>
    /// Records a significant memory event
    /// </summary>
    public void RecordMemory(string eventType, string description, float significance = 50f, Sprite image = null) {
        MemoryEvent memory = new MemoryEvent {
            eventId = Guid.NewGuid().ToString(),
            eventType = eventType,
            description = description,
            timestamp = DateTime.Now,
            significanceValue = significance,
            memoryImage = image
        };
        
        // Pin highly significant memories
        if (significance >= memorySignificanceThreshold) {
            memory.isPinnedMemory = true;
        }
        
        // Add to memories
        memories.Add(memory);
        
        // Trim memory list if needed
        if (memories.Count > maxMemories) {
            // Remove least significant, non-pinned memory
            MemoryEvent leastSignificant = null;
            foreach (var mem in memories) {
                if (!mem.isPinnedMemory && (leastSignificant == null || 
                    mem.significanceValue < leastSignificant.significanceValue)) {
                    leastSignificant = mem;
                }
            }
            
            if (leastSignificant != null) {
                memories.Remove(leastSignificant);
            } else {
                // If all memories are pinned, remove oldest
                memories.Sort((a, b) => a.timestamp.CompareTo(b.timestamp));
                memories.RemoveAt(0);
            }
        }
        
        // Log and save
        Debug.Log($"[AttachmentSystem] Recorded memory: {description} (Significance: {significance})");
        SaveAttachmentData();
    }
    
    /// <summary>
    /// Gets a random memorable event to reference
    /// </summary>
    public MemoryEvent GetRandomMemory(string contextType = "") {
        if (memories.Count == 0) return null;
        
        // Get relevant memories first
        List<MemoryEvent> relevantMemories = string.IsNullOrEmpty(contextType) ? 
            memories : 
            memories.FindAll(m => m.eventType.Equals(contextType, StringComparison.OrdinalIgnoreCase));
            
        if (relevantMemories.Count == 0) return null;
        
        // Sort by significance
        relevantMemories.Sort((a, b) => b.significanceValue.CompareTo(a.significanceValue));
        
        // Get top active memories (most significant)
        int count = Mathf.Min(maxActiveMemories, relevantMemories.Count);
        int randomIndex = UnityEngine.Random.Range(0, count);
        
        return relevantMemories[randomIndex];
    }
    
    /// <summary>
    /// Get a random memory reference to add to dialogue
    /// </summary>
    public string GetMemoryReference(string contextType = "") {
        if (UnityEngine.Random.value > memoryReferenceChance) return "";
        
        MemoryEvent memory = GetRandomMemory(contextType);
        if (memory == null) return "";
        
        // Convert to user-friendly description
        DateTime now = DateTime.Now;
        TimeSpan timeAgo = now - memory.timestamp;
        
        string timeReference;
        if (timeAgo.TotalDays < 1) {
            timeReference = "earlier today";
        } else if (timeAgo.TotalDays < 2) {
            timeReference = "yesterday";
        } else if (timeAgo.TotalDays < 7) {
            timeReference = $"{(int)timeAgo.TotalDays} days ago";
        } else if (timeAgo.TotalDays < 30) {
            int weeks = (int)(timeAgo.TotalDays / 7);
            timeReference = $"{weeks} {(weeks == 1 ? "week" : "weeks")} ago";
        } else {
            int months = (int)(timeAgo.TotalDays / 30);
            timeReference = $"{months} {(months == 1 ? "month" : "months")} ago";
        }
        
        string[] templates = {
            $"Remember when we {memory.description} {timeReference}?",
            $"I loved when we {memory.description}!",
            $"Can we {memory.description} again like {timeReference}?",
            $"I still think about when we {memory.description}!"
        };
        
        return templates[UnityEngine.Random.Range(0, templates.Length)];
    }
    
    /// <summary>
    /// Gets the current separation anxiety level
    /// </summary>
    public float GetSeparationAnxiety() {
        return separation.anxietyLevel;
    }
    
    /// <summary>
    /// Gets the current attachment level
    /// </summary>
    public float GetAttachmentLevel() {
        return attachment.currentAttachmentLevel;
    }
    
    /// <summary>
    /// Add a name that the pet will respond to
    /// </summary>
    public void AddPetName(string name) {
        if (string.IsNullOrEmpty(name) || attachment.petNames.Contains(name)) return;
        
        attachment.petNames.Add(name);
        SaveAttachmentData();
    }
    
    /// <summary>
    /// Record an interaction that increases attachment
    /// </summary>
    public void RecordPositiveInteraction(float strength = 1.0f) {
        // Modify attachment growth based on personality
        float attachmentModifier = 1.0f;
        if (personalitySystem != null) {
            // Get affection trait for attachment modifier
            float affection = personalitySystem.GetTraitValue(PersonalitySystem.PersonalityTrait.TraitCategory.Affection);
            attachmentModifier = Mathf.Lerp(0.5f, 1.5f, (affection + 100f) / 200f);
        }
        
        // Apply growth
        attachment.currentAttachmentLevel += attachment.attachmentGrowthRate * strength * attachmentModifier;
        attachment.currentAttachmentLevel = Mathf.Min(attachment.currentAttachmentLevel, 100f);
        
        // Increase recognition
        attachment.recognitionLevel += 0.2f * strength;
        attachment.recognitionLevel = Mathf.Min(attachment.recognitionLevel, maxRecognitionGrowth);
        
        // Increase trust
        attachment.trustLevel += 0.1f * strength;
        attachment.trustLevel = Mathf.Min(attachment.trustLevel, 100f);
        
        // Reset separation state
        ResetSeparationState();
        
        // Handle first reunion after separation
        if (isFirstReunionAfterSeparation) {
            ApplyReunionBoost();
            isFirstReunionAfterSeparation = false;
        }
        
        // Save changes
        SaveAttachmentData();
    }
    
    /// <summary>
    /// Respond to separation anxiety with appropriate behaviors
    /// </summary>
    public void RespondToSeparation() {
        if (!enableSeparationAnxiety || separation.anxietyLevel < 20f) return;
        
        // Determine response based on anxiety level
        if (separation.anxietyLevel >= 60f) {
            // High anxiety - strong reaction
            if (animationController != null) {
                animationController.PlayAnimation("HighAnxiety");
            }
            
            if (notificationManager != null) {
                notificationManager.TriggerAlert("Your pet has been really lonely without you!");
            }
            
            if (audioManager != null) {
                audioManager.Play("SadWhine");
            }
        } else if (separation.anxietyLevel >= 30f) {
            // Medium anxiety - moderate reaction
            if (animationController != null) {
                animationController.PlayAnimation("MediumAnxiety");
            }
            
            if (notificationManager != null) {
                notificationManager.TriggerAlert("Your pet missed you while you were gone.");
            }
            
            if (audioManager != null) {
                audioManager.Play("SoftWhimper");
            }
        } else {
            // Low anxiety - mild reaction
            if (animationController != null) {
                animationController.PlayAnimation("SlightAnxiety");
            }
        }
        
        // Apply stats impact if pet is available
        if (pet != null && separation.anxietyLevel > 30f) {
            pet.Happiness = Mathf.Max(pet.Happiness - (separation.anxietyLevel * 0.2f), 0f);
        }
    }
    
    // Private implementation methods
    
    private void CheckSeparationState() {
        if (!enableSeparationAnxiety) return;
        
        DateTime now = DateTime.Now;
        TimeSpan timeSinceLastInteraction = now - separation.lastInteractionTime;
        
        if (timeSinceLastInteraction.TotalHours >= minSeparationHours) {
            // Calculate anxiety level based on time away and resiliency
            float baseAnxiety = Mathf.Min((float)timeSinceLastInteraction.TotalHours / 24f * 20f, maxSeparationAnxiety);
            float resiliencyFactor = (100f - attachment.separationResiliency) / 100f;
            separation.anxietyLevel = baseAnxiety * resiliencyFactor;
            
            // Count missed care routines (roughly 3 per day)
            separation.missedCareRoutines = Mathf.FloorToInt((float)timeSinceLastInteraction.TotalHours / 8f);
            
            // Set separation flag
            separation.isSeparationAnxious = separation.anxietyLevel > 20f;
            
            // Set reunion flag
            isFirstReunionAfterSeparation = true;
            
            // Calculate reunion boost based on attachment and time
            float attachmentFactor = attachment.currentAttachmentLevel / 100f;
            float timeAwayFactor = Mathf.Min((float)timeSinceLastInteraction.TotalHours / 48f, 1f);
            separation.reunionBoostFactor = 1f + (attachmentFactor * timeAwayFactor);
            
            Debug.Log($"[AttachmentSystem] Separation detected: {timeSinceLastInteraction.TotalHours} hours, Anxiety: {separation.anxietyLevel}");
            
            // Respond to separation
            RespondToSeparation();
        } else {
            // Reset anxiety if recently interacted
            separation.anxietyLevel = 0f;
            separation.isSeparationAnxious = false;
        }
    }
    
    private void UpdateAttachment() {
        DateTime now = DateTime.Now;
        TimeSpan timeSinceLastUpdate = now - lastAttachmentUpdate;
        
        // Decay attachment over time
        if (timeSinceLastUpdate.TotalDays >= 1) {
            float decayAmount = attachment.attachmentDecayRate * (float)timeSinceLastUpdate.TotalDays;
            attachment.currentAttachmentLevel = Mathf.Max(attachment.currentAttachmentLevel - decayAmount, attachment.baseAttachmentLevel);
            
            // Don't decay recognition/trust much
            attachment.recognitionLevel = Mathf.Max(attachment.recognitionLevel - (decayAmount * 0.1f), 0f);
            attachment.trustLevel = Mathf.Max(attachment.trustLevel - (decayAmount * 0.2f), 0f);
            
            lastAttachmentUpdate = now;
        }
    }
    
    private void DecayMemories() {
        DateTime now = DateTime.Now;
        TimeSpan timeSinceLastDecay = now - lastMemoryDecayTime;
        
        if (timeSinceLastDecay.TotalDays >= 1) {
            foreach (var memory in memories) {
                if (!memory.isPinnedMemory) {
                    float decayAmount = memory.decayRate * (float)timeSinceLastDecay.TotalDays;
                    memory.significanceValue = Mathf.Max(memory.significanceValue - decayAmount, 0f);
                }
            }
            
            lastMemoryDecayTime = now;
        }
    }
    
    private void ResetSeparationState() {
        separation.lastInteractionTime = DateTime.Now;
        separation.isSeparationAnxious = false;
        separation.missedCareRoutines = 0;
    }
    
    private void ApplyReunionBoost() {
        if (pet != null) {
            // Apply happiness boost
            float boost = 10f * separation.reunionBoostFactor;
            pet.Happiness = Mathf.Min(pet.Happiness + boost, 100f);
            
            // Play reunion animation
            if (animationController != null) {
                animationController.PlayAnimation("HappyReunion");
            }
            
            // Play reunion sound
            if (audioManager != null) {
                audioManager.Play("HappyReunion");
            }
            
            // Show reunion message
            if (notificationManager != null) {
                notificationManager.TriggerAlert("Your pet is so happy to see you again!");
            }
            
            // Record significant reunion memory if separation was long
            if (separation.anxietyLevel >= 50f) {
                RecordMemory("Reunion", "had a heartfelt reunion", 85f);
            }
        }
    }
    
    private void SubscribeToEvents() {
        if (pet != null) {
            // Record all interactions with pet
            var originalFeed = pet.Feed;
            pet.Feed = () => {
                originalFeed();
                RecordPositiveInteraction(1.0f);
                // Small chance to create feed memory
                if (UnityEngine.Random.value < 0.1f) {
                    RecordMemory("Feed", "shared a special meal", UnityEngine.Random.Range(40f, 60f));
                }
            };
            
            var originalPlay = pet.Play;
            pet.Play = () => {
                originalPlay();
                RecordPositiveInteraction(1.5f);
                // Higher chance to create play memory
                if (UnityEngine.Random.value < 0.2f) {
                    RecordMemory("Play", "played a fun game together", UnityEngine.Random.Range(50f, 70f));
                }
            };
            
            var originalDrink = pet.Drink;
            pet.Drink = () => {
                originalDrink();
                RecordPositiveInteraction(0.8f);
            };
        }
    }
    
    private void SaveAttachmentData() {
        // Save basic attachment data
        PlayerPrefs.SetFloat("Attachment_Level", attachment.currentAttachmentLevel);
        PlayerPrefs.SetFloat("Attachment_Recognition", attachment.recognitionLevel);
        PlayerPrefs.SetFloat("Attachment_Trust", attachment.trustLevel);
        PlayerPrefs.SetFloat("Attachment_Resiliency", attachment.separationResiliency);
        
        // Save separation state
        PlayerPrefs.SetString("Attachment_LastInteraction", separation.lastInteractionTime.ToString());
        
        // Save pet names
        PlayerPrefs.SetString("Attachment_PetNames", string.Join(",", attachment.petNames));
        
        // Save memories (only significant ones)
        int savedCount = 0;
        foreach (var memory in memories) {
            if (memory.significanceValue >= 30f || memory.isPinnedMemory) {
                PlayerPrefs.SetString($"Memory_{savedCount}_ID", memory.eventId);
                PlayerPrefs.SetString($"Memory_{savedCount}_Type", memory.eventType);
                PlayerPrefs.SetString($"Memory_{savedCount}_Desc", memory.description);
                PlayerPrefs.SetString($"Memory_{savedCount}_Time", memory.timestamp.ToString());
                PlayerPrefs.SetFloat($"Memory_{savedCount}_Sig", memory.significanceValue);
                PlayerPrefs.SetInt($"Memory_{savedCount}_Pinned", memory.isPinnedMemory ? 1 : 0);
                savedCount++;
            }
        }
        
        PlayerPrefs.SetInt("Memory_Count", savedCount);
        PlayerPrefs.Save();
    }
    
    private void LoadAttachmentData() {
        // Load basic attachment data
        if (PlayerPrefs.HasKey("Attachment_Level")) {
            attachment.currentAttachmentLevel = PlayerPrefs.GetFloat("Attachment_Level");
            attachment.recognitionLevel = PlayerPrefs.GetFloat("Attachment_Recognition");
            attachment.trustLevel = PlayerPrefs.GetFloat("Attachment_Trust");
            attachment.separationResiliency = PlayerPrefs.GetFloat("Attachment_Resiliency");
        }
        
        // Load separation state
        if (PlayerPrefs.HasKey("Attachment_LastInteraction")) {
            try {
                separation.lastInteractionTime = DateTime.Parse(PlayerPrefs.GetString("Attachment_LastInteraction"));
            } catch {
                separation.lastInteractionTime = DateTime.Now;
            }
        } else {
            separation.lastInteractionTime = DateTime.Now;
        }
        
        // Load pet names
        if (PlayerPrefs.HasKey("Attachment_PetNames")) {
            string namesStr = PlayerPrefs.GetString("Attachment_PetNames");
            if (!string.IsNullOrEmpty(namesStr)) {
                attachment.petNames = new List<string>(namesStr.Split(','));
            }
        }
        
        // Load memories
        int memoryCount = PlayerPrefs.GetInt("Memory_Count", 0);
        memories.Clear();
        
        for (int i = 0; i < memoryCount; i++) {
            try {
                string id = PlayerPrefs.GetString($"Memory_{i}_ID");
                string type = PlayerPrefs.GetString($"Memory_{i}_Type");
                string desc = PlayerPrefs.GetString($"Memory_{i}_Desc");
                DateTime time = DateTime.Parse(PlayerPrefs.GetString($"Memory_{i}_Time"));
                float sig = PlayerPrefs.GetFloat($"Memory_{i}_Sig");
                bool pinned = PlayerPrefs.GetInt($"Memory_{i}_Pinned") == 1;
                
                MemoryEvent memory = new MemoryEvent {
                    eventId = id,
                    eventType = type,
                    description = desc,
                    timestamp = time,
                    significanceValue = sig,
                    isPinnedMemory = pinned
                };
                
                memories.Add(memory);
            } catch (Exception e) {
                Debug.LogWarning($"[AttachmentSystem] Error loading memory {i}: {e.Message}");
            }
        }
    }
    
    void OnGUI() {
        if (showAttachmentDebug && Application.isEditor) {
            GUILayout.BeginArea(new Rect(10, 200, 300, 300));
            GUILayout.Label("Attachment System Debug:");
            GUILayout.Label($"Attachment Level: {attachment.currentAttachmentLevel:F1}");
            GUILayout.Label($"Recognition: {attachment.recognitionLevel:F1}");
            GUILayout.Label($"Trust: {attachment.trustLevel:F1}");
            GUILayout.Label($"Separation Anxiety: {separation.anxietyLevel:F1}");
            GUILayout.Label($"Memories: {memories.Count}");
            
            if (GUILayout.Button("Record Test Memory")) {
                RecordMemory("Test", "did something really fun", 75f);
            }
            
            if (GUILayout.Button("Test Reunion Effect")) {
                separation.anxietyLevel = 50f;
                separation.reunionBoostFactor = 2f;
                isFirstReunionAfterSeparation = true;
                ApplyReunionBoost();
            }
            
            GUILayout.EndArea();
        }
    }
    
    void OnApplicationPause(bool pauseStatus) {
        if (pauseStatus) {
            // Save when app is paused
            SaveAttachmentData();
        } else {
            // Check separation when app resumes
            CheckSeparationState();
        }
    }
    
    void OnApplicationQuit() {
        // Save when app is closed
        SaveAttachmentData();
    }
}