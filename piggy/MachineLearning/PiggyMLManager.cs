using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using System.Threading.Tasks;

/// <summary>
/// Manages machine learning capabilities for the Piggy virtual pet game.
/// This system analyzes player behavior patterns and adapts the pet's behavior accordingly.
/// </summary>
public class PiggyMLManager : MonoBehaviour
{
    [Header("Configuration")]
    [SerializeField] private int maxHistorySize = 1000;
    [SerializeField] private int minSamplesForPrediction = 10;
    [SerializeField] private float predictionThreshold = 0.65f;
    [SerializeField] private float learningRate = 0.1f;
    [SerializeField] private bool enableAdaptiveBehavior = true;
    
    [Header("Debugging")]
    [SerializeField] private bool logPredictions = false;
    [SerializeField] private bool visualizeLearning = false;
    
    // Dependencies
    private IVirtualPet virtualPet;
    private IEmotionEngine emotionEngine;
    private IDataPersistence dataPersistence;
    private IGameConfig gameConfig;
    private ILogger logger;
    
    // ML State
    private List<PlayerAction> playerActionHistory = new List<PlayerAction>();
    private Dictionary<string, Dictionary<string, float>> transitionProbabilities = new Dictionary<string, Dictionary<string, float>>();
    private Dictionary<TimeSpan, List<PlayerAction>> timeBasedActionPatterns = new Dictionary<TimeSpan, List<PlayerAction>>();
    private Dictionary<string, float> personalityTraits = new Dictionary<string, float>();
    private Dictionary<string, float> interactionPreferences = new Dictionary<string, float>();
    private bool modelTrained = false;
    
    [Inject]
    public void Construct(
        IVirtualPet virtualPet,
        IEmotionEngine emotionEngine, 
        IDataPersistence dataPersistence,
        IGameConfig gameConfig,
        ILogger logger)
    {
        this.virtualPet = virtualPet ?? throw new ArgumentNullException(nameof(virtualPet));
        this.emotionEngine = emotionEngine ?? throw new ArgumentNullException(nameof(emotionEngine));
        this.dataPersistence = dataPersistence ?? throw new ArgumentNullException(nameof(dataPersistence));
        this.gameConfig = gameConfig ?? throw new ArgumentNullException(nameof(gameConfig));
        this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }
    
    private void Awake()
    {
        InitializeDefaultPersonalityTraits();
        InitializeDefaultInteractionPreferences();
    }
    
    private async void Start()
    {
        try
        {
            // Load action history from persistent storage
            await LoadActionHistory();
            
            // Train initial model based on history
            TrainModel();
            
            // Subscribe to pet events
            SubscribeToEvents();
            
            logger.LogInfo("PiggyMLManager initialized successfully");
        }
        catch (Exception ex)
        {
            logger.LogError($"Error initializing PiggyMLManager: {ex.Message}");
        }
    }
    
    private void OnDestroy()
    {
        // Unsubscribe from events
        UnsubscribeFromEvents();
    }
    
    #region Public API
    
    /// <summary>
    /// Records a player action with the current context.
    /// </summary>
    /// <param name="actionType">The type of action performed</param>
    /// <param name="context">Additional context for the action</param>
    public void RecordPlayerAction(string actionType, Dictionary<string, object> context = null)
    {
        try
        {
            var action = new PlayerAction
            {
                ActionType = actionType,
                Timestamp = DateTime.UtcNow,
                Context = context ?? new Dictionary<string, object>(),
                PetState = GetCurrentPetState()
            };
            
            // Add to history
            playerActionHistory.Add(action);
            
            // Trim history if needed
            if (playerActionHistory.Count > maxHistorySize)
            {
                playerActionHistory.RemoveAt(0);
            }
            
            // Update model incrementally
            UpdateModel(action);
            
            // Save action to persistent storage (throttled)
            ThrottledSaveActionHistory();
            
            // Log for debugging
            if (logPredictions)
            {
                logger.LogInfo($"Recorded action: {actionType}");
            }
        }
        catch (Exception ex)
        {
            logger.LogError($"Error recording player action: {ex.Message}");
        }
    }
    
