using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System;

/// <summary>
/// Manages care flow states and combo bonuses for chained activities
/// </summary>
public class CareFlowSystem : MonoBehaviour {
    [System.Serializable]
    public class CareActivity {
        public string activityId;
        public string displayName;
        [Range(1, 10)]
        public int basePoints = 1;
        public float cooldownSeconds = 5f;
        public float comboWindowSeconds = 10f;
        public string[] goodFollowups;
        public string[] excellentFollowups;
        [Range(0f, 2f)]
        public float comboMultiplier = 1.5f;
    }
    
    [System.Serializable]
    public class CareSequence {
        public string sequenceId;
        public string displayName;
        public string[] activityIds;
        [Range(0f, 3f)]
        public float sequenceMultiplier = 2f;
        public string perfectAnimation;
        public string rewardFeedback;
        public float happinessBoost = 10f;
        public float bondBoost = 5f;
        public bool unlockPermanentBonus = false;
    }
    
    [System.Serializable]
    public class CareCombo {
        public string firstActivityId;
        public string secondActivityId;
        public string comboName;
        [Range(0f, 3f)]
        public float comboMultiplier = 1.7f;
        public string comboMessage;
    }
    
    [System.Serializable]
    public class FlowState {
        public string lastActivityId;
        public DateTime lastActivityTime;
        public int currentComboCount = 0;
        public float currentMultiplier = 1.0f;
        public List<string> currentSequence = new List<string>();
        public List<string> completedSequences = new List<string>();
        public Dictionary<string, int> activityCounts = new Dictionary<string, int>();
        public Dictionary<string, DateTime> lastActivityTimes = new Dictionary<string, DateTime>();
        public bool isInFlow = false;
    }
    
    [Header("Care Activities")]
    [SerializeField] private List<CareActivity> careActivities = new List<CareActivity>();
    [SerializeField] private List<CareSequence> careSequences = new List<CareSequence>();
    [SerializeField] private List<CareCombo> careSpecialCombos = new List<CareCombo>();
    
    [Header("Flow Settings")]
    [SerializeField] private int minComboForFlow = 3;
    [SerializeField] private float flowStateTimeLimit = 30f;
    [SerializeField] private float maxMultiplier = 5.0f;
    [SerializeField] private AnimationCurve comboMultiplierCurve = AnimationCurve.Linear(0, 1, 10, 3);
    [SerializeField] private int maxComboCount = 10;
    
    [Header("Rewards")]
    [SerializeField] private float baseHappinessPerPoint = 0.5f;
    [SerializeField] private float baseBondPerPoint = 0.1f;
    [SerializeField] private int perfectSequenceMinPoints = 50;
    [SerializeField] private ParticleSystem comboEffectPrefab;
    [SerializeField] private ParticleSystem perfectEffectPrefab;
    
    [Header("References")]
    [SerializeField] private VirtualPetUnity pet;
    [SerializeField] private AffectionMeter affectionMeter;
    [SerializeField] private NotificationManager notificationManager;
    [SerializeField] private MicroAnimationController animationController;
    [SerializeField] private AudioManager audioManager;
    
    private FlowState flowState = new FlowState();
    private Coroutine flowCheckCoroutine;
    private Dictionary<string, bool> permanentBonuses = new Dictionary<string, bool>();
    
    void Start() {
        // Initialize flow state
        flowState.lastActivityTime = DateTime.Now.AddDays(-1); // Past time to start fresh
        
        // Subscribe to pet activities
        SubscribeToEvents();
        
        // Load saved state
        LoadFlowState();
    }
    
