using UnityEngine;
using System.Collections.Generic;
using System.Linq;
using System;

/// <summary>
/// Manages dynamic personality traits that affect pet behavior and responses
/// </summary>
public class PersonalitySystem : MonoBehaviour {
    [System.Serializable]
    public class PersonalityTrait {
        public string traitId;
        public string displayName;
        [TextArea(2, 4)]
        public string description;
        [Range(-100f, 100f)]
        public float value = 0f; // -100 to 100 scale
        public TraitCategory category;
        public string oppositeTraitId;
        public Sprite icon;
        
        public enum TraitCategory {
            Social,      // Shy vs Outgoing
            Energy,      // Calm vs Energetic 
            Curiosity,   // Cautious vs Curious
            Affection,   // Independent vs Clingy
            Playfulness, // Serious vs Playful
            Mood,        // Grumpy vs Cheerful
            Appetite     // Picky vs Voracious
        }
    }
    
    [System.Serializable]
    public class TraitTrigger {
        public string triggerId;
        public PersonalityTrait.TraitCategory category;
        public float threshold;
        public float changeAmount;
        public bool isPositiveChange;
        public string description;
    }
    
    [System.Serializable]
    public class BehaviorResponse {
        public string responseId;
        public PersonalityTrait.TraitCategory category;
        public float minThreshold;
        public float maxThreshold;
        public string animationTrigger;
        public string soundEffect;
        public string[] dialogueOptions;
        [Range(0f, 1f)]
        public float responseChance = 1.0f;
    }
    
    [Header("Personality Configuration")]
    [SerializeField] private List<PersonalityTrait> availableTraits = new List<PersonalityTrait>();
    [SerializeField] private List<TraitTrigger> traitTriggers = new List<TraitTrigger>();
    [SerializeField] private List<BehaviorResponse> behaviorResponses = new List<BehaviorResponse>();
    
    [Header("Personality Generation")]
    [SerializeField] private bool generateRandomPersonality = true;
    [SerializeField] private int traitsPerCategory = 1;
    [SerializeField] private float randomVariation = 40f;
    [SerializeField] private float traitEvolutionSpeed = 0.2f;
    
    [Header("References")]
    [SerializeField] private VirtualPetUnity pet;
    [SerializeField] private MicroAnimationController animationController;
    [SerializeField] private AudioManager audioManager;
    [SerializeField] private NotificationManager notificationManager;
    
    [Header("Debug")]
    [SerializeField] private bool showPersonalityDebug = false;
    
    private List<PersonalityTrait> activeTraits = new List<PersonalityTrait>();
    private Dictionary<string, DateTime> lastResponseTimes = new Dictionary<string, DateTime>();
    private float lastInteractionTime;
    
    void Start() {
        // Load personality if saved, otherwise generate one
        if (!LoadPersonality() && generateRandomPersonality) {
            GenerateRandomPersonality();
        }
        
        // Subscribe to events
        SubscribeToEvents();
        
        // Initial update
        UpdateTraits();
    }
    
    /// <summary>
    /// Gets all active personality traits
    /// </summary>
    public List<PersonalityTrait> GetActiveTraits() {
        return activeTraits;
    }
    
    /// <summary>
    /// Gets trait value for a specific category
    /// </summary>
    public float GetTraitValue(PersonalityTrait.TraitCategory category) {
        var trait = activeTraits.FirstOrDefault(t => t.category == category);
        return trait != null ? trait.value : 0f;
    }
    
    /// <summary>
    /// Gets the dominant trait in a category
    /// </summary>
    public PersonalityTrait GetDominantTrait(PersonalityTrait.TraitCategory category) {
        return activeTraits.FirstOrDefault(t => t.category == category);
    }
    
    /// <summary>
    /// Records an interaction that may affect personality
    /// </summary>
    public void RecordInteraction(string triggerId) {
        TraitTrigger trigger = traitTriggers.FirstOrDefault(t => t.triggerId == triggerId);
        if (trigger == null) return;
        
        // Find affected trait
        PersonalityTrait trait = activeTraits.FirstOrDefault(t => t.category == trigger.category);
        if (trait == null) return;
        
        // Check threshold (only apply if meets direction check)
        if ((trigger.isPositiveChange && trait.value < trigger.threshold) ||
            (!trigger.isPositiveChange && trait.value > trigger.threshold)) {
            
            // Apply trait change
            trait.value += trigger.changeAmount;
            trait.value = Mathf.Clamp(trait.value, -100f, 100f);
            
            // Log significant changes
            if (Mathf.Abs(trigger.changeAmount) > 5f) {
                Debug.Log($"[PersonalitySystem] {trait.displayName} changed by {trigger.changeAmount} to {trait.value}");
                
                // Notify significant changes
                if (Mathf.Abs(trigger.changeAmount) > 10f && notificationManager != null) {
                    string direction = trigger.changeAmount > 0 ? "more" : "less";
                    notificationManager.TriggerAlert($"Your pet is becoming {direction} {trait.displayName}!");
                }
            }
            
            // Save changes
            SavePersonality();
        }
        
        // Record interaction time
        lastInteractionTime = Time.time;
        
        // Check for responses
        TriggerBehaviorResponse(trait.category);
    }
    