    /// <summary>
    /// Predicts the next player action based on historical patterns.
    /// </summary>
    /// <returns>Dictionary of action types and their probability</returns>
    public Dictionary<string, float> PredictNextPlayerAction()
    {
        try
        {
            if (!modelTrained || playerActionHistory.Count < minSamplesForPrediction)
            {
                return new Dictionary<string, float>();
            }
            
            // Get the most recent action
            var lastAction = playerActionHistory.LastOrDefault();
            if (lastAction == null)
            {
                return new Dictionary<string, float>();
            }
            
            // Get time-based predictions
            var timeBasedPredictions = PredictActionsByTime(DateTime.UtcNow);
            
            // Get transition-based predictions
            var transitionPredictions = PredictActionsByTransition(lastAction.ActionType);
            
            // Get state-based predictions
            var stateBasedPredictions = PredictActionsByPetState(GetCurrentPetState());
            
            // Combine predictions with weights
            var combinedPredictions = new Dictionary<string, float>();
            
            // Combine all prediction sources (with different weights)
            foreach (var actionType in GetAllActionTypes())
            {
                float timePrediction = timeBasedPredictions.ContainsKey(actionType) ? timeBasedPredictions[actionType] : 0f;
                float transitionPrediction = transitionPredictions.ContainsKey(actionType) ? transitionPredictions[actionType] : 0f;
                float statePrediction = stateBasedPredictions.ContainsKey(actionType) ? stateBasedPredictions[actionType] : 0f;
                
                // Weighted combination
                float combinedPrediction = (timePrediction * 0.2f) + (transitionPrediction * 0.5f) + (statePrediction * 0.3f);
                
                if (combinedPrediction > 0)
                {
                    combinedPredictions[actionType] = combinedPrediction;
                }
            }
            
            // Normalize the probabilities
            NormalizeProbabilities(combinedPredictions);
            
            // Log predictions for debugging
            if (logPredictions && combinedPredictions.Count > 0)
            {
                string predictions = string.Join(", ", combinedPredictions.Select(p => $"{p.Key}: {p.Value:F2}"));
                logger.LogInfo($"Predicted next actions: {predictions}");
            }
            
            return combinedPredictions;
        }
        catch (Exception ex)
        {
            logger.LogError($"Error predicting next player action: {ex.Message}");
            return new Dictionary<string, float>();
        }
    }
    
    /// <summary>
    /// Gets the pet's personality trait values.
    /// </summary>
    /// <returns>Dictionary of trait names and their values (0-1)</returns>
    public Dictionary<string, float> GetPersonalityTraits()
    {
        return new Dictionary<string, float>(personalityTraits);
    }
    
    /// <summary>
    /// Updates a specific personality trait based on player interaction.
    /// </summary>
    /// <param name="traitName">The name of the trait to update</param>
    /// <param name="influence">The influence value (-1 to 1)</param>
    public void UpdatePersonalityTrait(string traitName, float influence)
    {
        try
        {
            if (!personalityTraits.ContainsKey(traitName))
            {
                personalityTraits[traitName] = 0.5f; // Default middle value
            }
            
            // Apply influence with learning rate
            float currentValue = personalityTraits[traitName];
            float newValue = Mathf.Clamp01(currentValue + (influence * learningRate));
            personalityTraits[traitName] = newValue;
            
            if (logPredictions)
            {
                logger.LogInfo($"Updated personality trait: {traitName} from {currentValue:F2} to {newValue:F2}");
            }
        }
        catch (Exception ex)
        {
            logger.LogError($"Error updating personality trait: {ex.Message}");
        }
    }
    
    /// <summary>
    /// Gets the current recommended action based on pet state and predictions.
    /// </summary>
    /// <returns>The recommended action type or null if no recommendation</returns>
    public string GetRecommendedAction()
    {
        try
        {
            // Get pet state
            var petState = GetCurrentPetState();
            
            // Check critical needs first
            if (petState.Hunger < 25f)
            {
                return "feed";
            }
            
            if (petState.Thirst < 25f)
            {
                return "drink";
            }
            
            if (petState.Happiness < 25f)
            {
                return "play";
            }
            
            // If no critical needs, use predictions
            var predictions = PredictNextPlayerAction();
            
            // Find the highest probability action above threshold
            string bestAction = null;
            float highestProb = 0f;
            
            foreach (var prediction in predictions)
            {
                if (prediction.Value > predictionThreshold && prediction.Value > highestProb)
                {
                    highestProb = prediction.Value;
                    bestAction = prediction.Key;
                }
            }
            
            return bestAction;
        }
        catch (Exception ex)
        {
            logger.LogError($"Error getting recommended action: {ex.Message}");
            return null;
        }
    }
    
