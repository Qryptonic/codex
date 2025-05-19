using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using UnityEngine.UI;
using UnityEngine.Events;

/// <summary>
/// Manages simple mini-games for the pet
/// </summary>
public class MinigameManager : MonoBehaviour {
    [System.Serializable]
    public class Minigame {
        public string id;
        public string displayName;
        public Sprite icon;
        public GameObject minigamePrefab;
        [TextArea(2, 4)]
        public string description;
        public int difficultyLevel = 1;
        public bool unlockedByDefault = true;
        public int highScore = 0;
    }
    
    [System.Serializable]
    public class MinigameReward {
        public int scoreThreshold;
        public float happiness = 10f;
        public float hunger = -5f;
        public int bondPoints = 2;
    }
    
    [Header("Minigame Configuration")]
    [SerializeField] private List<Minigame> availableMinigames = new List<Minigame>();
    [SerializeField] private List<MinigameReward> rewards = new List<MinigameReward>();
    
    [Header("UI References")]
    [SerializeField] private GameObject minigameSelectionPanel;
    [SerializeField] private GameObject minigameContainer;
    [SerializeField] private Button exitMinigameButton;
    
    [Header("Pet References")]
    [SerializeField] private VirtualPetUnity pet;
    
    [Header("Events")]
    public UnityEvent OnMinigameStarted;
    public UnityEvent OnMinigameEnded;
    public UnityEvent<int> OnScoreChanged;
    
    private Minigame currentMinigame;
    private GameObject currentMinigameInstance;
    private Dictionary<string, bool> unlockedMinigames = new Dictionary<string, bool>();
    private Dictionary<string, int> minigameHighScores = new Dictionary<string, int>();
    private int currentScore = 0;
    
    void Start() {
        // Initialize unlocked status
        foreach (var game in availableMinigames) {
            unlockedMinigames[game.id] = game.unlockedByDefault;
            minigameHighScores[game.id] = 0;
        }
        
        // Load saved high scores
        LoadHighScores();
        
        // Set up exit button
        if (exitMinigameButton != null) {
            exitMinigameButton.onClick.AddListener(ExitCurrentMinigame);
        }
        
        // Hide minigame container initially
        if (minigameContainer != null) {
            minigameContainer.SetActive(false);
        }
    }
    
    /// <summary>
    /// Open the minigame selection panel
    /// </summary>
    public void OpenMinigameSelection() {
        if (minigameSelectionPanel != null) {
            minigameSelectionPanel.SetActive(true);
            
            // Populate selection UI (implementation depends on your UI setup)
            PopulateMinigameSelection();
        }
    }
    
    /// <summary>
    /// Start a specific minigame by ID
    /// </summary>
    public void StartMinigame(string minigameId) {
        // Check if minigame is unlocked
        if (!IsMinigameUnlocked(minigameId)) {
            Debug.LogWarning($"[MinigameManager] Minigame '{minigameId}' is not unlocked");
            return;
        }
        
        // Find minigame by ID
        Minigame game = availableMinigames.Find(m => m.id == minigameId);
        if (game == null) {
            Debug.LogWarning($"[MinigameManager] Minigame '{minigameId}' not found");
            return;
        }
        
        // Hide selection panel
        if (minigameSelectionPanel != null) {
            minigameSelectionPanel.SetActive(false);
        }
        
        // Show minigame container
        if (minigameContainer != null) {
            minigameContainer.SetActive(true);
        }
        
        // Instantiate minigame prefab
        if (game.minigamePrefab != null) {
            currentMinigameInstance = Instantiate(game.minigamePrefab, minigameContainer.transform);
            currentMinigame = game;
            currentScore = 0;
            
            // Enable exit button
            if (exitMinigameButton != null) {
                exitMinigameButton.gameObject.SetActive(true);
            }
            
            // Initialize IMinigame interface if implemented
            IMinigame minigameComponent = currentMinigameInstance.GetComponent<IMinigame>();
            if (minigameComponent != null) {
                minigameComponent.Initialize(this);
            }
            
            // Fire event
            OnMinigameStarted?.Invoke();
        }
    }
    
    /// <summary>
    /// Exit the current minigame
    /// </summary>
    public void ExitCurrentMinigame() {
        if (currentMinigameInstance != null) {
            Destroy(currentMinigameInstance);
            currentMinigameInstance = null;
            
            // Hide minigame container
            if (minigameContainer != null) {
                minigameContainer.SetActive(false);
            }
            
            // Fire event
            OnMinigameEnded?.Invoke();
            
            // Process final score and rewards
            ProcessMinigameResults();
            
            // Return to selection or main screen
            if (minigameSelectionPanel != null) {
                minigameSelectionPanel.SetActive(true);
            }
        }
    }
    
    /// <summary>
    /// Update the current score during a minigame
    /// </summary>
    public void UpdateScore(int score) {
        currentScore = score;
        OnScoreChanged?.Invoke(currentScore);
    }
    
    /// <summary>
    /// Add points to the current score
    /// </summary>
    public void AddPoints(int points) {
        currentScore += points;
        OnScoreChanged?.Invoke(currentScore);
    }
    