    /// <summary>
    /// Generates a completely new personality for the pet
    /// </summary>
    public void GenerateRandomPersonality() {
        activeTraits.Clear();
        
        // Group traits by category
        var traitsByCategory = availableTraits.GroupBy(t => t.category)
                                             .ToDictionary(g => g.Key, g => g.ToList());
        
        // Select traits for each category
        foreach (var category in Enum.GetValues(typeof(PersonalityTrait.TraitCategory))) {
            PersonalityTrait.TraitCategory cat = (PersonalityTrait.TraitCategory)category;
            
            if (traitsByCategory.ContainsKey(cat) && traitsByCategory[cat].Count > 0) {
                // For each category, select one trait
                var traits = traitsByCategory[cat];
                var newTrait = new PersonalityTrait {
                    traitId = traits[0].traitId,
                    displayName = traits[0].displayName,
                    description = traits[0].description,
                    category = traits[0].category,
                    oppositeTraitId = traits[0].oppositeTraitId,
                    icon = traits[0].icon
                };
                
                // Randomize its value
                newTrait.value = UnityEngine.Random.Range(-randomVariation, randomVariation);
                
                // Add to active traits
                activeTraits.Add(newTrait);
            }
        }
        
        // Log generated personality
        LogPersonality();
        
        // Save the new personality
        SavePersonality();
    }
    
    /// <summary>
    /// Adjust trait values based on ongoing interactions
    /// </summary>
    public void UpdateTraits() {
        // Evolve traits based on pet stats
        if (pet != null) {
            // Examples of stat influences:
            
            // Happiness affects Mood trait
            float happinessInfluence = (pet.Happiness - 50f) * 0.02f * traitEvolutionSpeed;
            AdjustTraitValue(PersonalityTrait.TraitCategory.Mood, happinessInfluence);
            
            // Hunger affects Appetite trait
            float hungerInfluence = (pet.Hunger - 50f) * 0.01f * traitEvolutionSpeed;
            AdjustTraitValue(PersonalityTrait.TraitCategory.Appetite, hungerInfluence);
            
            // Regular play affects Energy and Playfulness
            if (Time.time - lastInteractionTime < 300f) { // 5 minutes
                AdjustTraitValue(PersonalityTrait.TraitCategory.Energy, 0.1f * traitEvolutionSpeed);
                AdjustTraitValue(PersonalityTrait.TraitCategory.Playfulness, 0.1f * traitEvolutionSpeed);
            }
        }
    }
    
    /// <summary>
    /// Get a random dialogue line appropriate for current personality
    /// </summary>
    public string GetPersonalizedDialogue(string context) {
        // Sample contexts: "Greeting", "Hungry", "Happy", "Sad", "Sleepy"
        
        // Find most dominant trait
        PersonalityTrait dominantTrait = activeTraits.OrderByDescending(t => Mathf.Abs(t.value)).FirstOrDefault();
        
        if (dominantTrait == null) return "";
        
        // Find appropriate responses
        List<string> possibleResponses = new List<string>();
        
        foreach (var response in behaviorResponses) {
            if (response.category == dominantTrait.category &&
                dominantTrait.value >= response.minThreshold &&
                dominantTrait.value <= response.maxThreshold &&
                response.dialogueOptions != null &&
                response.dialogueOptions.Length > 0) {
                
                // Add all dialogue options from this response
                possibleResponses.AddRange(response.dialogueOptions);
            }
        }
        
        // If no specific response, use generic ones
        if (possibleResponses.Count == 0) {
            switch (context) {
                case "Greeting":
                    possibleResponses.Add("Hi there!");
                    possibleResponses.Add("Hello!");
                    break;
                case "Hungry":
                    possibleResponses.Add("I'm hungry!");
                    possibleResponses.Add("Feed me please!");
                    break;
                case "Happy":
                    possibleResponses.Add("I'm so happy!");
                    possibleResponses.Add("Yay!");
                    break;
                case "Sad":
                    possibleResponses.Add("I'm sad...");
                    possibleResponses.Add("*sigh*");
                    break;
                case "Sleepy":
                    possibleResponses.Add("*yawn*");
                    possibleResponses.Add("I'm sleepy...");
                    break;
                default:
                    possibleResponses.Add("...");
                    break;
            }
        }
        
        // Return random response
        if (possibleResponses.Count > 0) {
            int index = UnityEngine.Random.Range(0, possibleResponses.Count);
            return possibleResponses[index];
        }
        
        return "";
    }
    
    // Private helper methods
    
    private void AdjustTraitValue(PersonalityTrait.TraitCategory category, float amount) {
        PersonalityTrait trait = activeTraits.FirstOrDefault(t => t.category == category);
        if (trait != null) {
            trait.value += amount;
            trait.value = Mathf.Clamp(trait.value, -100f, 100f);
        }
    }
    
