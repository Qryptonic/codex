using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System;

/// <summary>
/// Manages hidden interactions, easter eggs, and secret discoveries
/// </summary>
public class SecretDiscoverySystem : MonoBehaviour {
    [System.Serializable]
    public class SecretDiscovery {
        public string discoveryId;
        public string displayName;
        [TextArea(2, 4)]
        public string description;
        public DiscoveryType type;
        public DiscoveryTrigger trigger;
        public string specificTriggerValue; // For specific triggers like time, date, etc.
        public Sprite discoveryImage;
        public string animationTrigger;
        public string soundEffect;
        public bool isDiscovered;
        public Reward reward;
        public float chance = 1.0f; // For random discoveries
        public float cooldownHours = 24f;
        
        public enum DiscoveryType {
            EasterEgg,
            RareAnimation,
            SpecialItem,
            HiddenArea,
            Achievement,
            SecretAbility
        }
        
        public enum DiscoveryTrigger {
            SpecificTime,       // E.g., midnight
            SpecificDate,       // E.g., holidays
            PatternInteraction, // E.g., feed-pet-feed sequence
            LocationBased,      // E.g., bathroom
            RareRandom,         // Random chance during normal play
            CombinationItem,    // Combine items
            SpecificPhrase,     // Say specific phrase
            WeatherBased,       // E.g., when it's raining
            SequentialTouches,  // Touch in specific pattern
            LongInactivity      // When not played for days
        }
    }
    
    [System.Serializable]
    public class Reward {
        public RewardType type;
        public float value;
        public string rewardId; // For specific items, accessories, etc.
        
        public enum RewardType {
            SpecialAccessory,
            UnlockAnimation,
            SpecialAbility,
            CustomBackground,
            PhotoFrames,
            MusicTrack
        }
    }
    
    [System.Serializable]
    public class InteractionSequence {
        public List<string> actions = new List<string>();
        public float timeWindow = 10f; // Seconds to complete sequence
        public string discoveryId; // The discovery this triggers
    }
    
    [Header("Secret Discoveries")]
    [SerializeField] private List<SecretDiscovery> discoveries = new List<SecretDiscovery>();
    [SerializeField] private List<InteractionSequence> sequences = new List<InteractionSequence>();
    
    [Header("Trigger Settings")]
    [SerializeField] private float randomDiscoveryChance = 0.01f; // Per check
    [SerializeField] private float checkInterval = 300f; // 5 minutes
    [SerializeField] private bool useRealWorldTriggers = true;
    
    [Header("Pattern Recognition")]
    [SerializeField] private float patternTimeWindow = 10f;
    [SerializeField] private int maxSequenceLength = 5;
    
    [Header("Feedback")]
    [SerializeField] private GameObject discoveryPopup;
    [SerializeField] private ParticleSystem discoveryParticles;
    
    [Header("References")]
    [SerializeField] private VirtualPetUnity pet;
    [SerializeField] private MicroAnimationController animationController;
    [SerializeField] private AudioManager audioManager;
    [SerializeField] private NotificationManager notificationManager;
    
    private List<string> recentInteractions = new List<string>();
    private List<DateTime> interactionTimes = new List<DateTime>();
    private Dictionary<string, DateTime> lastDiscoveryTimes = new Dictionary<string, DateTime>();
    private int totalDiscoveries = 0;
    
    void Start() {
        // Load discovered secrets
        LoadDiscoveries();
        
        // Start discovery check routine
        StartCoroutine(DiscoveryCheckRoutine());
        
        // Subscribe to various events to capture interactions
        SubscribeToEvents();
    }
    
    /// <summary>
    /// Records a player interaction that might trigger a secret
    /// </summary>
    public void RecordInteraction(string actionType) {
        // Add to recent interactions
        recentInteractions.Add(actionType);
        interactionTimes.Add(DateTime.Now);
        
        // Keep list at max length
        while (recentInteractions.Count > maxSequenceLength) {
            recentInteractions.RemoveAt(0);
            interactionTimes.RemoveAt(0);
        }
        
        // Check for pattern-based secrets
        CheckForSequenceDiscoveries();
        
        // Check for specific action secrets
        CheckForSpecificActionDiscoveries(actionType);
        
        // Random chance for discovery during any interaction
        if (UnityEngine.Random.value < randomDiscoveryChance) {
            TriggerRandomDiscovery();
        }
    }
    
    /// <summary>
    /// Gets all discovered secrets
    /// </summary>
    public List<SecretDiscovery> GetDiscoveredSecrets() {
        return discoveries.FindAll(d => d.isDiscovered);
    }
    
