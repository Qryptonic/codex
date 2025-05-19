using UnityEngine;
using UnityEngine.UI;
using DG.Tweening;

/// <summary>
/// Animates UI stat changes to provide visual feedback
/// </summary>
public class StatUIAnimator : MonoBehaviour {
    [Header("References")]
    [SerializeField] private VirtualPetUnity pet;
    [SerializeField] private Text hungerText;
    [SerializeField] private Text thirstText;
    [SerializeField] private Text happinessText;
    [SerializeField] private Text healthText;
    
    [Header("Health Bar")]
    [SerializeField] private Image healthBar;
    [SerializeField] private Image hungerBar;
    [SerializeField] private Image thirstBar;
    [SerializeField] private Image happinessBar;
    
    [Header("Animation Settings")]
    [SerializeField] private float barAnimDuration = 0.5f;
    [SerializeField] private float textAnimDuration = 0.3f;
    [SerializeField] private float highValueFlashThreshold = 80f;
    [SerializeField] private float lowValueFlashThreshold = 20f;
    
    // Track previous values to detect changes
    private float prevHunger;
    private float prevThirst;
    private float prevHappiness;
    private float prevHealth;
    
    // Active tweens
    private Tween hungerTween;
    private Tween thirstTween;
    private Tween happinessTween;
    private Tween healthTween;
    
    void OnValidate() {
        if (pet == null) Debug.LogWarning("[StatUIAnimator] pet not assigned", this);
    }
    
    void Start() {
        // Initialize previous values
        if (pet != null) {
            prevHunger = pet.Hunger;
            prevThirst = pet.Thirst;
            prevHappiness = pet.Happiness;
            prevHealth = pet.Health;
        }
        
        // Initial update without animation
        UpdateStatBars(true);
    }
    
    void Update() {
        if (pet == null)
            return;
            
        // Check for value changes
        if (prevHunger != pet.Hunger || 
            prevThirst != pet.Thirst || 
            prevHappiness != pet.Happiness || 
            prevHealth != pet.Health) {
            
            UpdateStatBars(false);
            
            // Store current values
            prevHunger = pet.Hunger;
            prevThirst = pet.Thirst;
            prevHappiness = pet.Happiness;
            prevHealth = pet.Health;
        }
        
        // Check for warning states
        CheckWarningStates();
    }
    
    /// <summary>
    /// Update all stat bars with optional animation
    /// </summary>
    private void UpdateStatBars(bool instant) {
        float duration = instant ? 0f : barAnimDuration;
        
        // Update bars
        if (hungerBar != null) {
            // Kill existing tween if running
            if (hungerTween != null && hungerTween.IsActive())
                hungerTween.Kill();
                
            // Create new tween
            hungerTween = hungerBar.DOFillAmount(pet.Hunger / 100f, duration)
                .SetEase(Ease.OutQuad);
        }
        
        if (thirstBar != null) {
            if (thirstTween != null && thirstTween.IsActive())
                thirstTween.Kill();
                
            thirstTween = thirstBar.DOFillAmount(pet.Thirst / 100f, duration)
                .SetEase(Ease.OutQuad);
        }
        
        if (happinessBar != null) {
            if (happinessTween != null && happinessTween.IsActive())
                happinessTween.Kill();
                
            happinessTween = happinessBar.DOFillAmount(pet.Happiness / 100f, duration)
                .SetEase(Ease.OutQuad);
        }
        
        if (healthBar != null) {
            if (healthTween != null && healthTween.IsActive())
                healthTween.Kill();
                
            healthTween = healthBar.DOFillAmount(pet.Health / 100f, duration)
                .SetEase(Ease.OutQuad);
        }
        
        // Update text
        UpdateStatText(instant);
    }
    
    /// <summary>
    /// Update stat text with number pop effect
    /// </summary>
    private void UpdateStatText(bool instant) {
        float duration = instant ? 0f : textAnimDuration;
        
        if (hungerText != null) {
            hungerText.text = $"Hunger: {pet.Hunger:0}";
            if (!instant) AnimateTextPop(hungerText.transform);
        }
        
        if (thirstText != null) {
            thirstText.text = $"Thirst: {pet.Thirst:0}";
            if (!instant) AnimateTextPop(thirstText.transform);
        }
        
        if (happinessText != null) {
            happinessText.text = $"Happiness: {pet.Happiness:0}";
            if (!instant) AnimateTextPop(happinessText.transform);
        }
        
        if (healthText != null) {
            healthText.text = $"Health: {pet.Health:0}";
            if (!instant) AnimateTextPop(healthText.transform);
        }
    }
    