    /// <summary>
    /// Records a care activity and calculates combos
    /// </summary>
    public void RecordActivity(string activityId) {
        CareActivity activity = careActivities.Find(a => a.activityId == activityId);
        if (activity == null) {
            Debug.LogWarning($"[CareFlow] Activity not found: {activityId}");
            return;
        }
        
        DateTime now = DateTime.Now;
        
        // Check cooldown
        if (flowState.lastActivityTimes.ContainsKey(activityId)) {
            TimeSpan timeSince = now - flowState.lastActivityTimes[activityId];
            if (timeSince.TotalSeconds < activity.cooldownSeconds) {
                // Still on cooldown, reduce effectiveness
                RecordFlowBreak("Repeating same action too quickly");
                return;
            }
        }
        
        // Update activity counts
        if (!flowState.activityCounts.ContainsKey(activityId)) {
            flowState.activityCounts[activityId] = 0;
        }
        flowState.activityCounts[activityId]++;
        
        // Check if this is part of an active combo
        bool isCombo = false;
        float comboMultiplier = 1.0f;
        
        if (!string.IsNullOrEmpty(flowState.lastActivityId)) {
            // Check time window
            TimeSpan timeSinceLastActivity = now - flowState.lastActivityTime;
            CareActivity lastActivity = careActivities.Find(a => a.activityId == flowState.lastActivityId);
            
            if (lastActivity != null && timeSinceLastActivity.TotalSeconds <= lastActivity.comboWindowSeconds) {
                // Check if this activity is a good followup
                if (Array.IndexOf(lastActivity.goodFollowups, activityId) >= 0) {
                    isCombo = true;
                    comboMultiplier = lastActivity.comboMultiplier;
                    
                    // Check for excellent followup
                    if (Array.IndexOf(lastActivity.excellentFollowups, activityId) >= 0) {
                        comboMultiplier *= 1.5f;
                    }
                    
                    // Check for special combo
                    CareCombo specialCombo = careSpecialCombos.Find(c => 
                        c.firstActivityId == flowState.lastActivityId && c.secondActivityId == activityId);
                        
                    if (specialCombo != null) {
                        comboMultiplier = specialCombo.comboMultiplier;
                        ShowComboMessage(specialCombo.comboName, specialCombo.comboMessage);
                    }
                } else {
                    // Not a good followup, break combo
                    RecordFlowBreak("Activity sequence break");
                }
            } else {
                // Too slow, break combo
                RecordFlowBreak("Time window expired");
            }
        }
        
        // Update flow state
        if (isCombo) {
            // Continue combo
            flowState.currentComboCount++;
            flowState.currentComboCount = Mathf.Min(flowState.currentComboCount, maxComboCount);
            
            // Update multiplier (combo multiplier * combo count curve)
            float countMultiplier = comboMultiplierCurve.Evaluate(flowState.currentComboCount);
            flowState.currentMultiplier = comboMultiplier * countMultiplier;
            flowState.currentMultiplier = Mathf.Min(flowState.currentMultiplier, maxMultiplier);
            
            // Check flow state
            if (flowState.currentComboCount >= minComboForFlow && !flowState.isInFlow) {
                EnterFlowState();
            }
            
            // Show combo feedback
            ShowComboFeedback(flowState.currentComboCount, flowState.currentMultiplier);
        } else {
            // Start new combo
            flowState.currentComboCount = 1;
            flowState.currentMultiplier = 1.0f;
        }
        
        // Add to current sequence
        flowState.currentSequence.Add(activityId);
        
        // Check for completed sequences
        CheckForCompletedSequences();
        
        // Calculate points
        int basePoints = activity.basePoints;
        int totalPoints = Mathf.RoundToInt(basePoints * flowState.currentMultiplier);
        
        // Apply permanent bonuses if any
        if (permanentBonuses.ContainsKey(activityId) && permanentBonuses[activityId]) {
            totalPoints = Mathf.RoundToInt(totalPoints * 1.2f); // 20% permanent bonus
        }
        
        // Apply rewards
        ApplyActivityRewards(totalPoints);
        
        // Update timestamps
        flowState.lastActivityId = activityId;
        flowState.lastActivityTime = now;
        flowState.lastActivityTimes[activityId] = now;
        
        // Start or update flow check
        UpdateFlowCheck();
        
        // Save state
        SaveFlowState();
        
        Debug.Log($"[CareFlow] Recorded activity: {activity.displayName}, Points: {totalPoints}, Combo: {flowState.currentComboCount}, Multiplier: {flowState.currentMultiplier:F2}");
    }
    
