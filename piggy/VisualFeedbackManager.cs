using UnityEngine;
using System.Collections;
using UnityEngine.UI;
using DG.Tweening;

/// <summary>
/// Manages visual feedback effects for pet interactions
/// </summary>
public class VisualFeedbackManager : MonoBehaviour {
    [Header("Components")]
    [SerializeField] private VirtualPetUnity pet;
    [SerializeField] private EmotionEngine emotionEngine;
    
    [Header("Particle Systems")]
    [SerializeField] private ParticleSystem feedParticles;
    [SerializeField] private ParticleSystem drinkParticles;
    [SerializeField] private ParticleSystem playParticles;
    [SerializeField] private ParticleSystem levelUpParticles;
    [SerializeField] private ParticleSystem questCompleteParticles;
    
    [Header("UI Animation")]
    [SerializeField] private RectTransform statPanel;
    [SerializeField] private Image moodDialImage;
    [SerializeField] private RectTransform questPopup;
    
    [Header("Animation Settings")]
    [SerializeField] private float popDuration = 0.3f;
    [SerializeField] private float popScale = 1.2f;
    [SerializeField] private float moodTransitionDuration = 0.5f;
    
    private EmotionEngine.EmotionState currentMoodState;
    
    void OnValidate() {
        if (pet == null) Debug.LogWarning("[VisualFeedbackManager] pet not assigned", this);
        if (emotionEngine == null) Debug.LogWarning("[VisualFeedbackManager] emotionEngine not assigned", this);
    }
    
    void Start() {
        // Subscribe to relevant events
        if (pet != null) {
            // Get references to managers if not set in inspector
            if (emotionEngine == null)
                emotionEngine = pet.GetComponent<EmotionEngine>();
                
            // Subscribe to events
            if (emotionEngine != null)
                emotionEngine.OnEmotionChanged.AddListener(PlayMoodTransition);
                
            // Find QuestManager and subscribe
            QuestManager questManager = pet.GetComponent<QuestManager>();
            if (questManager != null)
                questManager.OnQuestComplete.AddListener(PlayQuestCompleteEffect);
                
            // Find AffectionMeter and subscribe
            AffectionMeter affectionMeter = pet.GetComponent<AffectionMeter>();
            if (affectionMeter != null)
                affectionMeter.OnBondLevelUp.AddListener(PlayLevelUpEffect);
        }
    }
    
    /// <summary>
    /// Play feeding visual effects
    /// </summary>
    public void PlayFeedEffect() {
        if (feedParticles != null)
            feedParticles.Play();
            
        PunchScale(statPanel);
    }
    
    /// <summary>
    /// Play drinking visual effects
    /// </summary>
    public void PlayDrinkEffect() {
        if (drinkParticles != null)
            drinkParticles.Play();
            
        PunchScale(statPanel);
    }
    
    /// <summary>
    /// Play play activity visual effects
    /// </summary>
    public void PlayPlayEffect() {
        if (playParticles != null)
            playParticles.Play();
            
        PunchScale(statPanel);
    }
    
    /// <summary>
    /// Animate mood transitions
    /// </summary>
    public void PlayMoodTransition(EmotionEngine.EmotionState newState) {
        if (moodDialImage == null)
            return;
            
        // Don't animate if it's the same state
        if (newState == currentMoodState)
            return;
            
        currentMoodState = newState;
        
        // Animate mood dial transition
        moodDialImage.transform.DOScale(popScale, popDuration / 2f)
            .SetEase(Ease.OutQuad)
            .OnComplete(() => {
                moodDialImage.transform.DOScale(1f, popDuration / 2f)
                    .SetEase(Ease.InQuad);
                    
                // Color transition based on mood
                Color targetColor = GetMoodColor(newState);
                moodDialImage.DOColor(targetColor, moodTransitionDuration);
            });
    }
    
    /// <summary>
    /// Play level up visual effects
    /// </summary>
    public void PlayLevelUpEffect(int newLevel) {
        if (levelUpParticles != null)
            levelUpParticles.Play();
        
        // Animate bond UI
        Transform bondPanel = GameObject.Find("BondPanel")?.transform;
        if (bondPanel != null) {
            PunchScale(bondPanel.GetComponent<RectTransform>());
            
            // Highlight the new heart
            if (bondPanel.childCount >= newLevel) {
                Transform newHeart = bondPanel.GetChild(newLevel - 1);
                newHeart.DOScale(popScale * 1.5f, popDuration)
                    .SetEase(Ease.OutElastic)
                    .OnComplete(() => {
                        newHeart.DOScale(1f, popDuration)
                            .SetEase(Ease.OutElastic);
                    });
            }
        }
    }
    
    /// <summary>
    /// Play quest complete visual effects
    /// </summary>
    public void PlayQuestCompleteEffect() {
        if (questCompleteParticles != null)
            questCompleteParticles.Play();
            
        if (questPopup != null) {
            // Show and animate quest popup
            questPopup.gameObject.SetActive(true);
            questPopup.DOScale(0, 0); // Reset scale
            questPopup.DOScale(1, popDuration * 2f)
                .SetEase(Ease.OutElastic);
                
            // Hide after a few seconds
            StartCoroutine(HideAfterDelay(questPopup.gameObject, 3f));
        }
    }
    
    /// <summary>
    /// Get color for mood state
    /// </summary>
    private Color GetMoodColor(EmotionEngine.EmotionState state) {
        switch (state) {
            case EmotionEngine.EmotionState.Joy:
                return new Color(1f, 0.92f, 0.016f); // Yellow
            case EmotionEngine.EmotionState.Content:
                return new Color(0.56f, 0.93f, 0.56f); // Green
            case EmotionEngine.EmotionState.Sad:
                return new Color(0.31f, 0.31f, 0.94f); // Blue
            case EmotionEngine.EmotionState.Anxious:
                return new Color(0.94f, 0.42f, 0.27f); // Orange-red
            default:
                return Color.white;
        }
    }
    
    /// <summary>
    /// Helper method to punch scale a UI element
    /// </summary>
    private void PunchScale(RectTransform target) {
        if (target == null)
            return;
            
        target.DOPunchScale(Vector3.one * (popScale - 1f), popDuration, 1, 0.5f);
    }
    
    /// <summary>
    /// Helper coroutine to hide an object after delay
    /// </summary>
    private IEnumerator HideAfterDelay(GameObject obj, float delay) {
        yield return new WaitForSeconds(delay);
        
        // Fade out
        CanvasGroup group = obj.GetComponent<CanvasGroup>();
        if (group == null)
            group = obj.AddComponent<CanvasGroup>();
            
        group.DOFade(0, 0.5f).OnComplete(() => {
            obj.SetActive(false);
            group.alpha = 1f; // Reset for next time
        });
    }
}