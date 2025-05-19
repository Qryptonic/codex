using UnityEngine;
using System.Collections;
using System.Collections.Generic;

/// <summary>
/// Manages pet growth, evolution, and life stages
/// </summary>
public class EvolutionManager : MonoBehaviour {
    [System.Serializable]
    public class LifeStage {
        public string stageName;
        public int minimumAgeDays;
        public float scaleFactor = 1.0f;
        public GameObject stagePrefab;
        public int minBondLevel = 0;
        [TextArea(2, 4)]
        public string unlockMessage;
        public List<string> unlockedFeatures = new List<string>();
        public List<string> specialAbilities = new List<string>();
        public string evolutionAnimation;
    }
    
    [System.Serializable]
    public class EvolutionPath {
        public string pathName;
        public List<EvolutionRequirement> requirements = new List<EvolutionRequirement>();
        public LifeStage targetStage;
        [TextArea(2, 4)]
        public string description;
    }
    
    [System.Serializable]
    public class EvolutionRequirement {
        public enum RequirementType {
            MinimumHappiness,
            MinimumHealth,
            MinimumBondLevel,
            MinimumAgeDays,
            CompletedQuests,
            FeedingCount,
            PlayCount,
            SpecificAccessory
        }
        
        public RequirementType type;
        public float value;
        public string stringValue; // For accessory ID, etc.
    }
    
    [Header("Evolution Settings")]
    [SerializeField] private List<LifeStage> lifeStages = new List<LifeStage>();
    [SerializeField] private List<EvolutionPath> evolutionPaths = new List<EvolutionPath>();
    [SerializeField] private float evolutionCheckInterval = 86400f; // 1 day in seconds
    [SerializeField] private bool manualEvolutionOnly = false;
    
    [Header("Display References")]
    [SerializeField] private Transform petContainer;
    [SerializeField] private ParticleSystem evolutionParticles;
    
    [Header("Pet References")]
    [SerializeField] private VirtualPetUnity pet;
    [SerializeField] private MicroAnimationController animationController;
    [SerializeField] private AudioManager audioManager;
    [SerializeField] private NotificationManager notificationManager;
    
    [Header("Debug")]
    [SerializeField] private bool debugEvolution = false;
    [SerializeField] private string debugStageName = "";
    
    private LifeStage currentStage;
    private GameObject currentStagePrefab;
    private float lastEvolutionCheck = 0f;
    private int ageDaysAtLastCheck = 0;
    private Dictionary<string, int> statCounts = new Dictionary<string, int>();
    
    void Start() {
        // Initialize statistics
        InitializeStats();
        
        // Load previous stage if any
        LoadEvolutionState();
        
        // Set initial stage if none
        if (currentStage == null) {
            SetInitialStage();
        }
        
        // Start evolution check routine
        StartCoroutine(EvolutionCheckRoutine());
        
        // Subscribe to pet events for tracking
        SubscribeToEvents();
    }
    
    /// <summary>
    /// Gets the current life stage
    /// </summary>
    public LifeStage GetCurrentStage() {
        return currentStage;
    }
    
    /// <summary>
    /// Gets a list of possible evolution paths from current stage
    /// </summary>
    public List<EvolutionPath> GetPossibleEvolutions() {
        List<EvolutionPath> possible = new List<EvolutionPath>();
        
        foreach (var path in evolutionPaths) {
            // Skip paths that don't start from current stage
            if (path.targetStage == null || 
                path.targetStage.minimumAgeDays <= GetCurrentStageMinAge()) {
                continue;
            }
            
            possible.Add(path);
        }
        
        return possible;
    }
    
    /// <summary>
    /// Records a stat that might affect evolution
    /// </summary>
    public void RecordStat(string statName, int increment = 1) {
        if (!statCounts.ContainsKey(statName)) {
            statCounts[statName] = 0;
        }
        
        statCounts[statName] += increment;
        
        // Save stats
        SaveStats();
    }
    
    /// <summary>
    /// Force evolution to a specific stage for debugging
    /// </summary>
    public void ForceEvolution(string stageName) {
        if (!debugEvolution && !Application.isEditor) {
            Debug.LogWarning("[EvolutionManager] Force evolution only available in debug mode");
            return;
        }
        
        LifeStage targetStage = lifeStages.Find(s => s.stageName == stageName);
        if (targetStage != null) {
            EvolveToStage(targetStage);
        } else {
            Debug.LogError($"[EvolutionManager] Stage not found: {stageName}");
        }
    }
    
