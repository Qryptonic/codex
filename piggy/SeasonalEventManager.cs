using UnityEngine;
using System;
using System.Collections;
using System.Collections.Generic;

/// <summary>
/// Manages seasonal events, limited-time content, and holiday-themed features
/// </summary>
public class SeasonalEventManager : MonoBehaviour {
    [System.Serializable]
    public class SeasonalEvent {
        public string eventId;
        public string displayName;
        [TextArea(2, 4)]
        public string description;
        public Sprite eventIcon;
        public DateTime startDate;
        public DateTime endDate;
        public bool isActive;
        public Color themeColor = Color.white;
        public List<string> unlockedAccessories = new List<string>();
        public List<string> unlockedMinigames = new List<string>();
        public GameObject decorationPrefab;
        public string musicTrackId;
    }
    
    [System.Serializable]
    public class SeasonalQuest {
        public string questId;
        public string displayName;
        [TextArea(2, 3)]
        public string description;
        public string eventId;
        public int targetCount;
        public string actionType; // "Feed", "Play", etc.
        public SeasonalReward reward;
        [HideInInspector]
        public int currentProgress;
        [HideInInspector]
        public bool isCompleted;
    }
    
    [System.Serializable]
    public class SeasonalReward {
        public string rewardId;
        public string displayName;
        public Sprite rewardIcon;
        public RewardType rewardType;
        public string rewardValue; // Accessory ID, theme ID, etc.
        public enum RewardType {
            Accessory,
            Currency,
            Theme,
            Minigame,
            Decoration
        }
    }
    
    [Header("Seasonal Events Configuration")]
    [SerializeField] private List<SeasonalEvent> seasonalEvents = new List<SeasonalEvent>();
    [SerializeField] private List<SeasonalQuest> seasonalQuests = new List<SeasonalQuest>();
    
    [Header("Event Objects")]
    [SerializeField] private Transform eventDecorationParent;
    
    [Header("References")]
    [SerializeField] private VirtualPetUnity pet;
    [SerializeField] private CustomizationManager customizationManager;
    [SerializeField] private AudioManager audioManager;
    [SerializeField] private NotificationManager notificationManager;
    
    [Header("Settings")]
    [SerializeField] private bool checkRealWorldDate = true;
    [SerializeField] private bool forceEventForTesting = false;
    [SerializeField] private string forcedEventId = "";
    [SerializeField] private float eventCheckInterval = 3600f; // 1 hour
    
    private Dictionary<string, GameObject> activeDecorations = new Dictionary<string, GameObject>();
    private SeasonalEvent currentEvent;
    private DateTime lastEventCheck;
    
    void Start() {
        // Check for active events
        CheckForActiveEvents();
        
        // Load saved quest progress
        LoadQuestProgress();
        
        // Start periodic event checking
        StartCoroutine(EventCheckRoutine());
        
        // Subscribe to relevant events
        SubscribeToEvents();
    }
    
    /// <summary>
    /// Checks if any seasonal events should be active based on the current date
    /// </summary>
    public void CheckForActiveEvents() {
        lastEventCheck = DateTime.Now;
        SeasonalEvent newEvent = null;
        
        if (forceEventForTesting && !string.IsNullOrEmpty(forcedEventId)) {
            // Force a specific event for testing
            newEvent = seasonalEvents.Find(e => e.eventId == forcedEventId);
            if (newEvent != null) {
                newEvent.isActive = true;
            }
        } else if (checkRealWorldDate) {
            // Check each event against the current date
            DateTime now = DateTime.Now;
            foreach (var evt in seasonalEvents) {
                bool wasActive = evt.isActive;
                evt.isActive = (now >= evt.startDate && now <= evt.endDate);
                
                // If this event just became active, it's the new current event
                if (evt.isActive && !wasActive) {
                    newEvent = evt;
                }
                
                // If this event just ended, clean it up
                if (!evt.isActive && wasActive && currentEvent?.eventId == evt.eventId) {
                    EndCurrentEvent();
                }
            }
        }
        
        // If we have a new active event, start it
        if (newEvent != null && (currentEvent == null || currentEvent.eventId != newEvent.eventId)) {
            StartEvent(newEvent);
        }
    }
    