    /// <summary>
    /// Forces a save of the current ML state.
    /// </summary>
    public async Task SaveMLState()
    {
        await SaveActionHistory();
        await SavePersonalityTraits();
    }
    
    #endregion
    
    #region Event Handlers
    
    private void SubscribeToEvents()
    {
        if (virtualPet != null)
        {
            virtualPet.OnStatsChanged += HandlePetStatsChanged;
            virtualPet.OnStateChanged += HandlePetStateChanged;
        }
        
        if (emotionEngine != null)
        {
            emotionEngine.OnEmotionChanged += HandleEmotionChanged;
        }
    }
    
    private void UnsubscribeFromEvents()
    {
        if (virtualPet != null)
        {
            virtualPet.OnStatsChanged -= HandlePetStatsChanged;
            virtualPet.OnStateChanged -= HandlePetStateChanged;
        }
        
        if (emotionEngine != null)
        {
            emotionEngine.OnEmotionChanged -= HandleEmotionChanged;
        }
    }
    
    private void HandlePetStatsChanged(string statName, float newValue)
    {
        // Record stat changes to improve state-based predictions
        RecordPlayerAction("stat_changed", new Dictionary<string, object>
        {
            {"stat_name", statName},
            {"new_value", newValue}
        });
    }
    
    private void HandlePetStateChanged(PetState newState)
    {
        // State changes can affect personality development
        switch (newState)
        {
            case PetState.Happy:
                UpdatePersonalityTrait("Playfulness", 0.1f);
                UpdatePersonalityTrait("Sociability", 0.1f);
                break;
                
            case PetState.Hungry:
                UpdatePersonalityTrait("Patience", -0.05f);
                break;
                
            case PetState.Thirsty:
                UpdatePersonalityTrait("Patience", -0.05f);
                break;
                
            case PetState.Sick:
                UpdatePersonalityTrait("Resilience", 0.1f);
                break;
        }
    }
    
    private void HandleEmotionChanged(string emotion, float intensity)
    {
        // Emotions can influence learning and personality development
        if (emotion == "Happy" && intensity > 0.7f)
        {
            UpdatePersonalityTrait("Playfulness", 0.05f);
        }
        else if (emotion == "Sad" && intensity > 0.7f)
        {
            UpdatePersonalityTrait("Sensitivity", 0.05f);
        }
        else if (emotion == "Excited" && intensity > 0.7f)
        {
            UpdatePersonalityTrait("Energy", 0.05f);
        }
    }
    
    #endregion
    
    #region ML Core
    
    private void TrainModel()
    {
        try
        {
            if (playerActionHistory.Count < minSamplesForPrediction)
            {
                logger.LogInfo($"Not enough data to train model: {playerActionHistory.Count}/{minSamplesForPrediction} actions");
                return;
            }
            
            // Clear existing model
            transitionProbabilities.Clear();
            timeBasedActionPatterns.Clear();
            
            // Calculate transition probabilities
            for (int i = 1; i < playerActionHistory.Count; i++)
            {
                var prevAction = playerActionHistory[i - 1];
                var currentAction = playerActionHistory[i];
                
                // Add to transition probabilities
                if (!transitionProbabilities.ContainsKey(prevAction.ActionType))
                {
                    transitionProbabilities[prevAction.ActionType] = new Dictionary<string, float>();
                }
                
                var transitions = transitionProbabilities[prevAction.ActionType];
                if (!transitions.ContainsKey(currentAction.ActionType))
                {
                    transitions[currentAction.ActionType] = 0;
                }
                
                transitions[currentAction.ActionType]++;
            }
            
            // Normalize transition probabilities
            foreach (var actionType in transitionProbabilities.Keys.ToList())
            {
                var transitions = transitionProbabilities[actionType];
                float total = transitions.Values.Sum();
                
                foreach (var nextAction in transitions.Keys.ToList())
                {
                    transitions[nextAction] = transitions[nextAction] / total;
                }
            }
            
            // Build time-based patterns
            foreach (var action in playerActionHistory)
            {
                // Round time to nearest hour
                TimeSpan timeOfDay = new TimeSpan(action.Timestamp.Hour, 0, 0);
                
                if (!timeBasedActionPatterns.ContainsKey(timeOfDay))
                {
                    timeBasedActionPatterns[timeOfDay] = new List<PlayerAction>();
                }
                
                timeBasedActionPatterns[timeOfDay].Add(action);
            }
            
            // Update personality based on history
            DerivePersonalityFromHistory();
            
            modelTrained = true;
            logger.LogInfo("ML model trained successfully");
            
            // Visualize if enabled
            if (visualizeLearning)
            {
                VisualizeModel();
            }
        }
        catch (Exception ex)
        {
            logger.LogError($"Error training ML model: {ex.Message}");
        }
    }
    
