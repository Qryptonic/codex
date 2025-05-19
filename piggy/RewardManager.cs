using UnityEngine;
using UnityEngine.Events;
using System.Collections.Generic;

/// <summary>
/// Manages variable reward schedules to encourage continued play
/// </summary>
public class RewardManager : MonoBehaviour {
    [System.Serializable]
    public class RewardConfig {
        public string actionType;
        [Range(0.1f, 1.0f)] public float rewardProbability = 0.3f;
        public UnityEvent OnRewardTriggered;
    }
    
    [Header("Reward Configurations")]
    [SerializeField] private List<RewardConfig> rewardConfigs = new List<RewardConfig>();
    
    [Header("Debug")]
    [SerializeField] private bool logRewards = false;
    
    void OnValidate() {
        foreach (var config in rewardConfigs) {
            if (config.OnRewardTriggered == null)
                Debug.LogWarning($"[RewardManager] OnRewardTriggered not assigned for {config.actionType}", this);
        }
    }
    
    /// <summary>
    /// Check if a variable reward should trigger for a given action
    /// </summary>
    public void CheckVariableReward(string actionType) {
        foreach (var config in rewardConfigs) {
            if (config.actionType == actionType) {
                if (Random.value <= config.rewardProbability) {
                    if (logRewards)
                        Debug.Log($"[RewardManager] Triggered reward for {actionType}");
                    
                    config.OnRewardTriggered?.Invoke();
                }
                break;
            }
        }
    }
    
    /// <summary>
    /// Add a new reward config at runtime
    /// </summary>
    public void AddRewardConfig(RewardConfig config) {
        if (config == null) return;
        
        // Replace if action type already exists
        for (int i = 0; i < rewardConfigs.Count; i++) {
            if (rewardConfigs[i].actionType == config.actionType) {
                rewardConfigs[i] = config;
                return;
            }
        }
        
        // Otherwise add new
        rewardConfigs.Add(config);
    }
}