    /// <summary>
    /// Create a pop effect for text changes
    /// </summary>
    private void AnimateTextPop(Transform textTransform) {
        // Scale pop animation
        Sequence popSequence = DOTween.Sequence();
        popSequence.Append(textTransform.DOScale(1.2f, textAnimDuration / 2f).SetEase(Ease.OutQuad));
        popSequence.Append(textTransform.DOScale(1f, textAnimDuration / 2f).SetEase(Ease.InQuad));
    }
    
    /// <summary>
    /// Check for warning states and animate accordingly
    /// </summary>
    private void CheckWarningStates() {
        // Hunger warning
        if (hungerBar != null) {
            if (pet.Hunger >= highValueFlashThreshold)
                FlashWarning(hungerBar, new Color(0.9f, 0.1f, 0.1f)); // Red for high hunger
        }
        
        // Thirst warning
        if (thirstBar != null) {
            if (pet.Thirst >= highValueFlashThreshold)
                FlashWarning(thirstBar, new Color(0.1f, 0.4f, 0.9f)); // Blue for high thirst
        }
        
        // Happiness warning
        if (happinessBar != null) {
            if (pet.Happiness <= lowValueFlashThreshold)
                FlashWarning(happinessBar, new Color(0.9f, 0.4f, 0.1f)); // Orange for low happiness
        }
        
        // Health warning
        if (healthBar != null) {
            if (pet.Health <= lowValueFlashThreshold)
                FlashWarning(healthBar, Color.red); // Red for low health
        }
    }
    
    /// <summary>
    /// Create flash effect for warning states
    /// </summary>
    private void FlashWarning(Image bar, Color warningColor) {
        // Only flash every few seconds
        if (Time.time % 2f < 1f) {
            bar.DOColor(warningColor, 0.5f).SetLoops(2, LoopType.Yoyo);
        }
    }
    
    /// <summary>
    /// Animate a big stat change (e.g., from button press)
    /// </summary>
    public void AnimateStatChange(string statType, float oldValue, float newValue) {
        Image targetBar = null;
        Text targetText = null;
        Color flashColor = Color.white;
        
        // Determine which stat changed
        switch (statType.ToLower()) {
            case "hunger":
                targetBar = hungerBar;
                targetText = hungerText;
                flashColor = (oldValue > newValue) ? Color.green : Color.red;
                break;
            case "thirst":
                targetBar = thirstBar;
                targetText = thirstText;
                flashColor = (oldValue > newValue) ? Color.cyan : Color.blue;
                break;
            case "happiness":
                targetBar = happinessBar;
                targetText = happinessText;
                flashColor = (oldValue < newValue) ? Color.yellow : Color.grey;
                break;
            case "health":
                targetBar = healthBar;
                targetText = healthText;
                flashColor = (oldValue < newValue) ? Color.green : Color.red;
                break;
        }
        
        // Animate bar with flash
        if (targetBar != null) {
            Sequence barSequence = DOTween.Sequence();
            barSequence.Append(targetBar.DOColor(flashColor, 0.2f));
            barSequence.Append(targetBar.DOFillAmount(newValue / 100f, barAnimDuration).SetEase(Ease.OutQuad));
            barSequence.Append(targetBar.DOColor(targetBar.color, 0.2f));
        }
        
        // Animate text with bigger pop
        if (targetText != null) {
            Sequence textSequence = DOTween.Sequence();
            textSequence.Append(targetText.transform.DOScale(1.5f, textAnimDuration / 2f).SetEase(Ease.OutBack));
            textSequence.Join(targetText.DOColor(flashColor, textAnimDuration / 2f));
            textSequence.Append(targetText.transform.DOScale(1f, textAnimDuration / 2f).SetEase(Ease.InBack));
            textSequence.Join(targetText.DOColor(targetText.color, textAnimDuration / 2f));
        }
    }
    
    void OnDisable() {
        // Kill any active tweens
        DOTween.Kill(hungerBar);
        DOTween.Kill(thirstBar);
        DOTween.Kill(happinessBar);
        DOTween.Kill(healthBar);
        DOTween.Kill(hungerText.transform);
        DOTween.Kill(thirstText.transform);
        DOTween.Kill(happinessText.transform);
        DOTween.Kill(healthText.transform);
    }
}