    /// <summary>
    /// Gets the count of discovered secrets
    /// </summary>
    public int GetDiscoveryCount() {
        return discoveries.Count(d => d.isDiscovered);
    }
    
    /// <summary>
    /// Manually triggers a specific discovery (for testing or quests)
    /// </summary>
    public void TriggerDiscovery(string discoveryId) {
        SecretDiscovery discovery = discoveries.Find(d => d.discoveryId == discoveryId);
        if (discovery != null) {
            RevealDiscovery(discovery);
        }
    }
    
    // Private implementation methods
    
    private IEnumerator DiscoveryCheckRoutine() {
        yield return new WaitForSeconds(UnityEngine.Random.Range(1f, 10f)); // Initial delay
        
        while (true) {
            // Check time-based discoveries
            if (useRealWorldTriggers) {
                CheckTimeBasedDiscoveries();
                CheckDateBasedDiscoveries();
                CheckWeatherBasedDiscoveries();
                CheckLocationBasedDiscoveries();
                CheckLongInactivityDiscoveries();
            }
            
            yield return new WaitForSeconds(checkInterval);
        }
    }
    
    private void CheckForSequenceDiscoveries() {
        if (recentInteractions.Count < 2) return;
        
        // Clean up old interactions
        CleanupOldInteractions();
        
        // Check each defined sequence
        foreach (var sequence in sequences) {
            if (sequence.actions.Count > recentInteractions.Count) continue;
            
            // Check if recent interactions end with this sequence
            bool matches = true;
            for (int i = 0; i < sequence.actions.Count; i++) {
                int index = recentInteractions.Count - sequence.actions.Count + i;
                if (recentInteractions[index] != sequence.actions[i]) {
                    matches = false;
                    break;
                }
            }
            
            if (matches) {
                // Check if sequence was performed within time window
                DateTime startTime = interactionTimes[interactionTimes.Count - sequence.actions.Count];
                DateTime endTime = interactionTimes[interactionTimes.Count - 1];
                
                TimeSpan span = endTime - startTime;
                if (span.TotalSeconds <= sequence.timeWindow) {
                    // Trigger the associated discovery
                    TriggerDiscovery(sequence.discoveryId);
                    break;
                }
            }
        }
    }
    
    private void CheckForSpecificActionDiscoveries(string actionType) {
        foreach (var discovery in discoveries) {
            if (discovery.isDiscovered) continue;
            
            if (discovery.trigger == SecretDiscovery.DiscoveryTrigger.SpecificPhrase && 
                discovery.specificTriggerValue == actionType) {
                
                if (IsCooldownElapsed(discovery)) {
                    RevealDiscovery(discovery);
                }
            }
        }
    }
    
    private void CheckTimeBasedDiscoveries() {
        DateTime now = DateTime.Now;
        string currentTime = $"{now.Hour:00}:{now.Minute:00}";
        
        foreach (var discovery in discoveries) {
            if (discovery.isDiscovered) continue;
            
            if (discovery.trigger == SecretDiscovery.DiscoveryTrigger.SpecificTime && 
                discovery.specificTriggerValue == currentTime) {
                
                if (IsCooldownElapsed(discovery)) {
                    RevealDiscovery(discovery);
                }
            }
        }
    }
    
    private void CheckDateBasedDiscoveries() {
        DateTime now = DateTime.Now;
        string currentDate = $"{now.Month:00}-{now.Day:00}";
        
        foreach (var discovery in discoveries) {
            if (discovery.isDiscovered) continue;
            
            if (discovery.trigger == SecretDiscovery.DiscoveryTrigger.SpecificDate && 
                discovery.specificTriggerValue == currentDate) {
                
                if (IsCooldownElapsed(discovery)) {
                    RevealDiscovery(discovery);
                }
            }
        }
    }
    
    private void CheckWeatherBasedDiscoveries() {
        // Get weather information from WeatherManager if available
        WeatherManager weatherManager = FindObjectOfType<WeatherManager>();
        if (weatherManager == null) return;
        
        var weatherData = weatherManager.GetCurrentWeather();
        if (weatherData == null) return;
        
        foreach (var discovery in discoveries) {
            if (discovery.isDiscovered) continue;
            
            if (discovery.trigger == SecretDiscovery.DiscoveryTrigger.WeatherBased && 
                discovery.specificTriggerValue == weatherData.weatherType) {
                
                if (IsCooldownElapsed(discovery)) {
                    RevealDiscovery(discovery);
                }
            }
        }
    }
    
