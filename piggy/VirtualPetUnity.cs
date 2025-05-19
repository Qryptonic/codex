using UnityEngine;
using System.Collections;

[RequireComponent(typeof(ARPlacement))]
public class VirtualPetUnity : MonoBehaviour {
    [Header("Config")]
    [SerializeField] private GameConfig config;

    [Header("Managers (assign via Inspector)")]
    [SerializeField] private EmotionEngine emotionEngine;
    [SerializeField] private QuestManager questManager;
    [SerializeField] private RewardManager rewardManager;
    [SerializeField] private DataLogger dataLogger;
    [SerializeField] private NotificationManager notificationManager;
    [SerializeField] private AffectionMeter affectionMeter;
    [SerializeField] private MicroAnimationController microAnimationController;

    [Header("Core Stats")]
    public float Hunger = 50f;
    public float Thirst = 50f;
    public float Happiness = 50f;
    public float Health = 100f;

    public enum Temperament { Curious, Shy, Playful }
    public Temperament PigTemperament;

    void OnValidate() {
        if (config == null) Debug.LogWarning("GameConfig not set on " + name, this);
        if (emotionEngine == null) Debug.LogWarning("EmotionEngine not assigned", this);
        if (questManager == null) Debug.LogWarning("QuestManager not assigned", this);
        if (rewardManager == null) Debug.LogWarning("RewardManager not assigned", this);
        if (dataLogger == null) Debug.LogWarning("DataLogger not assigned", this);
        if (notificationManager == null) Debug.LogWarning("NotificationManager not assigned", this);
        if (affectionMeter == null) Debug.LogWarning("AffectionMeter not assigned", this);
        if (microAnimationController == null) Debug.LogWarning("MicroAnimationController not assigned", this);
    }

    void Start() {
        // Fallback for missing config
        if (config == null) {
            Debug.LogError("Missing GameConfig on " + name);
            return;
        }
        PigTemperament = (Temperament)Random.Range(0, System.Enum.GetValues(typeof(Temperament)).Length);
        StartCoroutine(TickLoop());
    }

    private IEnumerator TickLoop() {
        while (Health > 0f) {
            yield return new WaitForSeconds(config.hourDuration);
            Tick();
        }
    }

    private void Tick() {
        // Stat evolution
        Hunger = Mathf.Min(Hunger + config.hungerRate, 100f);
        Thirst = Mathf.Min(Thirst + config.thirstRate, 100f);
        Happiness = Mathf.Max(Happiness - config.happinessDecay, 0f);
        if (Hunger >= 100f || Thirst >= 100f)
            Health = Mathf.Max(Health - 5f, 0f);

        // Manager-driven updates (null-safe)
        emotionEngine?.UpdateEmotion(this);
        questManager?.CheckQuests(this);
        rewardManager?.CheckVariableReward("Feed");
        dataLogger?.LogTick(this);
        var alerts = emotionEngine?.GetAlerts(this);
        if (alerts != null)
            notificationManager?.TriggerAlerts(alerts);
    }

    // Player actions
    public void Feed() {
        Hunger = Mathf.Max(Hunger - 30f, 0f);
        Happiness = Mathf.Min(Happiness + 10f, 100f);
        affectionMeter?.AddBond(1);
        microAnimationController?.PlayAnimation("Eat");
    }

    public void Drink() {
        Thirst = Mathf.Max(Thirst - 30f, 0f);
        Happiness = Mathf.Min(Happiness + 5f, 100f);
        affectionMeter?.AddBond(1);
        microAnimationController?.PlayAnimation("Drink");
    }

    public void Play() {
        Happiness = Mathf.Min(Happiness + 15f, 100f);
        Hunger = Mathf.Min(Hunger + 5f, 100f);
        Thirst = Mathf.Min(Thirst + 5f, 100f);
        affectionMeter?.AddBond(5);
        microAnimationController?.PlayAnimation("Play");
    }
}