    /// <summary>
    /// Manually activates a specific event
    /// </summary>
    public void ActivateEvent(string eventId) {
        SeasonalEvent evt = seasonalEvents.Find(e => e.eventId == eventId);
        if (evt != null) {
            // End current event if there is one
            if (currentEvent != null) {
                EndCurrentEvent();
            }
            
            evt.isActive = true;
            StartEvent(evt);
        }
    }
    
    /// <summary>
    /// Manually deactivates the current event
    /// </summary>
    public void DeactivateCurrentEvent() {
        if (currentEvent != null) {
            currentEvent.isActive = false;
            EndCurrentEvent();
        }
    }
    
    /// <summary>
    /// Gets the currently active event
    /// </summary>
    public SeasonalEvent GetCurrentEvent() {
        return currentEvent;
    }
    
    /// <summary>
    /// Gets all quests for a specific event
    /// </summary>
    public List<SeasonalQuest> GetEventQuests(string eventId) {
        return seasonalQuests.FindAll(q => q.eventId == eventId);
    }
    
    /// <summary>
    /// Records progress for event quests
    /// </summary>
    public void RecordQuestAction(string actionType, int count = 1) {
        if (currentEvent == null) return;
        
        bool anyUpdated = false;
        
        // Update progress for matching quests
        foreach (var quest in seasonalQuests) {
            if (quest.eventId == currentEvent.eventId && 
                quest.actionType == actionType && 
                !quest.isCompleted) {
                
                quest.currentProgress += count;
                
                // Check for completion
                if (quest.currentProgress >= quest.targetCount) {
                    quest.isCompleted = true;
                    GiveQuestReward(quest);
                }
                
                anyUpdated = true;
            }
        }
        
        // Save progress if any quests were updated
        if (anyUpdated) {
            SaveQuestProgress();
        }
    }
    
    /// <summary>
    /// Resets all quest progress for the given event
    /// </summary>
    public void ResetEventQuests(string eventId) {
        bool anyReset = false;
        
        foreach (var quest in seasonalQuests) {
            if (quest.eventId == eventId) {
                quest.currentProgress = 0;
                quest.isCompleted = false;
                anyReset = true;
            }
        }
        
        if (anyReset) {
            SaveQuestProgress();
        }
    }
    
    // Private implementation methods
    
    private void StartEvent(SeasonalEvent evt) {
        currentEvent = evt;
        
        // Notify the player about the event
        if (notificationManager != null) {
            notificationManager.TriggerAlert($"New event started: {evt.displayName}!");
        }
        
        // Apply event decorations
        if (evt.decorationPrefab != null && eventDecorationParent != null) {
            GameObject decoration = Instantiate(evt.decorationPrefab, eventDecorationParent);
            activeDecorations[evt.eventId] = decoration;
        }
        
        // Play event music
        if (audioManager != null && !string.IsNullOrEmpty(evt.musicTrackId)) {
            audioManager.PlayMusic(evt.musicTrackId);
        }
        
        // Reset quest progress for this event
        ResetEventQuests(evt.eventId);
        
        // Notify other systems about the event
        EventStarted(evt);
    }
    
    private void EndCurrentEvent() {
        if (currentEvent == null) return;
        
        // Remove decorations
        string eventId = currentEvent.eventId;
        if (activeDecorations.TryGetValue(eventId, out GameObject decoration)) {
            Destroy(decoration);
            activeDecorations.Remove(eventId);
        }
        
        // Return to default music
        if (audioManager != null) {
            audioManager.PlayMusic("Theme");
        }
        
        // Notify other systems
        EventEnded(currentEvent);
        
        currentEvent = null;
    }
    
