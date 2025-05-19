using UnityEngine;
using UnityEngine.UI;
using DG.Tweening;
using System.Collections.Generic;

/// <summary>
/// Specialized animator for mood transitions in the UI
/// </summary>
public class MoodUIAnimator : MonoBehaviour {
    [System.Serializable]
    public class MoodAnimation {
        public EmotionEngine.EmotionState state;
        public AnimationClip enterClip;
        public AnimationClip idleClip;
        public Color moodColor = Color.white;
        [Range(0.1f, 2f)] public float transitionSpeed = 1f;
    }
    
    [Header("Components")]
    [SerializeField] private EmotionEngine emotionEngine;
    [SerializeField] private Image moodImage;
    [SerializeField] private Animator moodAnimator;
    
    [Header("Mood Animations")]
    [SerializeField] private List<MoodAnimation> moodAnimations = new List<MoodAnimation>();
    
    [Header("Effects")]
    [SerializeField] private ParticleSystem moodChangeParticles;
    [SerializeField] private Transform expressionBubble;
    [SerializeField] private float bubbleDuration = 3f;
    
    private EmotionEngine.EmotionState currentMood;
    private Sequence currentSequence;
    
    void OnValidate() {
        if (emotionEngine == null) Debug.LogWarning("[MoodUIAnimator] emotionEngine not assigned", this);
        if (moodImage == null) Debug.LogWarning("[MoodUIAnimator] moodImage not assigned", this);
    }
    
    void Start() {
        if (emotionEngine != null)
            emotionEngine.OnEmotionChanged.AddListener(TransitionToMood);
            
        // Hide expression bubble initially
        if (expressionBubble != null)
            expressionBubble.gameObject.SetActive(false);
    }
    
    /// <summary>
    /// Animate transition to new mood state
    /// </summary>
    public void TransitionToMood(EmotionEngine.EmotionState newMood) {
        // Skip if same mood
        if (newMood == currentMood)
            return;
            
        // Find mood animation data
        MoodAnimation anim = moodAnimations.Find(m => m.state == newMood);
        if (anim == null) {
            Debug.LogWarning($"[MoodUIAnimator] No animation data for mood: {newMood}");
            return;
        }
        
        // Kill previous animation if running
        if (currentSequence != null && currentSequence.IsActive())
            currentSequence.Kill();
            
        // Create new animation sequence
        currentSequence = DOTween.Sequence();
        
        // Add scale bounce
        currentSequence.Append(moodImage.transform.DOScale(0.8f, 0.2f).SetEase(Ease.OutQuad));
        currentSequence.Append(moodImage.transform.DOScale(1.2f, 0.2f).SetEase(Ease.OutQuad));
        currentSequence.Append(moodImage.transform.DOScale(1f, 0.2f).SetEase(Ease.OutElastic));
        
        // Color transition
        currentSequence.Join(moodImage.DOColor(anim.moodColor, 0.5f));
        
        // Play mood change particles
        if (moodChangeParticles != null) {
            ParticleSystem.MainModule main = moodChangeParticles.main;
            main.startColor = anim.moodColor;
            moodChangeParticles.Play();
        }
        
        // Set animator triggers if available
        if (moodAnimator != null && anim.enterClip != null) {
            string triggerName = anim.state.ToString();
            if (moodAnimator.parameters.Length > 0) {
                for (int i = 0; i < moodAnimator.parameters.Length; i++) {
                    if (moodAnimator.parameters[i].name == triggerName &&
                        moodAnimator.parameters[i].type == AnimatorControllerParameterType.Trigger) {
                        moodAnimator.SetTrigger(triggerName);
                        break;
                    }
                }
            }
        }
        
        // Show expression bubble with emoji
        ShowExpressionBubble(newMood);
        
        // Store current mood
        currentMood = newMood;
    }
    
    /// <summary>
    /// Show a temporary expression bubble with emoji for the mood
    /// </summary>
    private void ShowExpressionBubble(EmotionEngine.EmotionState mood) {
        if (expressionBubble == null)
            return;
            
        // Get emoji text based on mood
        string emoji = GetMoodEmoji(mood);
        Text emojiText = expressionBubble.GetComponentInChildren<Text>();
        if (emojiText != null)
            emojiText.text = emoji;
            
        // Show and animate bubble
        expressionBubble.gameObject.SetActive(true);
        expressionBubble.localScale = Vector3.zero;
        
        // Create animation sequence
        Sequence bubbleSequence = DOTween.Sequence();
        bubbleSequence.Append(expressionBubble.DOScale(1.2f, 0.3f).SetEase(Ease.OutBack));
        bubbleSequence.Append(expressionBubble.DOScale(1f, 0.2f));
        bubbleSequence.AppendInterval(bubbleDuration);
        bubbleSequence.Append(expressionBubble.DOScale(0f, 0.3f).SetEase(Ease.InBack));
        bubbleSequence.OnComplete(() => expressionBubble.gameObject.SetActive(false));
    }
    
    /// <summary>
    /// Get emoji representation of mood state
    /// </summary>
    private string GetMoodEmoji(EmotionEngine.EmotionState mood) {
        switch (mood) {
            case EmotionEngine.EmotionState.Joy:
                return "😄";
            case EmotionEngine.EmotionState.Content:
                return "😊";
            case EmotionEngine.EmotionState.Sad:
                return "😢";
            case EmotionEngine.EmotionState.Anxious:
                return "😰";
            default:
                return "❓";
        }
    }
    
    void OnDisable() {
        // Clean up any running tweens
        if (currentSequence != null && currentSequence.IsActive())
            currentSequence.Kill();
    }
}