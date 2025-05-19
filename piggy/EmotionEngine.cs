using UnityEngine;
using UnityEngine.Events;
using System.Collections.Generic;

/// <summary>
/// Calculates the pet's emotional state each tick and notifies listeners.
/// </summary>
public class EmotionEngine : MonoBehaviour {
    [Header("Thresholds")]
    [Tooltip("Happiness ≥ this → Joy state")]
    [SerializeField] private float joyThreshold = 85f;
    [Tooltip("Happiness ≤ this → Sad state")]
    [SerializeField] private float sadnessThreshold = 20f;
    [Tooltip("Hunger or Thirst ≥ this → Anxious state")]
    [SerializeField] private float anxiousThreshold = 80f;

    [Header("Events")]
    [Tooltip("Invoked when emotion state changes")]
    public EmotionEvent OnEmotionChanged;

    /// <summary>
    /// Emotional states of the guinea pig.
    /// </summary>
    public enum EmotionState { Sad, Content, Joy, Anxious }

    [System.Serializable]
    public class EmotionEvent : UnityEvent<EmotionState> {}

    void OnValidate() {
        if (OnEmotionChanged == null)
            Debug.LogWarning("[EmotionEngine] OnEmotionChanged event not assigned", this);
    }

    /// <summary>
    /// Call each tick to update emotion based on current stats.
    /// </summary>
    public void UpdateEmotion(VirtualPetUnity pet) {
        if (pet == null) {
            Debug.LogError("[EmotionEngine] pet is null", this);
            return;
        }

        EmotionState newState = EmotionState.Content;
        if (pet.Happiness >= joyThreshold) {
            newState = EmotionState.Joy;
        } else if (pet.Happiness <= sadnessThreshold) {
            newState = EmotionState.Sad;
        } else if (pet.Hunger >= anxiousThreshold || pet.Thirst >= anxiousThreshold) {
            newState = EmotionState.Anxious;
        }

        OnEmotionChanged?.Invoke(newState);
    }

    /// <summary>
    /// Retrieve alert messages based on low stats.
    /// </summary>
    public List<string> GetAlerts(VirtualPetUnity pet) {
        var alerts = new List<string>();
        if (pet.Hunger >= anxiousThreshold) alerts.Add("I'm starving! 😢");
        if (pet.Thirst >= anxiousThreshold) alerts.Add("I'm parched! 💧");
        if (pet.Health <= 20f) alerts.Add("I don't feel well... 🥺");
        return alerts;
    }
}