    private void UpdateModel(PlayerAction newAction)
    {
        try
        {
            if (playerActionHistory.Count < 2)
            {
                return; // Need at least 2 actions to update
            }
            
            // Get previous action
            var prevAction = playerActionHistory[playerActionHistory.Count - 2];
            
            // Update transition probabilities
            if (!transitionProbabilities.ContainsKey(prevAction.ActionType))
            {
                transitionProbabilities[prevAction.ActionType] = new Dictionary<string, float>();
            }
            
            var transitions = transitionProbabilities[prevAction.ActionType];
            if (!transitions.ContainsKey(newAction.ActionType))
            {
                transitions[newAction.ActionType] = 0;
            }
            
            // Update with learning rate
            float currentProb = transitions[newAction.ActionType];
            transitions[newAction.ActionType] = (currentProb * (1 - learningRate)) + learningRate;
            
            // Re-normalize transitions
            float total = transitions.Values.Sum();
            foreach (var action in transitions.Keys.ToList())
            {
                transitions[action] = transitions[action] / total;
            }
            
            // Update time-based patterns
            TimeSpan timeOfDay = new TimeSpan(newAction.Timestamp.Hour, 0, 0);
            if (!timeBasedActionPatterns.ContainsKey(timeOfDay))
            {
                timeBasedActionPatterns[timeOfDay] = new List<PlayerAction>();
            }
            
            timeBasedActionPatterns[timeOfDay].Add(newAction);
            
            // Update interaction preferences
            if (!interactionPreferences.ContainsKey(newAction.ActionType))
            {
                interactionPreferences[newAction.ActionType] = 0;
            }
            
            interactionPreferences[newAction.ActionType] += learningRate;
            
            // Re-normalize interaction preferences
            float prefTotal = interactionPreferences.Values.Sum();
            foreach (var action in interactionPreferences.Keys.ToList())
            {
                interactionPreferences[action] = interactionPreferences[action] / prefTotal;
            }
        }
        catch (Exception ex)
        {
            logger.LogError($"Error updating ML model: {ex.Message}");
        }
    }
    
    private Dictionary<string, float> PredictActionsByTransition(string lastActionType)
    {
        var result = new Dictionary<string, float>();
        
        if (transitionProbabilities.ContainsKey(lastActionType))
        {
            result = new Dictionary<string, float>(transitionProbabilities[lastActionType]);
        }
        
        return result;
    }
    
    private Dictionary<string, float> PredictActionsByTime(DateTime currentTime)
    {
        var result = new Dictionary<string, float>();
        TimeSpan currentTimeOfDay = new TimeSpan(currentTime.Hour, 0, 0);
        
        // Find the closest time slot
        var closestSlot = timeBasedActionPatterns.Keys
            .OrderBy(t => Math.Abs((t - currentTimeOfDay).TotalHours))
            .FirstOrDefault();
        
        if (timeBasedActionPatterns.ContainsKey(closestSlot))
        {
            // Count actions by type for this time
            var actionCounts = new Dictionary<string, int>();
            foreach (var action in timeBasedActionPatterns[closestSlot])
            {
                if (!actionCounts.ContainsKey(action.ActionType))
                {
                    actionCounts[action.ActionType] = 0;
                }
                
                actionCounts[action.ActionType]++;
            }
            
            // Convert to probabilities
            float total = actionCounts.Values.Sum();
            if (total > 0)
            {
                foreach (var pair in actionCounts)
                {
                    result[pair.Key] = pair.Value / total;
                }
            }
        }
        
        return result;
    }
    