    /// <summary>
    /// Check for possible evolutions and return next stage if any
    /// </summary>
    public LifeStage CheckEvolution() {
        if (currentStage == null || pet == null) return null;
        
        float petAge = pet.AgeDays;
        int bondLevel = GetBondLevel();
        
        // Check each evolution path
        foreach (var path in evolutionPaths) {
            if (path.targetStage == null) continue;
            
            // Skip if we're already at a higher stage
            if (path.targetStage.minimumAgeDays <= GetCurrentStageMinAge()) {
                continue;
            }
            
            // Check all requirements
            bool allRequirementsMet = true;
            foreach (var req in path.requirements) {
                if (!CheckRequirement(req)) {
                    allRequirementsMet = false;
                    break;
                }
            }
            
            if (allRequirementsMet) {
                return path.targetStage;
            }
        }
        
        // No evolution available
        return null;
    }
    
    // Private implementation methods
    
    private void InitializeStats() {
        statCounts["FeedCount"] = 0;
        statCounts["DrinkCount"] = 0;
        statCounts["PlayCount"] = 0;
        statCounts["QuestCount"] = 0;
    }
    
    private void SetInitialStage() {
        if (lifeStages.Count > 0) {
            LifeStage initialStage = lifeStages[0];
            EvolveToStage(initialStage, false);
        }
    }
    
    private IEnumerator EvolutionCheckRoutine() {
        while (true) {
            yield return new WaitForSeconds(evolutionCheckInterval);
            
            if (!manualEvolutionOnly) {
                // Check for automatic evolution
                LifeStage nextStage = CheckEvolution();
                if (nextStage != null) {
                    EvolveToStage(nextStage);
                }
            }
            
            // Update check timestamp
            lastEvolutionCheck = Time.time;
            if (pet != null) {
                ageDaysAtLastCheck = Mathf.FloorToInt(pet.AgeDays);
            }
        }
    }
    
    private void EvolveToStage(LifeStage stage, bool showEffects = true) {
        if (stage == null) return;
        
        // Store previous stage
        LifeStage previousStage = currentStage;
        currentStage = stage;
        
        // Play evolution effects
        if (showEffects) {
            StartCoroutine(PlayEvolutionEffects(previousStage, stage));
        }
        
        // Spawn new stage prefab
        SpawnStagePrefab(stage);
        
        // Save the new state
        SaveEvolutionState();
        
        // Unlock new features
        UnlockStageFeatures(stage);
        
        // Notify UI
        if (showEffects && notificationManager != null) {
            notificationManager.TriggerAlert($"Your pet evolved to: {stage.stageName}!");
        }
        
        Debug.Log($"[EvolutionManager] Evolved to stage: {stage.stageName}");
    }
    
    private bool CheckRequirement(EvolutionRequirement req) {
        if (pet == null) return false;
        
        switch (req.type) {
            case EvolutionRequirement.RequirementType.MinimumAgeDays:
                return pet.AgeDays >= req.value;
                
            case EvolutionRequirement.RequirementType.MinimumBondLevel:
                return GetBondLevel() >= req.value;
                
            case EvolutionRequirement.RequirementType.MinimumHappiness:
                return pet.Happiness >= req.value;
                
            case EvolutionRequirement.RequirementType.MinimumHealth:
                return pet.Health >= req.value;
                
            case EvolutionRequirement.RequirementType.FeedingCount:
                return GetStatCount("FeedCount") >= req.value;
                
            case EvolutionRequirement.RequirementType.PlayCount:
                return GetStatCount("PlayCount") >= req.value;
                
            case EvolutionRequirement.RequirementType.CompletedQuests:
                return GetStatCount("QuestCount") >= req.value;
                
            case EvolutionRequirement.RequirementType.SpecificAccessory:
                return HasAccessory(req.stringValue);
        }
        
        return false;
    }
    
    private int GetStatCount(string statName) {
        if (statCounts.TryGetValue(statName, out int count)) {
            return count;
        }
        return 0;
    }
    
    private int GetBondLevel() {
        AffectionMeter affectionMeter = pet.GetComponent<AffectionMeter>();
        return affectionMeter != null ? affectionMeter.GetBondLevel() : 0;
    }
    
    private bool HasAccessory(string accessoryId) {
        CustomizationManager customizationManager = FindObjectOfType<CustomizationManager>();
        if (customizationManager != null) {
            var currentAccessory = customizationManager.GetCurrentAccessory();
            return currentAccessory != null && currentAccessory.id == accessoryId;
        }
        return false;
    }
    
    private int GetCurrentStageMinAge() {
        return currentStage != null ? currentStage.minimumAgeDays : 0;
    }
    
