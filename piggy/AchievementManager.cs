using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System;

/// <summary>
/// Manages achievements, badges, and milestone rewards
/// </summary>
public class AchievementManager : MonoBehaviour {
    [System.Serializable]
    public class Achievement {
        public string id;
        public string displayName;
        [TextArea(2, 4)]
        public string description;
        public Sprite icon;
        public AchievementType type;
        public float targetValue;
        public string targetId; // For specific achievements
        public bool isSecret;
        public bool isUnlocked;
        public float progress;
        public Reward reward;
        
        public enum AchievementType {
            PlayTime,
            BondLevel,
            Feed,
            Play,
            Drink,
            Happiness,
            Health,
            Age,
            CompleteQuests,
            CapturePhotos,
            CollectItems,
            SpecificAction,
            DailyStreak
        }
    }
    
    [System.Serializable]
    public class Reward {
        public RewardType type;
        public float value;
        public string stringValue; // For item IDs, etc.
        
        public enum RewardType {
            AccessoryUnlock,
            MinigameUnlock,
            HappinessBoost,
            HealthBoost,
            BondPoints,
            ThemeUnlock,
            CurrencyBoost
        }
    }
    
    [System.Serializable]
    public class DailyStreak {
        public int currentStreak;
        public DateTime lastLoginDate;
        public List<int> milestones = new List<int>() { 3, 7, 14, 30, 60, 90, 180, 365 };
        public List<int> completedMilestones = new List<int>();
    }
    
    [Header("Achievement Settings")]
    [SerializeField] private List<Achievement> achievements = new List<Achievement>();
    [SerializeField] private float checkInterval = 60f; // Check every minute
    
    [Header("Daily Streak Settings")]
    [SerializeField] private bool trackDailyStreak = true;
    [SerializeField] private DailyStreak streak = new DailyStreak();
    
    [Header("UI References")]
    [SerializeField] private GameObject achievementPopup;
    [SerializeField] private TMPro.TextMeshProUGUI achievementText;
    [SerializeField] private UnityEngine.UI.Image achievementIcon;
    
    [Header("Pet References")]
    [SerializeField] private VirtualPetUnity pet;
    [SerializeField] private AudioManager audioManager;
    [SerializeField] private NotificationManager notificationManager;
    
    private float lastCheckTime;
    private Dictionary<string, object> progressTrackers = new Dictionary<string, object>();
    
    void Start() {
        // Initialize achievements
        LoadAchievements();
        
        // Check daily streak
        if (trackDailyStreak) {
            CheckDailyStreak();
        }
        
        // Start achievement check routine
        StartCoroutine(AchievementCheckRoutine());
        
        // Subscribe to events
        SubscribeToEvents();
    }
    
    /// <summary>
    /// Gets a list of all achievements
    /// </summary>
    public List<Achievement> GetAllAchievements() {
        return achievements;
    }
    
    /// <summary>
    /// Gets a list of unlocked achievements
    /// </summary>
    public List<Achievement> GetUnlockedAchievements() {
        return achievements.FindAll(a => a.isUnlocked);
    }
    
    /// <summary>
    /// Gets the current progress for an achievement
    /// </summary>
    public float GetAchievementProgress(string achievementId) {
        Achievement achievement = achievements.Find(a => a.id == achievementId);
        return achievement != null ? achievement.progress : 0f;
    }
    
    /// <summary>
    /// Gets the current daily streak
    /// </summary>
    public int GetCurrentStreak() {
        return streak.currentStreak;
    }
    