    /// <summary>
    /// Gets the current combo count
    /// </summary>
    public int GetComboCount() {
        return flowState.currentComboCount;
    }
    
    /// <summary>
    /// Gets the current combo multiplier
    /// </summary>
    public float GetComboMultiplier() {
        return flowState.currentMultiplier;
    }
    
    /// <summary>
    /// Gets whether the pet is in a flow state
    /// </summary>
    public bool IsInFlowState() {
        return flowState.isInFlow;
    }
    
    /// <summary>
    /// Gets a list of completed sequences
    /// </summary>
    public List<string> GetCompletedSequences() {
        return flowState.completedSequences;
    }
    
    // Private implementation methods
    
    private void EnterFlowState() {
        flowState.isInFlow = true;
        
        // Show flow state feedback
        if (notificationManager != null) {
            notificationManager.TriggerAlert("Flow state achieved! Keep the combo going for bonus rewards!");
        }
        
        // Play flow animation
        if (animationController != null) {
            animationController.PlayAnimation("FlowState");
        }
        
        // Play flow sound
        if (audioManager != null) {
            audioManager.Play("FlowStateStart");
        }
        
        // Flow state particle effect
        if (comboEffectPrefab != null) {
            ParticleSystem effect = Instantiate(comboEffectPrefab, pet.transform.position + Vector3.up * 0.5f, Quaternion.identity);
            effect.Play();
            Destroy(effect.gameObject, 5f);
        }
    }
    
    private void ExitFlowState() {
        if (!flowState.isInFlow) return;
        
        flowState.isInFlow = false;
        
        // Show exit feedback
        if (notificationManager != null) {
            notificationManager.TriggerAlert("Flow state ended.");
        }
        
        // Play exit animation
        if (animationController != null) {
            animationController.PlayAnimation("FlowStateEnd");
        }
        
        // Play exit sound
        if (audioManager != null) {
            audioManager.Play("FlowStateEnd");
        }
    }
    
    private void RecordFlowBreak(string reason) {
        // Reset combo
        flowState.currentComboCount = 0;
        flowState.currentMultiplier = 1.0f;
        
        // Exit flow state if active
        if (flowState.isInFlow) {
            ExitFlowState();
        }
        
        // Clear current sequence
        flowState.currentSequence.Clear();
        
        Debug.Log($"[CareFlow] Flow break: {reason}");
    }
    
    private void CheckForCompletedSequences() {
        foreach (var sequence in careSequences) {
            // Skip already completed sequences
            if (flowState.completedSequences.Contains(sequence.sequenceId)) continue;
            
            // Check if current sequence contains this predefined sequence
            bool isMatch = IsSubsequence(flowState.currentSequence, sequence.activityIds);
            
            if (isMatch) {
                // Sequence completed!
                flowState.completedSequences.Add(sequence.sequenceId);
                
                // Apply sequence rewards
                ApplySequenceRewards(sequence);
                
                // Clear current sequence
                flowState.currentSequence.Clear();
                
                break;
            }
        }
    }
    
    private bool IsSubsequence(List<string> main, string[] sub) {
        if (sub.Length > main.Count) return false;
        
        // Check for exact match at the end
        for (int i = 1; i <= sub.Length; i++) {
            if (main[main.Count - i] != sub[sub.Length - i]) {
                return false;
            }
        }
        
        return true;
    }
    
    private void ApplyActivityRewards(int points) {
        if (pet == null) return;
        
        // Apply happiness based on points
        float happinessGain = points * baseHappinessPerPoint;
        pet.Happiness = Mathf.Min(pet.Happiness + happinessGain, 100f);
        
        // Apply bond based on points
        if (affectionMeter != null) {
            int bondPoints = Mathf.Max(1, Mathf.FloorToInt(points * baseBondPerPoint));
            affectionMeter.AddBond(bondPoints);
        }
    }
    