    private Dictionary<string, float> PredictActionsByPetState(PetStateContext currentState)
    {
        var result = new Dictionary<string, float>();
        
        // Group actions by pet state similarity
        var stateActions = new Dictionary<string, List<PlayerAction>>();
        
        foreach (var action in playerActionHistory)
        {
            // Calculate state similarity (simple version)
            float similarity = CalculateStateSimilarity(action.PetState, currentState);
            
            // Only consider similar states (above 0.7 similarity)
            if (similarity > 0.7f)
            {
                if (!stateActions.ContainsKey(action.ActionType))
                {
                    stateActions[action.ActionType] = new List<PlayerAction>();
                }
                
                stateActions[action.ActionType].Add(action);
            }
        }
        
        // Calculate probabilities based on frequency in similar states
        float total = stateActions.Values.Sum(list => list.Count);
        
        if (total > 0)
        {
            foreach (var pair in stateActions)
            {
                result[pair.Key] = pair.Value.Count / total;
            }
        }
        
        return result;
    }
    
    private float CalculateStateSimilarity(PetStateContext state1, PetStateContext state2)
    {
        // Calculate Euclidean distance between states based on stats
        float hungerDiff = Mathf.Abs(state1.Hunger - state2.Hunger) / 100f;
        float thirstDiff = Mathf.Abs(state1.Thirst - state2.Thirst) / 100f;
        float happinessDiff = Mathf.Abs(state1.Happiness - state2.Happiness) / 100f;
        float healthDiff = Mathf.Abs(state1.Health - state2.Health) / 100f;
        
        // Calculate similarity (1 - normalized distance)
        float distance = Mathf.Sqrt(
            (hungerDiff * hungerDiff) +
            (thirstDiff * thirstDiff) +
            (happinessDiff * happinessDiff) +
            (healthDiff * healthDiff)
        ) / 2f; // Normalize by max possible distance
        
        return 1f - Mathf.Clamp01(distance);
    }
    
    private void DerivePersonalityFromHistory()
    {
        try
        {
            if (playerActionHistory.Count < minSamplesForPrediction)
            {
                return;
            }
            
            // Calculate action frequencies
            var actionCounts = new Dictionary<string, int>();
            foreach (var action in playerActionHistory)
            {
                if (!actionCounts.ContainsKey(action.ActionType))
                {
                    actionCounts[action.ActionType] = 0;
                }
                
                actionCounts[action.ActionType]++;
            }
            
            float total = actionCounts.Values.Sum();
            
            // Derive traits from action frequencies
            if (actionCounts.ContainsKey("feed"))
            {
                float feedRatio = actionCounts["feed"] / total;
                UpdatePersonalityTrait("Appetite", Mathf.Lerp(0.3f, 0.9f, feedRatio));
            }
            
            if (actionCounts.ContainsKey("play"))
            {
                float playRatio = actionCounts["play"] / total;
                UpdatePersonalityTrait("Playfulness", Mathf.Lerp(0.3f, 0.9f, playRatio));
                UpdatePersonalityTrait("Energy", Mathf.Lerp(0.4f, 0.8f, playRatio));
            }
            
            if (actionCounts.ContainsKey("pet"))
            {
                float petRatio = actionCounts["pet"] / total;
                UpdatePersonalityTrait("Affection", Mathf.Lerp(0.4f, 0.9f, petRatio));
                UpdatePersonalityTrait("Sociability", Mathf.Lerp(0.3f, 0.8f, petRatio));
            }
            
            // Check frequency of interaction
            var dayGroups = playerActionHistory
                .GroupBy(a => a.Timestamp.Date)
                .Select(g => g.Count())
                .ToList();
            
            if (dayGroups.Count > 0)
            {
                float avgInteractionsPerDay = dayGroups.Average();
                UpdatePersonalityTrait("Neediness", Mathf.Lerp(0.2f, 0.9f, Mathf.Clamp01(avgInteractionsPerDay / 10f)));
            }
        }
        catch (Exception ex)
        {
            logger.LogError($"Error deriving personality from history: {ex.Message}");
        }
    }
    
