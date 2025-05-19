using UnityEngine;
using UnityEngine.Events;

/// <summary>
/// Tracks long-term bonding with the pet through accumulated interactions
/// </summary>
public class AffectionMeter : MonoBehaviour {
    [System.Serializable]
    public class BondLevelEvent : UnityEvent<int> {}
    
    [Header("Bond Settings")]
    [Tooltip("Current bond level")]
    [SerializeField] private int currentBondLevel = 0;
    [Tooltip("Current bond points")]
    [SerializeField] private int currentBondPoints = 0;
    [Tooltip("Points needed to reach next bond level")]
    [SerializeField] private int[] pointsPerLevel = new int[] { 10, 25, 50, 100, 200 };
    [Tooltip("Max bond level (0-indexed)")]
    [SerializeField] private int maxBondLevel = 4;
    
    [Header("Events")]
    [Tooltip("Called when bond level increases")]
    public BondLevelEvent OnBondLevelUp;
    [Tooltip("Called when bond points increase")]
    public BondLevelEvent OnBondPointsChanged;
    
    void OnValidate() {
        if (pointsPerLevel.Length == 0)
            Debug.LogWarning("[AffectionMeter] pointsPerLevel array is empty", this);
        
        if (OnBondLevelUp == null)
            Debug.LogWarning("[AffectionMeter] OnBondLevelUp event not assigned", this);
        
        if (OnBondPointsChanged == null)
            Debug.LogWarning("[AffectionMeter] OnBondPointsChanged event not assigned", this);
    }
    
    /// <summary>
    /// Add bond points and check for level up
    /// </summary>
    public void AddBond(int points) {
        if (points <= 0) return;
        
        // Already at max level
        if (currentBondLevel >= maxBondLevel) {
            OnBondPointsChanged?.Invoke(currentBondPoints);
            return;
        }
        
        currentBondPoints += points;
        OnBondPointsChanged?.Invoke(currentBondPoints);
        
        // Check for level up
        int pointsNeeded = GetPointsForCurrentLevel();
        if (currentBondPoints >= pointsNeeded) {
            currentBondPoints -= pointsNeeded;
            currentBondLevel++;
            OnBondLevelUp?.Invoke(currentBondLevel);
            
            Debug.Log($"[AffectionMeter] Bond Level Up! Now level {currentBondLevel}");
        }
    }
    
    /// <summary>
    /// Get the current bond level (0-indexed)
    /// </summary>
    public int GetBondLevel() {
        return currentBondLevel;
    }
    
    /// <summary>
    /// Get points needed for current level
    /// </summary>
    private int GetPointsForCurrentLevel() {
        if (currentBondLevel >= pointsPerLevel.Length)
            return int.MaxValue;
            
        return pointsPerLevel[currentBondLevel];
    }
    
    /// <summary>
    /// Get percentage progress to next level (0.0 - 1.0)
    /// </summary>
    public float GetLevelProgress() {
        if (currentBondLevel >= maxBondLevel)
            return 1.0f;
            
        int pointsNeeded = GetPointsForCurrentLevel();
        if (pointsNeeded <= 0)
            return 0f;
            
        return (float)currentBondPoints / pointsNeeded;
    }
}