    private void ApplySequenceRewards(CareSequence sequence) {
        if (pet == null) return;
        
        // Apply happiness boost
        pet.Happiness = Mathf.Min(pet.Happiness + sequence.happinessBoost, 100f);
        
        // Apply bond boost
        if (affectionMeter != null && sequence.bondBoost > 0) {
            affectionMeter.AddBond(Mathf.RoundToInt(sequence.bondBoost));
        }
        
        // Play perfect animation
        if (animationController != null && !string.IsNullOrEmpty(sequence.perfectAnimation)) {
            animationController.PlayAnimation(sequence.perfectAnimation);
        }
        
        // Show reward feedback
        if (notificationManager != null) {
            string message = $"Perfect {sequence.displayName} sequence completed!";
            if (!string.IsNullOrEmpty(sequence.rewardFeedback)) {
                message += $" {sequence.rewardFeedback}";
            }
            notificationManager.TriggerAlert(message);
        }
        
        // Play reward sound
        if (audioManager != null) {
            audioManager.Play("PerfectSequence");
        }
        
        // Show perfect effect
        if (perfectEffectPrefab != null) {
            ParticleSystem effect = Instantiate(perfectEffectPrefab, pet.transform.position + Vector3.up * 0.5f, Quaternion.identity);
            effect.Play();
            Destroy(effect.gameObject, 5f);
        }
        
        // Unlock permanent bonus if specified
        if (sequence.unlockPermanentBonus) {
            foreach (string activityId in sequence.activityIds) {
                permanentBonuses[activityId] = true;
            }
            
            if (notificationManager != null) {
                notificationManager.TriggerAlert("Permanent care bonus unlocked!");
            }
        }
        
        // Save bonuses
        SavePermanentBonuses();
        
        Debug.Log($"[CareFlow] Sequence completed: {sequence.displayName}");
    }
    
    private void ShowComboFeedback(int comboCount, float multiplier) {
        if (comboCount < 2) return;
        
        // Show combo notification
        if (notificationManager != null) {
            string message = $"Combo x{comboCount} (x{multiplier:F1})";
            if (comboCount == maxComboCount) {
                message = $"MAX COMBO! x{multiplier:F1}";
            } else if (comboCount >= 8) {
                message = $"AMAZING! Combo x{comboCount} (x{multiplier:F1})";
            } else if (comboCount >= 5) {
                message = $"GREAT! Combo x{comboCount} (x{multiplier:F1})";
            }
            
            notificationManager.TriggerAlert(message);
        }
        
        // Play combo sound
        if (audioManager != null) {
            string soundName = "Combo";
            if (comboCount >= 8) {
                soundName = "ComboHigh";
            } else if (comboCount >= 5) {
                soundName = "ComboMedium";
            }
            
            audioManager.Play(soundName);
        }
        
        // Show combo effect
        if (comboEffectPrefab != null && comboCount >= 3) {
            ParticleSystem effect = Instantiate(comboEffectPrefab, pet.transform.position + Vector3.up * 0.5f, Quaternion.identity);
            
            // Scale effect with combo size
            float scale = Mathf.Lerp(0.8f, 1.5f, (float)comboCount / maxComboCount);
            effect.transform.localScale = Vector3.one * scale;
            
            effect.Play();
            Destroy(effect.gameObject, 3f);
        }
    }
    
    private void ShowComboMessage(string comboName, string message) {
        if (notificationManager != null) {
            notificationManager.TriggerAlert($"{comboName} COMBO! {message}");
        }
    }
    
    private void UpdateFlowCheck() {
        if (flowCheckCoroutine != null) {
            StopCoroutine(flowCheckCoroutine);
        }
        
        flowCheckCoroutine = StartCoroutine(CheckFlowStateTimeout());
    }
    