    /// <summary>
    /// Process minigame results and give rewards
    /// </summary>
    private void ProcessMinigameResults() {
        if (currentMinigame == null) return;
        
        // Update high score
        if (currentScore > minigameHighScores[currentMinigame.id]) {
            minigameHighScores[currentMinigame.id] = currentScore;
            SaveHighScores();
        }
        
        // Give rewards based on score
        if (pet != null) {
            foreach (var reward in rewards) {
                if (currentScore >= reward.scoreThreshold) {
                    // Apply rewards to pet
                    pet.Happiness = Mathf.Min(pet.Happiness + reward.happiness, 100f);
                    pet.Hunger = Mathf.Max(pet.Hunger + reward.hunger, 0f);
                    
                    // Apply bond points
                    if (reward.bondPoints > 0) {
                        AffectionMeter affectionMeter = pet.GetComponent<AffectionMeter>();
                        if (affectionMeter != null) {
                            affectionMeter.AddBond(reward.bondPoints);
                        }
                    }
                    
                    // Show reward notification
                    NotificationManager notificationManager = FindObjectOfType<NotificationManager>();
                    if (notificationManager != null) {
                        notificationManager.TriggerAlert($"Minigame Reward: Score {currentScore}!");
                    }
                    
                    break; // Stop at highest achieved reward
                }
            }
        }
    }
    
    /// <summary>
    /// Check if a minigame is unlocked
    /// </summary>
    public bool IsMinigameUnlocked(string minigameId) {
        return unlockedMinigames.ContainsKey(minigameId) && unlockedMinigames[minigameId];
    }
    
    /// <summary>
    /// Unlock a new minigame
    /// </summary>
    public void UnlockMinigame(string minigameId) {
        if (availableMinigames.Exists(m => m.id == minigameId)) {
            unlockedMinigames[minigameId] = true;
            
            // Notify UI about new unlock
            MinigameUnlocked(minigameId);
        }
    }
    
    /// <summary>
    /// Get all available minigames
    /// </summary>
    public List<Minigame> GetAllMinigames() {
        return availableMinigames;
    }
    
    /// <summary>
    /// Get list of unlocked minigames
    /// </summary>
    public List<Minigame> GetUnlockedMinigames() {
        List<Minigame> unlocked = new List<Minigame>();
        foreach (var game in availableMinigames) {
            if (IsMinigameUnlocked(game.id)) {
                unlocked.Add(game);
            }
        }
        return unlocked;
    }
    
    /// <summary>
    /// Get high score for a specific minigame
    /// </summary>
    public int GetHighScore(string minigameId) {
        if (minigameHighScores.ContainsKey(minigameId)) {
            return minigameHighScores[minigameId];
        }
        return 0;
    }
    
    /// <summary>
    /// Save high scores to player prefs
    /// </summary>
    private void SaveHighScores() {
        foreach (var pair in minigameHighScores) {
            PlayerPrefs.SetInt($"MinigameScore_{pair.Key}", pair.Value);
        }
        PlayerPrefs.Save();
    }
    
    /// <summary>
    /// Load high scores from player prefs
    /// </summary>
    private void LoadHighScores() {
        foreach (var game in availableMinigames) {
            string key = $"MinigameScore_{game.id}";
            if (PlayerPrefs.HasKey(key)) {
                minigameHighScores[game.id] = PlayerPrefs.GetInt(key);
            }
        }
    }
    
    /// <summary>
    /// Populate the minigame selection UI
    /// </summary>
    private void PopulateMinigameSelection() {
        // Implementation depends on your UI setup
        // Example: create buttons for each unlocked minigame
        
        // Clear existing buttons
        Transform contentArea = minigameSelectionPanel.transform.Find("Content");
        if (contentArea != null) {
            foreach (Transform child in contentArea) {
                Destroy(child.gameObject);
            }
        }
        
        // Get unlocked minigames
        List<Minigame> unlocked = GetUnlockedMinigames();
        
        /* 
        // Example: Instantiate buttons for each game
        foreach (var game in unlocked) {
            GameObject button = Instantiate(minigameButtonPrefab, contentArea);
            button.GetComponentInChildren<Text>().text = game.displayName;
            button.GetComponent<Button>().onClick.AddListener(() => StartMinigame(game.id));
            
            // Set icon if available
            Image icon = button.transform.Find("Icon").GetComponent<Image>();
            if (icon != null && game.icon != null) {
                icon.sprite = game.icon;
            }
        }
        */
    }
    
    private void MinigameUnlocked(string minigameId) {
        // Example: Show notification
        Minigame game = availableMinigames.Find(m => m.id == minigameId);
        if (game != null) {
            Debug.Log($"[MinigameManager] New minigame unlocked: {game.displayName}");
            
            // Example: Notify UI system
            NotificationManager notificationManager = FindObjectOfType<NotificationManager>();
            if (notificationManager != null) {
                notificationManager.TriggerAlert($"New minigame unlocked: {game.displayName}!");
            }
        }
    }
}

/// <summary>
/// Interface for minigames to communicate with the manager
/// </summary>
public interface IMinigame {
    void Initialize(MinigameManager manager);
    void EndGame();
}