    private void CheckLocationBasedDiscoveries() {
        // This would use device location in a real implementation
        // For now, we'll simulate with random locations
        
        if (UnityEngine.Random.value < 0.01f) {
            string[] locations = { "Home", "Park", "School", "Beach", "Restaurant" };
            string currentLocation = locations[UnityEngine.Random.Range(0, locations.Length)];
            
            foreach (var discovery in discoveries) {
                if (discovery.isDiscovered) continue;
                
                if (discovery.trigger == SecretDiscovery.DiscoveryTrigger.LocationBased && 
                    discovery.specificTriggerValue == currentLocation) {
                    
                    if (IsCooldownElapsed(discovery)) {
                        RevealDiscovery(discovery);
                    }
                }
            }
        }
    }
    
    private void CheckLongInactivityDiscoveries() {
        // Check if app hasn't been used for a while
        if (PlayerPrefs.HasKey("LastPlayTime")) {
            string lastPlayTimeStr = PlayerPrefs.GetString("LastPlayTime");
            DateTime lastPlayTime;
            
            if (DateTime.TryParse(lastPlayTimeStr, out lastPlayTime)) {
                TimeSpan inactiveTime = DateTime.Now - lastPlayTime;
                
                foreach (var discovery in discoveries) {
                    if (discovery.isDiscovered) continue;
                    
                    if (discovery.trigger == SecretDiscovery.DiscoveryTrigger.LongInactivity) {
                        // Parse days from specificTriggerValue
                        int requiredDays;
                        if (int.TryParse(discovery.specificTriggerValue, out requiredDays)) {
                            if (inactiveTime.TotalDays >= requiredDays) {
                                if (IsCooldownElapsed(discovery)) {
                                    RevealDiscovery(discovery);
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Update last play time
        PlayerPrefs.SetString("LastPlayTime", DateTime.Now.ToString());
    }
    
    private void TriggerRandomDiscovery() {
        // Get eligible random discoveries
        var randomDiscoveries = discoveries.FindAll(d => 
            !d.isDiscovered && 
            d.trigger == SecretDiscovery.DiscoveryTrigger.RareRandom && 
            IsCooldownElapsed(d));
        
        if (randomDiscoveries.Count > 0) {
            // Apply individual chance
            foreach (var discovery in randomDiscoveries) {
                if (UnityEngine.Random.value < discovery.chance) {
                    RevealDiscovery(discovery);
                    return;
                }
            }
        }
    }
    
    private void RevealDiscovery(SecretDiscovery discovery) {
        if (discovery.isDiscovered && discovery.type != SecretDiscovery.DiscoveryType.RareAnimation) {
            // Skip if already discovered, except for rare animations which can replay
            return;
        }
        
        // Mark as discovered
        discovery.isDiscovered = true;
        
        // Record discovery time
        lastDiscoveryTimes[discovery.discoveryId] = DateTime.Now;
        
        // Increment total count for first-time discoveries
        if (discovery.type != SecretDiscovery.DiscoveryType.RareAnimation || 
            !lastDiscoveryTimes.ContainsKey(discovery.discoveryId)) {
            totalDiscoveries++;
        }
        
        // Play discovery effects
        PlayDiscoveryEffects(discovery);
        
        // Apply rewards if any
        ApplyDiscoveryReward(discovery);
        
        // Save discoveries
        SaveDiscoveries();
        
        Debug.Log($"[SecretDiscovery] Discovered: {discovery.displayName}");
    }
    
    private void PlayDiscoveryEffects(SecretDiscovery discovery) {
        // Show discovery popup
        if (discoveryPopup != null) {
            // Set popup content (depends on your UI setup)
            TMPro.TextMeshProUGUI titleText = discoveryPopup.GetComponentInChildren<TMPro.TextMeshProUGUI>();
            if (titleText != null) {
                titleText.text = discovery.displayName;
            }
            
            // Find description text
            TMPro.TextMeshProUGUI descText = null;
            TMPro.TextMeshProUGUI[] texts = discoveryPopup.GetComponentsInChildren<TMPro.TextMeshProUGUI>();
            if (texts.Length > 1) {
                descText = texts[1]; // Assumes second text is description
            }
            
            if (descText != null) {
                descText.text = discovery.description;
            }
            
            // Find image if any
            Image image = discoveryPopup.GetComponentInChildren<Image>();
            if (image != null && discovery.discoveryImage != null) {
                image.sprite = discovery.discoveryImage;
            }
            
            // Show popup
            discoveryPopup.SetActive(true);
            
            // Hide after delay
            StartCoroutine(HidePopupAfterDelay(8f));
        }
        
        // Play particles
        if (discoveryParticles != null) {
            discoveryParticles.Play();
        }
        
        // Play animation if specified
        if (!string.IsNullOrEmpty(discovery.animationTrigger) && animationController != null) {
            animationController.PlayAnimation(discovery.animationTrigger);
        }
        
        // Play sound if specified
        if (!string.IsNullOrEmpty(discovery.soundEffect) && audioManager != null) {
            audioManager.Play(discovery.soundEffect);
        }
        
        // Show notification
        if (notificationManager != null) {
            notificationManager.TriggerAlert($"Secret Discovered: {discovery.displayName}!");
        }
    }
    
    private void ApplyDiscoveryReward(SecretDiscovery discovery) {
        if (discovery.reward == null) return;
        
        switch (discovery.reward.type) {
            case Reward.RewardType.SpecialAccessory:
                // Unlock accessory
                CustomizationManager customizationManager = FindObjectOfType<CustomizationManager>();
                if (customizationManager != null) {
                    customizationManager.UnlockAccessory(discovery.reward.rewardId);
                }
                break;
                
            case Reward.RewardType.UnlockAnimation:
                // Unlock animation
                // Implementation depends on your animation system
                break;
                
            case Reward.RewardType.SpecialAbility:
                // Unlock special ability
                // Implementation depends on your ability system
                break;
                
            case Reward.RewardType.CustomBackground:
                // Unlock background
                // Implementation depends on your customization system
                break;
                
            case Reward.RewardType.PhotoFrames:
                // Unlock photo frame
                // Implementation depends on your photo system
                break;
                
            case Reward.RewardType.MusicTrack:
                // Unlock music track
                // Implementation depends on your audio system
                break;
        }
    }
    
    private void CleanupOldInteractions() {
        DateTime now = DateTime.Now;
        
        // Remove interactions outside the time window
        while (interactionTimes.Count > 0 && (now - interactionTimes[0]).TotalSeconds > patternTimeWindow) {
            interactionTimes.RemoveAt(0);
            recentInteractions.RemoveAt(0);
        }
    }
    
    private bool IsCooldownElapsed(SecretDiscovery discovery) {
        if (!lastDiscoveryTimes.ContainsKey(discovery.discoveryId)) {
            return true; // Never triggered before
        }
        
        TimeSpan timeSince = DateTime.Now - lastDiscoveryTimes[discovery.discoveryId];
        return timeSince.TotalHours >= discovery.cooldownHours;
    }
    
    private void SubscribeToEvents() {
        if (pet != null) {
            // Example: track feeding
            var originalFeed = pet.Feed;
            pet.Feed = () => {
                originalFeed();
                RecordInteraction("Feed");
            };
            
            // Example: track playing
            var originalPlay = pet.Play;
            pet.Play = () => {
                originalPlay();
                RecordInteraction("Play");
            };
            
            // Example: track drinking
            var originalDrink = pet.Drink;
            pet.Drink = () => {
                originalDrink();
                RecordInteraction("Drink");
            };
        }
        
        // Subscribe to other events as needed
    }
    
    private IEnumerator HidePopupAfterDelay(float delay) {
        yield return new WaitForSeconds(delay);
        
        if (discoveryPopup != null) {
            discoveryPopup.SetActive(false);
        }
    }
    
    private void SaveDiscoveries() {
        // Store discovered status
        for (int i = 0; i < discoveries.Count; i++) {
            PlayerPrefs.SetInt($"Discovery_{discoveries[i].discoveryId}_Found", discoveries[i].isDiscovered ? 1 : 0);
        }
        
        PlayerPrefs.SetInt("TotalDiscoveries", totalDiscoveries);
        PlayerPrefs.Save();
    }
    
    private void LoadDiscoveries() {
        totalDiscoveries = PlayerPrefs.GetInt("TotalDiscoveries", 0);
        
        for (int i = 0; i < discoveries.Count; i++) {
            string key = $"Discovery_{discoveries[i].discoveryId}_Found";
            if (PlayerPrefs.HasKey(key)) {
                discoveries[i].isDiscovered = PlayerPrefs.GetInt(key) == 1;
            }
        }
    }
    
    void OnApplicationPause(bool pauseStatus) {
        if (pauseStatus) {
            // Save when app is paused
            SaveDiscoveries();
        }
    }
    
    void OnApplicationQuit() {
        // Save when app is closed
        SaveDiscoveries();
    }
}