    /// <summary>
    /// Records progress for a specific achievement type
    /// </summary>
    public void RecordProgress(Achievement.AchievementType type, float value, string targetId = "") {
        foreach (var achievement in achievements) {
            if (achievement.isUnlocked) continue;
            
            if (achievement.type == type) {
                // For targeted achievements, check ID
                if (type == Achievement.AchievementType.SpecificAction && 
                    !string.IsNullOrEmpty(achievement.targetId) && 
                    achievement.targetId != targetId) {
                    continue;
                }
                
                // Record progress
                if (type == Achievement.AchievementType.CollectItems || 
                    type == Achievement.AchievementType.CompleteQuests || 
                    type == Achievement.AchievementType.Feed || 
                    type == Achievement.AchievementType.Play || 
                    type == Achievement.AchievementType.Drink || 
                    type == Achievement.AchievementType.CapturePhotos) {
                    // Incremental progress (counts)
                    achievement.progress += value;
                } else {
                    // Absolute value (max value)
                    achievement.progress = Mathf.Max(achievement.progress, value);
                }
                
                // Check if achievement is unlocked
                if (achievement.progress >= achievement.targetValue) {
                    UnlockAchievement(achievement);
                }
            }
        }
        
        // Save achievements
        SaveAchievements();
    }
    
    /// <summary>
    /// Unlock an achievement directly
    /// </summary>
    public void UnlockAchievement(string achievementId) {
        Achievement achievement = achievements.Find(a => a.id == achievementId);
        if (achievement != null) {
            UnlockAchievement(achievement);
        }
    }
    
    /// <summary>
    /// Reset all achievement progress (for testing)
    /// </summary>
    public void ResetAchievements() {
        foreach (var achievement in achievements) {
            achievement.isUnlocked = false;
            achievement.progress = 0f;
        }
        
        streak.currentStreak = 0;
        streak.completedMilestones.Clear();
        
        SaveAchievements();
    }
    
    // Private implementation methods
    
    private IEnumerator AchievementCheckRoutine() {
        while (true) {
            yield return new WaitForSeconds(checkInterval);
            
            // Check achievements that need periodic updates
            CheckStatBasedAchievements();
            
            lastCheckTime = Time.time;
        }
    }
    
    private void CheckStatBasedAchievements() {
        if (pet == null) return;
        
        // Check playtime
        float playTimeHours = Time.time / 3600f;
        RecordProgress(Achievement.AchievementType.PlayTime, playTimeHours);
        
        // Check pet stats
        RecordProgress(Achievement.AchievementType.Happiness, pet.Happiness);
        RecordProgress(Achievement.AchievementType.Health, pet.Health);
        RecordProgress(Achievement.AchievementType.Age, pet.AgeDays);
        
        // Check bond level
        AffectionMeter affectionMeter = pet.GetComponent<AffectionMeter>();
        if (affectionMeter != null) {
            RecordProgress(Achievement.AchievementType.BondLevel, affectionMeter.GetBondLevel());
        }
    }
    
    private void UnlockAchievement(Achievement achievement) {
        if (achievement.isUnlocked) return;
        
        achievement.isUnlocked = true;
        achievement.progress = achievement.targetValue; // Ensure full progress
        
        // Show achievement popup
        ShowAchievementPopup(achievement);
        
        // Apply rewards
        ApplyAchievementReward(achievement);
        
        // Save achievements
        SaveAchievements();
        
        Debug.Log($"[AchievementManager] Achievement unlocked: {achievement.displayName}");
    }
    
    private void ShowAchievementPopup(Achievement achievement) {
        // Show UI popup if available
        if (achievementPopup != null && achievementText != null) {
            achievementText.text = $"{achievement.displayName}\n{achievement.description}";
            
            if (achievementIcon != null && achievement.icon != null) {
                achievementIcon.sprite = achievement.icon;
            }
            
            // Show popup
            achievementPopup.SetActive(true);
            
            // Hide after delay
            StartCoroutine(HidePopupAfterDelay());
        }
        
        // Show notification
        if (notificationManager != null) {
            notificationManager.TriggerAlert($"Achievement Unlocked: {achievement.displayName}!");
        }
        
        // Play sound
        if (audioManager != null) {
            audioManager.Play("AchievementUnlocked");
        }
    }
    