    private void SpawnStagePrefab(LifeStage stage) {
        if (stage.stagePrefab == null || petContainer == null) return;
        
        // Destroy previous prefab if any
        if (currentStagePrefab != null) {
            Destroy(currentStagePrefab);
        }
        
        // Instantiate new prefab
        currentStagePrefab = Instantiate(stage.stagePrefab, petContainer);
        
        // Scale if needed
        if (stage.scaleFactor != 1.0f) {
            currentStagePrefab.transform.localScale = Vector3.one * stage.scaleFactor;
        }
        
        // Find animation controller
        if (currentStagePrefab.GetComponentInChildren<Animator>() != null && 
            animationController != null) {
            // Reconnect animator
            animationController.SetAnimator(currentStagePrefab.GetComponentInChildren<Animator>());
        }
    }
    
    private IEnumerator PlayEvolutionEffects(LifeStage fromStage, LifeStage toStage) {
        // Play sound
        if (audioManager != null) {
            audioManager.Play("Evolution");
        }
        
        // Play animation
        if (animationController != null && !string.IsNullOrEmpty(toStage.evolutionAnimation)) {
            animationController.PlayAnimation(toStage.evolutionAnimation);
        }
        
        // Play particles
        if (evolutionParticles != null) {
            evolutionParticles.gameObject.SetActive(true);
            evolutionParticles.Play();
            
            yield return new WaitForSeconds(3f);
            
            evolutionParticles.Stop();
            evolutionParticles.gameObject.SetActive(false);
        } else {
            yield return new WaitForSeconds(1f);
        }
    }
    
    private void UnlockStageFeatures(LifeStage stage) {
        // Unlock features based on the stage's unlockedFeatures list
        foreach (string feature in stage.unlockedFeatures) {
            // Example: unlock minigames
            if (feature.StartsWith("Minigame:")) {
                string minigameId = feature.Substring("Minigame:".Length);
                MinigameManager minigameManager = FindObjectOfType<MinigameManager>();
                if (minigameManager != null) {
                    minigameManager.UnlockMinigame(minigameId);
                }
            }
            // Example: unlock accessories
            else if (feature.StartsWith("Accessory:")) {
                string accessoryId = feature.Substring("Accessory:".Length);
                CustomizationManager customizationManager = FindObjectOfType<CustomizationManager>();
                if (customizationManager != null) {
                    customizationManager.UnlockAccessory(accessoryId);
                }
            }
        }
    }
    
    private void SubscribeToEvents() {
        // Subscribe to relevant events
        if (pet != null) {
            // Create feed delegate if there's a Feed method
            System.Reflection.MethodInfo feedMethod = pet.GetType().GetMethod("Feed");
            if (feedMethod != null) {
                // Use reflection to create delegate
                // For direct method, could use: pet.GetType().GetMethod("Feed").CreateDelegate(typeof(System.Action), pet) as System.Action;
                // Simplified approach here:
                var originalFeed = pet.Feed;
                pet.Feed = () => {
                    originalFeed();
                    RecordStat("FeedCount");
                };
            }
            
            // Similar for other methods
            // ...
        }
    }
    
    private void SaveEvolutionState() {
        if (currentStage == null) return;
        
        // Save the current stage
        PlayerPrefs.SetString("CurrentEvolutionStage", currentStage.stageName);
        PlayerPrefs.Save();
    }
    
    private void LoadEvolutionState() {
        if (PlayerPrefs.HasKey("CurrentEvolutionStage")) {
            string stageName = PlayerPrefs.GetString("CurrentEvolutionStage");
            LifeStage stage = lifeStages.Find(s => s.stageName == stageName);
            if (stage != null) {
                currentStage = stage;
                SpawnStagePrefab(stage);
            }
        }
    }
    
    private void SaveStats() {
        foreach (var stat in statCounts) {
            PlayerPrefs.SetInt($"EvolutionStat_{stat.Key}", stat.Value);
        }
        PlayerPrefs.Save();
    }
    
    private void LoadStats() {
        foreach (var key in statCounts.Keys.ToArray()) {
            if (PlayerPrefs.HasKey($"EvolutionStat_{key}")) {
                statCounts[key] = PlayerPrefs.GetInt($"EvolutionStat_{key}");
            }
        }
    }
    
    void OnApplicationPause(bool pauseStatus) {
        if (pauseStatus) {
            // Save when game is paused
            SaveEvolutionState();
            SaveStats();
        }
    }
    
    void OnApplicationQuit() {
        // Save on quit
        SaveEvolutionState();
        SaveStats();
    }
}