    #endregion
    
    #region Helpers
    
    private PetStateContext GetCurrentPetState()
    {
        return new PetStateContext
        {
            Hunger = virtualPet?.Hunger ?? 50f,
            Thirst = virtualPet?.Thirst ?? 50f,
            Happiness = virtualPet?.Happiness ?? 50f,
            Health = virtualPet?.Health ?? 100f,
            EmotionName = emotionEngine?.GetCurrentEmotion() ?? "Neutral",
            EmotionIntensity = emotionEngine?.GetCurrentIntensity() ?? 0.5f,
            TimeOfDay = DateTime.UtcNow.TimeOfDay
        };
    }
    
    private void NormalizeProbabilities(Dictionary<string, float> probabilities)
    {
        float total = probabilities.Values.Sum();
        
        if (total > 0)
        {
            foreach (var key in probabilities.Keys.ToList())
            {
                probabilities[key] = probabilities[key] / total;
            }
        }
    }
    
    private HashSet<string> GetAllActionTypes()
    {
        var actionTypes = new HashSet<string>();
        
        // Add from transition probabilities
        foreach (var sourcePair in transitionProbabilities)
        {
            actionTypes.Add(sourcePair.Key);
            
            foreach (var targetPair in sourcePair.Value)
            {
                actionTypes.Add(targetPair.Key);
            }
        }
        
        // Add common actions if empty
        if (actionTypes.Count == 0)
        {
            actionTypes.Add("feed");
            actionTypes.Add("drink");
            actionTypes.Add("play");
            actionTypes.Add("pet");
        }
        
        return actionTypes;
    }
    
    private void InitializeDefaultPersonalityTraits()
    {
        personalityTraits["Playfulness"] = 0.5f;
        personalityTraits["Appetite"] = 0.5f;
        personalityTraits["Energy"] = 0.5f;
        personalityTraits["Sociability"] = 0.5f;
        personalityTraits["Curiosity"] = 0.5f;
        personalityTraits["Patience"] = 0.5f;
        personalityTraits["Affection"] = 0.5f;
        personalityTraits["Neediness"] = 0.5f;
        personalityTraits["Resilience"] = 0.5f;
        personalityTraits["Sensitivity"] = 0.5f;
    }
    
    private void InitializeDefaultInteractionPreferences()
    {
        interactionPreferences["feed"] = 0.25f;
        interactionPreferences["drink"] = 0.25f;
        interactionPreferences["play"] = 0.25f;
        interactionPreferences["pet"] = 0.25f;
    }
    
    #endregion
    
    #region Persistence
    
    private async Task LoadActionHistory()
    {
        try
        {
            var gameData = await dataPersistence.LoadGameAsync();
            if (gameData == null)
            {
                return;
            }
            
            // Load ML data from game data
            var mlData = gameData.mlData;
            if (mlData == null)
            {
                return;
            }
            
            // Deserialize action history
            if (mlData.ContainsKey("action_history") && mlData["action_history"] is string actionHistoryJson)
            {
                playerActionHistory = JsonUtility.FromJson<List<PlayerAction>>(actionHistoryJson) ?? new List<PlayerAction>();
            }
            
            // Deserialize personality traits
            if (mlData.ContainsKey("personality_traits") && mlData["personality_traits"] is string traitsJson)
            {
                personalityTraits = JsonUtility.FromJson<Dictionary<string, float>>(traitsJson) ?? 
                    new Dictionary<string, float>();
                
                // Ensure we have all default traits
                InitializeDefaultPersonalityTraits();
            }
            
            logger.LogInfo($"Loaded ML data: {playerActionHistory.Count} actions, {personalityTraits.Count} traits");
        }
        catch (Exception ex)
        {
            logger.LogError($"Error loading action history: {ex.Message}");
            playerActionHistory.Clear();
            InitializeDefaultPersonalityTraits();
        }
    }
    