    private IEnumerator HidePopupAfterDelay() {
        yield return new WaitForSeconds(5f);
        if (achievementPopup != null) {
            achievementPopup.SetActive(false);
        }
    }
    
    private void ApplyAchievementReward(Achievement achievement) {
        if (achievement.reward == null) return;
        
        switch (achievement.reward.type) {
            case Reward.RewardType.AccessoryUnlock:
                UnlockAccessory(achievement.reward.stringValue);
                break;
                
            case Reward.RewardType.MinigameUnlock:
                UnlockMinigame(achievement.reward.stringValue);
                break;
                
            case Reward.RewardType.HappinessBoost:
                if (pet != null) {
                    pet.Happiness = Mathf.Min(pet.Happiness + achievement.reward.value, 100f);
                }
                break;
                
            case Reward.RewardType.HealthBoost:
                if (pet != null) {
                    pet.Health = Mathf.Min(pet.Health + achievement.reward.value, 100f);
                }
                break;
                
            case Reward.RewardType.BondPoints:
                AddBondPoints((int)achievement.reward.value);
                break;
                
            case Reward.RewardType.ThemeUnlock:
                UnlockTheme(achievement.reward.stringValue);
                break;
                
            case Reward.RewardType.CurrencyBoost:
                AddCurrency((int)achievement.reward.value);
                break;
        }
    }
    
    private void UnlockAccessory(string accessoryId) {
        CustomizationManager customizationManager = FindObjectOfType<CustomizationManager>();
        if (customizationManager != null) {
            customizationManager.UnlockAccessory(accessoryId);
        }
    }
    
    private void UnlockMinigame(string minigameId) {
        MinigameManager minigameManager = FindObjectOfType<MinigameManager>();
        if (minigameManager != null) {
            minigameManager.UnlockMinigame(minigameId);
        }
    }
    
    private void UnlockTheme(string themeId) {
        // Implement theme unlocking if you have a theme system
    }
    
    private void AddBondPoints(int points) {
        AffectionMeter affectionMeter = pet.GetComponent<AffectionMeter>();
        if (affectionMeter != null) {
            affectionMeter.AddBond(points);
        }
    }
    
    private void AddCurrency(int amount) {
        // Implement currency system if you have one
    }
    
    private void CheckDailyStreak() {
        DateTime now = DateTime.Now;
        DateTime lastLogin = streak.lastLoginDate;
        
        // First-time login
        if (lastLogin == DateTime.MinValue) {
            streak.currentStreak = 1;
            streak.lastLoginDate = now;
            return;
        }
        
        // Check if this is a new day
        if (now.Date > lastLogin.Date) {
            // Check if it's consecutive
            TimeSpan difference = now.Date - lastLogin.Date;
            if (difference.Days == 1) {
                // Consecutive day
                streak.currentStreak++;
                
                // Check streak milestones
                foreach (int milestone in streak.milestones) {
                    if (streak.currentStreak >= milestone && !streak.completedMilestones.Contains(milestone)) {
                        streak.completedMilestones.Add(milestone);
                        OnStreakMilestoneReached(milestone);
                    }
                }
            } else if (difference.Days > 1) {
                // Streak broken
                streak.currentStreak = 1;
            }
            
            // Update last login
            streak.lastLoginDate = now;
        }
        
        // Save streak
        SaveDailyStreak();
    }
    
    private void OnStreakMilestoneReached(int milestone) {
        // Show notification
        if (notificationManager != null) {
            notificationManager.TriggerAlert($"Daily Streak: {milestone} days! 🔥");
        }
        
        // Give rewards based on milestone
        switch (milestone) {
            case 3:
                if (pet != null) pet.Happiness = Mathf.Min(pet.Happiness + 10f, 100f);
                break;
                
            case 7:
                AddBondPoints(5);
                break;
                
            case 14:
                // Custom reward
                break;
                
            // Add more milestones as needed
        }
    }
    