    private void GiveQuestReward(SeasonalQuest quest) {
        if (quest.reward == null) return;
        
        // Process different reward types
        switch (quest.reward.rewardType) {
            case SeasonalReward.RewardType.Accessory:
                if (customizationManager != null) {
                    customizationManager.UnlockAccessory(quest.reward.rewardValue);
                }
                break;
                
            case SeasonalReward.RewardType.Theme:
                // Apply theme if you have a theming system
                break;
                
            case SeasonalReward.RewardType.Minigame:
                // Unlock minigame if you have a minigame system
                MinigameManager minigameManager = FindObjectOfType<MinigameManager>();
                if (minigameManager != null) {
                    minigameManager.UnlockMinigame(quest.reward.rewardValue);
                }
                break;
                
            case SeasonalReward.RewardType.Decoration:
                // Add decoration if you have a decoration system
                break;
                
            case SeasonalReward.RewardType.Currency:
                // Add currency if you have an economy system
                break;
        }
        
        // Notify the player
        if (notificationManager != null) {
            notificationManager.TriggerAlert($"Quest completed: {quest.displayName}! Reward: {quest.reward.displayName}");
        }
        
        // Play reward sound
        if (audioManager != null) {
            audioManager.Play("QuestComplete");
        }
    }
    
    private IEnumerator EventCheckRoutine() {
        while (true) {
            yield return new WaitForSeconds(eventCheckInterval);
            CheckForActiveEvents();
        }
    }
    
    private void SaveQuestProgress() {
        if (currentEvent == null) return;
        
        // Get quests for current event
        List<SeasonalQuest> eventQuests = GetEventQuests(currentEvent.eventId);
        
        // Save progress to PlayerPrefs (simple implementation)
        foreach (var quest in eventQuests) {
            string progressKey = $"QuestProgress_{quest.eventId}_{quest.questId}";
            PlayerPrefs.SetInt(progressKey, quest.currentProgress);
            
            string completedKey = $"QuestCompleted_{quest.eventId}_{quest.questId}";
            PlayerPrefs.SetInt(completedKey, quest.isCompleted ? 1 : 0);
        }
        
        PlayerPrefs.Save();
    }
    
    private void LoadQuestProgress() {
        // Load all quest progress from PlayerPrefs
        foreach (var quest in seasonalQuests) {
            string progressKey = $"QuestProgress_{quest.eventId}_{quest.questId}";
            if (PlayerPrefs.HasKey(progressKey)) {
                quest.currentProgress = PlayerPrefs.GetInt(progressKey);
            }
            
            string completedKey = $"QuestCompleted_{quest.eventId}_{quest.questId}";
            if (PlayerPrefs.HasKey(completedKey)) {
                quest.isCompleted = PlayerPrefs.GetInt(completedKey) == 1;
            }
        }
    }
    
    private void SubscribeToEvents() {
        // Subscribe to relevant events in your system
        // Example:
        if (pet != null) {
            // You could add event hooks to the pet's actions
            // pet.OnFed.AddListener(() => RecordQuestAction("Feed"));
            // pet.OnPlayed.AddListener(() => RecordQuestAction("Play"));
        }
    }
    
    // Event propagation to other systems
    private void EventStarted(SeasonalEvent evt) {
        Debug.Log($"[SeasonalEventManager] Event started: {evt.displayName}");
        
        // Broadcast to other systems if needed
    }
    
    private void EventEnded(SeasonalEvent evt) {
        Debug.Log($"[SeasonalEventManager] Event ended: {evt.displayName}");
        
        // Broadcast to other systems if needed
    }
    
    // Unity lifecycle
    void OnApplicationPause(bool pauseStatus) {
        if (!pauseStatus) {
            // Check for events when app resumes
            CheckForActiveEvents();
        }
    }
}