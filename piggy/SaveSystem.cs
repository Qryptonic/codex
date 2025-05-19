using UnityEngine;
using System.IO;
using System;
using System.Collections.Generic;

/// <summary>
/// Handles saving and loading game data with JSON serialization
/// </summary>
public class SaveSystem : MonoBehaviour {
    [Header("Save Settings")]
    [SerializeField] private bool autoSave = true;
    [SerializeField] private float autoSaveInterval = 300f; // 5 minutes
    [SerializeField] private string saveFileName = "pet_save.json";
    [SerializeField] private bool usePlayerPrefs = false;
    
    [Header("References")]
    [SerializeField] private VirtualPetUnity pet;
    
    private float lastSaveTime;
    
    [Serializable]
    public class SaveData {
        // Core pet stats
        public float hunger;
        public float thirst;
        public float happiness;
        public float health;
        public float ageDays;
        public string pigTemperament;
        
        // Bond/Quest progress
        public int bondLevel;
        public int bondPoints;
        public int questProgress;
        
        // Customization
        public string petName;
        public List<string> unlockedAccessories = new List<string>();
        public string equippedAccessory;
        
        // Achievement/progression
        public int totalFeedings;
        public int totalPlaytimes;
        public float totalPlaySeconds;
        public DateTime lastPlayTime;
        
        // Game state
        public bool tutorialCompleted;
        public int minigameHighScores;
    }
    
    void Start() {
        // Try to load save on startup
        LoadGame();
        
        lastSaveTime = Time.time;
    }
    
    void Update() {
        // Auto-save periodically if enabled
        if (autoSave && Time.time - lastSaveTime > autoSaveInterval) {
            SaveGame();
            lastSaveTime = Time.time;
        }
    }
    
    /// <summary>
    /// Save game data to file or PlayerPrefs
    /// </summary>
    public void SaveGame() {
        if (pet == null) {
            Debug.LogError("[SaveSystem] Pet reference not set!", this);
            return;
        }
        
        SaveData saveData = new SaveData {
            // Core stats
            hunger = pet.Hunger,
            thirst = pet.Thirst,
            happiness = pet.Happiness,
            health = pet.Health,
            
            // Bond/progress (get these from components)
            bondLevel = GetBondLevel(),
            questProgress = GetQuestProgress(),
            
            // Record play session info
            lastPlayTime = DateTime.Now,
            
            // Add other saved values...
            petName = GetPetName()
        };
        
        // Serialize to JSON
        string jsonData = JsonUtility.ToJson(saveData, true);
        
        if (usePlayerPrefs) {
            // Save to PlayerPrefs (easier but less secure)
            PlayerPrefs.SetString("PiggySaveData", jsonData);
            PlayerPrefs.Save();
            Debug.Log("[SaveSystem] Game saved to PlayerPrefs");
        } else {
            // Save to file (more robust)
            string savePath = Path.Combine(Application.persistentDataPath, saveFileName);
            try {
                File.WriteAllText(savePath, jsonData);
                Debug.Log($"[SaveSystem] Game saved to {savePath}");
            } catch (Exception e) {
                Debug.LogError($"[SaveSystem] Error saving game: {e.Message}");
            }
        }
    }
    
    /// <summary>
    /// Load game data from file or PlayerPrefs
    /// </summary>
    public void LoadGame() {
        string jsonData = "";
        
        if (usePlayerPrefs) {
            // Load from PlayerPrefs
            if (PlayerPrefs.HasKey("PiggySaveData")) {
                jsonData = PlayerPrefs.GetString("PiggySaveData");
            } else {
                Debug.Log("[SaveSystem] No save data found in PlayerPrefs");
                return;
            }
        } else {
            // Load from file
            string savePath = Path.Combine(Application.persistentDataPath, saveFileName);
            if (File.Exists(savePath)) {
                try {
                    jsonData = File.ReadAllText(savePath);
                } catch (Exception e) {
                    Debug.LogError($"[SaveSystem] Error loading save file: {e.Message}");
                    return;
                }
            } else {
                Debug.Log($"[SaveSystem] No save file found at {savePath}");
                return;
            }
        }
        
        // Deserialize from JSON
        try {
            SaveData saveData = JsonUtility.FromJson<SaveData>(jsonData);
            
            // Apply loaded data to pet
            if (pet != null) {
                pet.Hunger = saveData.hunger;
                pet.Thirst = saveData.thirst;
                pet.Happiness = saveData.happiness;
                pet.Health = saveData.health;
                
                // Apply other values...
                SetPetName(saveData.petName);
                SetBondLevel(saveData.bondLevel);
                SetQuestProgress(saveData.questProgress);
            } else {
                Debug.LogError("[SaveSystem] Pet reference not set!", this);
            }
            
            Debug.Log("[SaveSystem] Game loaded successfully");
        } catch (Exception e) {
            Debug.LogError($"[SaveSystem] Error parsing save data: {e.Message}");
        }
    }
    
    /// <summary>
    /// Clear all save data (reset)
    /// </summary>
    public void DeleteSaveData() {
        if (usePlayerPrefs) {
            PlayerPrefs.DeleteKey("PiggySaveData");
            Debug.Log("[SaveSystem] Save data deleted from PlayerPrefs");
        } else {
            string savePath = Path.Combine(Application.persistentDataPath, saveFileName);
            if (File.Exists(savePath)) {
                try {
                    File.Delete(savePath);
                    Debug.Log($"[SaveSystem] Save file deleted at {savePath}");
                } catch (Exception e) {
                    Debug.LogError($"[SaveSystem] Error deleting save file: {e.Message}");
                }
            }
        }
    }
    
    // Helper methods to get/set data from other components
    
    private int GetBondLevel() {
        AffectionMeter affectionMeter = pet.GetComponent<AffectionMeter>();
        return affectionMeter != null ? affectionMeter.GetBondLevel() : 0;
    }
    
    private void SetBondLevel(int level) {
        AffectionMeter affectionMeter = pet.GetComponent<AffectionMeter>();
        if (affectionMeter != null) {
            // Implement a method in AffectionMeter to set the bond level directly
            // affectionMeter.SetBondLevel(level);
        }
    }
    
    private int GetQuestProgress() {
        QuestManager questManager = pet.GetComponent<QuestManager>();
        return questManager != null ? questManager.GetQuestProgress() : 0;
    }
    
    private void SetQuestProgress(int progress) {
        QuestManager questManager = pet.GetComponent<QuestManager>();
        if (questManager != null) {
            // Implement a method in QuestManager to set progress directly
            // questManager.SetQuestProgress(progress);
        }
    }
    
    private string GetPetName() {
        // Get name from a CustomizationManager or directly from pet
        return "Guinea Pig"; // Default name
    }
    
    private void SetPetName(string name) {
        // Set name in a CustomizationManager or directly on pet
    }
    
    void OnApplicationPause(bool pauseStatus) {
        if (pauseStatus) {
            // Save when app is paused/backgrounded
            SaveGame();
        }
    }
    
    void OnApplicationQuit() {
        // Save when app is closed
        SaveGame();
    }
}