    private void SubscribeToEvents() {
        // Subscribe to pet actions
        if (pet != null) {
            // Example: track feeding
            var originalFeed = pet.Feed;
            pet.Feed = () => {
                originalFeed();
                RecordProgress(Achievement.AchievementType.Feed, 1f);
            };
            
            // Example: track playing
            var originalPlay = pet.Play;
            pet.Play = () => {
                originalPlay();
                RecordProgress(Achievement.AchievementType.Play, 1f);
            };
            
            // Example: track drinking
            var originalDrink = pet.Drink;
            pet.Drink = () => {
                originalDrink();
                RecordProgress(Achievement.AchievementType.Drink, 1f);
            };
        }
        
        // Subscribe to photo events if available
        ARPhotoModeManager photoManager = FindObjectOfType<ARPhotoModeManager>();
        if (photoManager != null) {
            // Add listeners if needed
        }
        
        // Subscribe to quest completion
        QuestManager questManager = FindObjectOfType<QuestManager>();
        if (questManager != null && questManager.OnQuestComplete != null) {
            questManager.OnQuestComplete.AddListener(() => {
                RecordProgress(Achievement.AchievementType.CompleteQuests, 1f);
            });
        }
    }
    
    private void SaveAchievements() {
        // Save unlocked status
        foreach (var achievement in achievements) {
            PlayerPrefs.SetInt($"Achievement_{achievement.id}_Unlocked", achievement.isUnlocked ? 1 : 0);
            PlayerPrefs.SetFloat($"Achievement_{achievement.id}_Progress", achievement.progress);
        }
        
        PlayerPrefs.Save();
    }
    
    private void LoadAchievements() {
        // Load achievement status
        foreach (var achievement in achievements) {
            if (PlayerPrefs.HasKey($"Achievement_{achievement.id}_Unlocked")) {
                achievement.isUnlocked = PlayerPrefs.GetInt($"Achievement_{achievement.id}_Unlocked") == 1;
            }
            
            if (PlayerPrefs.HasKey($"Achievement_{achievement.id}_Progress")) {
                achievement.progress = PlayerPrefs.GetFloat($"Achievement_{achievement.id}_Progress");
            }
        }
    }
    
    private void SaveDailyStreak() {
        PlayerPrefs.SetInt("DailyStreak_Current", streak.currentStreak);
        PlayerPrefs.SetString("DailyStreak_LastLogin", streak.lastLoginDate.ToString());
        
        // Save completed milestones
        string milestones = string.Join(",", streak.completedMilestones);
        PlayerPrefs.SetString("DailyStreak_Milestones", milestones);
        
        PlayerPrefs.Save();
    }
    
    private void LoadDailyStreak() {
        if (PlayerPrefs.HasKey("DailyStreak_Current")) {
            streak.currentStreak = PlayerPrefs.GetInt("DailyStreak_Current");
        }
        
        if (PlayerPrefs.HasKey("DailyStreak_LastLogin")) {
            try {
                streak.lastLoginDate = DateTime.Parse(PlayerPrefs.GetString("DailyStreak_LastLogin"));
            } catch (Exception) {
                streak.lastLoginDate = DateTime.Now;
            }
        }
        
        if (PlayerPrefs.HasKey("DailyStreak_Milestones")) {
            string milestones = PlayerPrefs.GetString("DailyStreak_Milestones");
            if (!string.IsNullOrEmpty(milestones)) {
                streak.completedMilestones.Clear();
                string[] parts = milestones.Split(',');
                foreach (string part in parts) {
                    if (int.TryParse(part, out int milestone)) {
                        streak.completedMilestones.Add(milestone);
                    }
                }
            }
        }
    }
    
    void OnApplicationPause(bool pauseStatus) {
        if (pauseStatus) {
            // Save when app is paused
            SaveAchievements();
            SaveDailyStreak();
        }
    }
    
    void OnApplicationQuit() {
        // Save when app is closed
        SaveAchievements();
        SaveDailyStreak();
    }
}