    private void TriggerBehaviorResponse(PersonalityTrait.TraitCategory category) {
        PersonalityTrait trait = activeTraits.FirstOrDefault(t => t.category == category);
        if (trait == null) return;
        
        // Find applicable responses
        var applicableResponses = behaviorResponses.Where(r => 
            r.category == category && 
            trait.value >= r.minThreshold && 
            trait.value <= r.maxThreshold).ToList();
        
        if (applicableResponses.Count == 0) return;
        
        // Choose random response
        BehaviorResponse response = applicableResponses[UnityEngine.Random.Range(0, applicableResponses.Count)];
        
        // Check chance and cooldown
        if (UnityEngine.Random.value > response.responseChance) return;
        
        // Check cooldown
        if (lastResponseTimes.ContainsKey(response.responseId)) {
            TimeSpan timeSince = DateTime.Now - lastResponseTimes[response.responseId];
            if (timeSince.TotalSeconds < 60) return; // 1 minute cooldown
        }
        
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
            string dialogue = response.dialogueOptions[UnityEngine.Random.Range(0, response.dialogueOptions.Length)];
            notificationManager.TriggerAlert(dialogue);
        }
        
        // Record response time
        lastResponseTimes[response.responseId] = DateTime.Now;
    }
    
    private void SubscribeToEvents() {
        if (pet != null) {
            // Example: Subscribe to feed event
            var originalFeed = pet.Feed;
            pet.Feed = () => {
                originalFeed();
                RecordInteraction("Feed");
            };
            
            // Similar for other methods
            var originalPlay = pet.Play;
            pet.Play = () => {
                originalPlay();
                RecordInteraction("Play");
            };
            
            var originalDrink = pet.Drink;
            pet.Drink = () => {
                originalDrink();
                RecordInteraction("Drink");
            };
        }
    }
    
    private void LogPersonality() {
        string log = "[PersonalitySystem] Generated personality:\n";
        foreach (var trait in activeTraits) {
            log += $"- {trait.category}: {trait.displayName} ({trait.value})\n";
        }
        Debug.Log(log);
    }
    
    private void SavePersonality() {
        // Serialize active traits
        try {
            for (int i = 0; i < activeTraits.Count; i++) {
                var trait = activeTraits[i];
                PlayerPrefs.SetString($"Personality_Trait_{i}_Id", trait.traitId);
                PlayerPrefs.SetString($"Personality_Trait_{i}_Category", trait.category.ToString());
                PlayerPrefs.SetFloat($"Personality_Trait_{i}_Value", trait.value);
            }
            
            PlayerPrefs.SetInt("Personality_TraitCount", activeTraits.Count);
            PlayerPrefs.Save();
        } catch (Exception e) {
            Debug.LogError($"[PersonalitySystem] Error saving personality: {e.Message}");
        }
    }
    
    private bool LoadPersonality() {
        try {
            if (!PlayerPrefs.HasKey("Personality_TraitCount")) {
                return false;
            }
            
            int traitCount = PlayerPrefs.GetInt("Personality_TraitCount");
            activeTraits.Clear();
            
            for (int i = 0; i < traitCount; i++) {
                string traitId = PlayerPrefs.GetString($"Personality_Trait_{i}_Id");
                string categoryStr = PlayerPrefs.GetString($"Personality_Trait_{i}_Category");
                float value = PlayerPrefs.GetFloat($"Personality_Trait_{i}_Value");
                
                // Find trait definition
                var traitDef = availableTraits.FirstOrDefault(t => t.traitId == traitId);
                if (traitDef != null) {
                    var trait = new PersonalityTrait {
                        traitId = traitDef.traitId,
                        displayName = traitDef.displayName,
                        description = traitDef.description,
                        category = traitDef.category,
                        oppositeTraitId = traitDef.oppositeTraitId,
                        icon = traitDef.icon,
                        value = value
                    };
                    
                    activeTraits.Add(trait);
                }
            }
            
            return activeTraits.Count > 0;
        } catch (Exception e) {
            Debug.LogError($"[PersonalitySystem] Error loading personality: {e.Message}");
            return false;
        }
    }
    
    void Update() {
        // Periodically update traits (slow evolution)
        if (Time.frameCount % 300 == 0) { // Every 300 frames
            UpdateTraits();
            SavePersonality();
        }
    }
    
    void OnGUI() {
        if (showPersonalityDebug && Application.isEditor) {
            GUILayout.BeginArea(new Rect(10, 10, 300, 300));
            GUILayout.Label("Pet Personality:");
            
            foreach (var trait in activeTraits) {
                GUILayout.Label($"{trait.category}: {trait.displayName} ({trait.value:F1})");
            }
            
            if (GUILayout.Button("Generate New Personality")) {
                GenerateRandomPersonality();
            }
            
            GUILayout.EndArea();
        }
    }
}