    private IEnumerator CheckFlowStateTimeout() {
        // Wait for flow state time limit
        yield return new WaitForSeconds(flowStateTimeLimit);
        
        // If we haven't had any activity since starting this coroutine
        TimeSpan timeSinceLastActivity = DateTime.Now - flowState.lastActivityTime;
        if (timeSinceLastActivity.TotalSeconds >= flowStateTimeLimit) {
            // Exit flow state
            if (flowState.isInFlow) {
                ExitFlowState();
            }
            
            // Reset combo
            flowState.currentComboCount = 0;
            flowState.currentMultiplier = 1.0f;
            
            // Clear current sequence
            flowState.currentSequence.Clear();
        }
    }
    
    private void SubscribeToEvents() {
        if (pet != null) {
            // Track feed activity
            var originalFeed = pet.Feed;
            pet.Feed = () => {
                originalFeed();
                RecordActivity("Feed");
            };
            
            // Track play activity
            var originalPlay = pet.Play;
            pet.Play = () => {
                originalPlay();
                RecordActivity("Play");
            };
            
            // Track drink activity
            var originalDrink = pet.Drink;
            pet.Drink = () => {
                originalDrink();
                RecordActivity("Drink");
            };
        }
    }
    
    private void SaveFlowState() {
        // We only need to persist completed sequences and permanent bonuses
        PlayerPrefs.SetString("CareFlow_CompletedSequences", string.Join(",", flowState.completedSequences));
        
        // Activity counts can be useful for stats
        string activityCountStr = "";
        foreach (var pair in flowState.activityCounts) {
            activityCountStr += $"{pair.Key}:{pair.Value},";
        }
        PlayerPrefs.SetString("CareFlow_ActivityCounts", activityCountStr);
        
        PlayerPrefs.Save();
    }
    
    private void LoadFlowState() {
        // Load completed sequences
        if (PlayerPrefs.HasKey("CareFlow_CompletedSequences")) {
            string sequences = PlayerPrefs.GetString("CareFlow_CompletedSequences");
            if (!string.IsNullOrEmpty(sequences)) {
                flowState.completedSequences = new List<string>(sequences.Split(','));
            }
        }
        
        // Load activity counts
        if (PlayerPrefs.HasKey("CareFlow_ActivityCounts")) {
            string counts = PlayerPrefs.GetString("CareFlow_ActivityCounts");
            if (!string.IsNullOrEmpty(counts)) {
                string[] pairs = counts.Split(new char[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
                foreach (string pair in pairs) {
                    string[] keyValue = pair.Split(':');
                    if (keyValue.Length == 2) {
                        int count;
                        if (int.TryParse(keyValue[1], out count)) {
                            flowState.activityCounts[keyValue[0]] = count;
                        }
                    }
                }
            }
        }
        
        // Load permanent bonuses
        LoadPermanentBonuses();
    }
    
    private void SavePermanentBonuses() {
        string bonusStr = "";
        foreach (var pair in permanentBonuses) {
            if (pair.Value) {
                bonusStr += $"{pair.Key},";
            }
        }
        PlayerPrefs.SetString("CareFlow_PermanentBonuses", bonusStr);
        PlayerPrefs.Save();
    }
    
    private void LoadPermanentBonuses() {
        if (PlayerPrefs.HasKey("CareFlow_PermanentBonuses")) {
            string bonuses = PlayerPrefs.GetString("CareFlow_PermanentBonuses");
            if (!string.IsNullOrEmpty(bonuses)) {
                string[] activityIds = bonuses.Split(new char[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
                foreach (string id in activityIds) {
                    permanentBonuses[id] = true;
                }
            }
        }
    }
    
    void OnApplicationPause(bool pauseStatus) {
        if (pauseStatus) {
            // Save when app is paused
            SaveFlowState();
            SavePermanentBonuses();
        }
    }
    
    void OnApplicationQuit() {
        // Save when app is closed
        SaveFlowState();
        SavePermanentBonuses();
    }
}