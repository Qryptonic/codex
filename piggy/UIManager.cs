using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Events;

public class UIManager : MonoBehaviour {
    [Header("Stat Displays")]
    [SerializeField] private VirtualPetUnity pet;
    [SerializeField] private Text hungerText;
    [SerializeField] private Text thirstText;
    [SerializeField] private Text happinessText;
    [SerializeField] private Text healthText;

    [Header("Mood Dial")]
    [SerializeField] private Image moodDial;
    [SerializeField] private Sprite sadSprite;
    [SerializeField] private Sprite contentSprite;
    [SerializeField] private Sprite joySprite;
    [SerializeField] private Sprite anxiousSprite;

    [Header("Bond Display")]
    [SerializeField] private Transform bondContainer;
    [SerializeField] private GameObject heartIconPrefab;
    private int lastBondLevel = 0;

    [Header("Quest Display")]
    [SerializeField] private Text questText;

    [Header("Action Buttons")]
    [SerializeField] private Button feedButton;
    [SerializeField] private Button drinkButton;
    [SerializeField] private Button playButton;

    void OnValidate() {
        if (pet == null) Debug.LogWarning("[UIManager] pet not assigned", this);
    }

    void Start() {
        // Wire buttons to pet actions
        feedButton.onClick.AddListener(() => pet.Feed());
        drinkButton.onClick.AddListener(() => pet.Drink());
        playButton.onClick.AddListener(() => pet.Play());

        // Subscribe to events
        pet.GetComponent<EmotionEngine>().OnEmotionChanged.AddListener(UpdateMood);
        pet.GetComponent<QuestManager>().OnQuestComplete.AddListener(OnQuestComplete);
        pet.GetComponent<AffectionMeter>().OnBondLevelUp.AddListener(UpdateBond);
    }

    /// <summary>
    /// Call every frame or after a stat change to refresh text.
    /// </summary>
    public void UpdateStats() {
        if (pet == null) return;
        hungerText.text    = $"Hunger: {pet.Hunger:0}";
        thirstText.text    = $"Thirst: {pet.Thirst:0}";
        happinessText.text = $"Happiness: {pet.Happiness:0}";
        healthText.text    = $"Health: {pet.Health:0}";
    }

    /// <summary>
    /// Updates the mood dial sprite based on state.
    /// </summary>
    public void UpdateMood(EmotionEngine.EmotionState state) {
        switch(state) {
            case EmotionEngine.EmotionState.Sad:     moodDial.sprite = sadSprite; break;
            case EmotionEngine.EmotionState.Content: moodDial.sprite = contentSprite; break;
            case EmotionEngine.EmotionState.Joy:     moodDial.sprite = joySprite; break;
            case EmotionEngine.EmotionState.Anxious: moodDial.sprite = anxiousSprite; break;
        }
    }

    /// <summary>
    /// Adds a heart icon whenever bond level increases.
    /// </summary>
    public void UpdateBond(int newLevel) {
        for (int i = lastBondLevel; i < newLevel; i++) {
            Instantiate(heartIconPrefab, bondContainer);
        }
        lastBondLevel = newLevel;
    }

    /// <summary>
    /// Called when the quest completes.
    /// </summary>
    public void OnQuestComplete() {
        questText.text = "Quest Complete! 🎉";
    }

    void Update() {
        // Optionally refresh stats every frame
        UpdateStats();
    }
}