    // Throttled save to avoid writing too often
    private float lastSaveTime = 0f;
    private bool savePending = false;
    
    private void ThrottledSaveActionHistory()
    {
        savePending = true;
        
        if (Time.realtimeSinceStartup - lastSaveTime > 60f) // Save at most once per minute
        {
            _ = SaveActionHistory();
            lastSaveTime = Time.realtimeSinceStartup;
            savePending = false;
        }
    }
    
    private async Task SaveActionHistory()
    {
        try
        {
            var gameData = await dataPersistence.LoadGameAsync();
            if (gameData == null)
            {
                gameData = new GameData();
            }
            
            // Initialize ML data if needed
            if (gameData.mlData == null)
            {
                gameData.mlData = new Dictionary<string, object>();
            }
            
            // Save action history (limit to last 100 actions to save space)
            var recentHistory = playerActionHistory
                .Skip(Math.Max(0, playerActionHistory.Count - 100))
                .ToList();
                
            gameData.mlData["action_history"] = JsonUtility.ToJson(recentHistory);
            
            // Save model state
            await SavePersonalityTraits();
            
            // Save to persistent storage
            await dataPersistence.SaveGameAsync(gameData);
            
            logger.LogInfo($"Saved ML data: {recentHistory.Count} actions");
        }
        catch (Exception ex)
        {
            logger.LogError($"Error saving action history: {ex.Message}");
        }
    }
    
    private async Task SavePersonalityTraits()
    {
        try
        {
            var gameData = await dataPersistence.LoadGameAsync();
            if (gameData == null)
            {
                gameData = new GameData();
            }
            
            // Initialize ML data if needed
            if (gameData.mlData == null)
            {
                gameData.mlData = new Dictionary<string, object>();
            }
            
            // Save personality traits
            gameData.mlData["personality_traits"] = JsonUtility.ToJson(personalityTraits);
            
            // Save to persistent storage
            await dataPersistence.SaveGameAsync(gameData);
            
            logger.LogInfo($"Saved personality traits: {personalityTraits.Count} traits");
        }
        catch (Exception ex)
        {
            logger.LogError($"Error saving personality traits: {ex.Message}");
        }
    }
    
    #endregion
    
    #region Visualization
    
    private void VisualizeModel()
    {
        if (!visualizeLearning)
        {
            return;
        }
        
        // Log model visualization
        logger.LogInfo("ML Model Visualization:");
        
        // Visualize transition probabilities
        logger.LogInfo("Transition Probabilities:");
        foreach (var sourcePair in transitionProbabilities)
        {
            string transitions = string.Join(", ", sourcePair.Value.Select(p => $"{p.Key}: {p.Value:F2}"));
            logger.LogInfo($"  {sourcePair.Key} -> {transitions}");
        }
        
        // Visualize time patterns
        logger.LogInfo("Time-based Patterns:");
        foreach (var timePair in timeBasedActionPatterns.OrderBy(p => p.Key))
        {
            var counts = new Dictionary<string, int>();
            foreach (var action in timePair.Value)
            {
                if (!counts.ContainsKey(action.ActionType))
                {
                    counts[action.ActionType] = 0;
                }
                counts[action.ActionType]++;
            }
            
            string actionCounts = string.Join(", ", counts.Select(p => $"{p.Key}: {p.Value}"));
            logger.LogInfo($"  {timePair.Key.Hours}:00 -> {actionCounts}");
        }
        
        // Visualize personality traits
        logger.LogInfo("Personality Traits:");
        foreach (var trait in personalityTraits.OrderBy(p => p.Key))
        {
            logger.LogInfo($"  {trait.Key}: {trait.Value:F2}");
        }
    }
    
    #endregion
    
    #region Types
    
    [Serializable]
    public class PlayerAction
    {
        public string ActionType;
        public DateTime Timestamp;
        public Dictionary<string, object> Context;
        public PetStateContext PetState;
    }
    
    [Serializable]
    public class PetStateContext
    {
        public float Hunger;
        public float Thirst;
        public float Happiness;
        public float Health;
        public string EmotionName;
        public float EmotionIntensity;
        public TimeSpan TimeOfDay;
    }
    
    #endregion
}