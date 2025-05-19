using UnityEngine;

[CreateAssetMenu(fileName = "GameConfig", menuName = "Piggy/Game Config")]
public class GameConfig : ScriptableObject {
    [Header("Time Settings")]
    public float hourDuration = 60f;  // Real seconds per in-game hour
    
    [Header("Stat Rates")]
    [Range(1f, 10f)] public float hungerRate = 5f;
    [Range(1f, 10f)] public float thirstRate = 5f;
    [Range(0.5f, 5f)] public float happinessDecay = 2f;
    
    [Header("Gameplay Tuning")]
    [Range(5f, 50f)] public float feedValue = 30f;
    [Range(5f, 50f)] public float drinkValue = 30f;
    [Range(5f, 50f)] public float playValue = 15f;
    
    [Header("Difficulty Scaling")]
    public AnimationCurve difficultyCurve = AnimationCurve.Linear(0, 1, 10, 2);  // Age vs difficulty multiplier
}