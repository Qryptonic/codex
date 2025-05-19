using UnityEngine;
using System.Collections;
using System.Collections.Generic;

/// <summary>
/// Manages particles and effects for pet interactions
/// </summary>
public class InteractionEffectController : MonoBehaviour {
    [System.Serializable]
    public class InteractionEffect {
        public string actionType;
        public ParticleSystem particles;
        public AudioClip sound;
        [Range(0f, 1f)] public float volume = 0.5f;
        public AnimationClip petAnimation;
        public Vector3 particleOffset = Vector3.up * 0.5f;
    }
    
    [Header("VFX References")]
    [SerializeField] private VirtualPetUnity pet;
    [SerializeField] private Transform petTransform;
    [SerializeField] private AudioSource audioSource;
    [SerializeField] private Animator petAnimator;
    
    [Header("Effects")]
    [SerializeField] private List<InteractionEffect> interactionEffects = new List<InteractionEffect>();
    
    [Header("Global Settings")]
    [SerializeField] private float effectScale = 1f;
    [SerializeField] private float effectDuration = 1.5f;
    
    private Dictionary<string, GameObject> effectObjects = new Dictionary<string, GameObject>();
    
    void OnValidate() {
        if (pet == null) Debug.LogWarning("[InteractionEffectController] pet not assigned", this);
        if (petTransform == null) Debug.LogWarning("[InteractionEffectController] petTransform not assigned", this);
        
        if (audioSource == null)
            audioSource = GetComponent<AudioSource>();
    }
    
    void Start() {
        if (audioSource == null)
            audioSource = gameObject.AddComponent<AudioSource>();
            
        // Create and prepare particle systems
        foreach (var effect in interactionEffects) {
            if (effect.particles != null) {
                GameObject effectObj = Instantiate(new GameObject($"{effect.actionType}Effect"), transform);
                effectObj.transform.localPosition = Vector3.zero;
                effectObj.SetActive(false);
                
                ParticleSystem particleSystem = Instantiate(effect.particles, effectObj.transform);
                effectObjects[effect.actionType] = effectObj;
            }
        }
        
        // Hook up event listeners
        VisualFeedbackManager feedbackManager = FindObjectOfType<VisualFeedbackManager>();
        if (feedbackManager != null) {
            // These are already connected
        } else {
            // Direct connection to feed/drink/play actions
            HookUpFeedbackEvents();
        }
    }
    
    /// <summary>
    /// Play effects for feeding interaction
    /// </summary>
    public void PlayFeedEffect() {
        PlayEffect("Feed");
    }
    
    /// <summary>
    /// Play effects for drinking interaction
    /// </summary>
    public void PlayDrinkEffect() {
        PlayEffect("Drink");
    }
    
    /// <summary>
    /// Play effects for play interaction
    /// </summary>
    public void PlayPlayEffect() {
        PlayEffect("Play");
    }
    
    /// <summary>
    /// Play interaction effect by name
    /// </summary>
    public void PlayEffect(string actionType) {
        // Find effect data
        InteractionEffect effect = interactionEffects.Find(e => e.actionType == actionType);
        if (effect == null) {
            Debug.LogWarning($"[InteractionEffectController] No effect defined for: {actionType}");
            return;
        }
        
        // Play particle effect
        if (effectObjects.TryGetValue(actionType, out GameObject effectObj)) {
            effectObj.transform.position = petTransform.position + effect.particleOffset;
            effectObj.transform.rotation = Quaternion.identity;
            effectObj.transform.localScale = Vector3.one * effectScale;
            
            effectObj.SetActive(true);
            ParticleSystem particles = effectObj.GetComponentInChildren<ParticleSystem>();
            if (particles != null) {
                particles.Play();
                StartCoroutine(DeactivateAfterPlay(effectObj, effectDuration));
            }
        }
        
        // Play sound
        if (effect.sound != null && audioSource != null) {
            audioSource.PlayOneShot(effect.sound, effect.volume);
        }
        
        // Play pet animation
        if (effect.petAnimation != null && petAnimator != null) {
            string triggerName = actionType;
            petAnimator.SetTrigger(triggerName);
        }
    }
    
    /// <summary>
    /// Hook up feedback events to pet actions if no VisualFeedbackManager exists
    /// </summary>
    private void HookUpFeedbackEvents() {
        // Add listeners for common UI buttons
        Button[] buttons = FindObjectsOfType<Button>();
        foreach (Button button in buttons) {
            string buttonName = button.name.ToLower();
            
            if (buttonName.Contains("feed")) {
                button.onClick.AddListener(PlayFeedEffect);
            } else if (buttonName.Contains("drink") || buttonName.Contains("water")) {
                button.onClick.AddListener(PlayDrinkEffect);
            } else if (buttonName.Contains("play")) {
                button.onClick.AddListener(PlayPlayEffect);
            }
        }
        
        // Alternative method: create method pointers to feed/drink/play via reflection
        /*
        System.Type petType = pet.GetType();
        MethodInfo feedMethod = petType.GetMethod("Feed");
        if (feedMethod != null) {
            // Use reflection to add our effect after the original method
        }
        */
    }
    
    /// <summary>
    /// Helper to deactivate game object after effect completes
    /// </summary>
    private IEnumerator DeactivateAfterPlay(GameObject obj, float delay) {
        yield return new WaitForSeconds(delay);
        obj.SetActive(false);
    }
    
    /// <summary>
    /// Add a new interaction effect at runtime
    /// </summary>
    public void AddInteractionEffect(InteractionEffect effect) {
        if (effect == null || string.IsNullOrEmpty(effect.actionType))
            return;
            
        // Replace if action type already exists
        for (int i = 0; i < interactionEffects.Count; i++) {
            if (interactionEffects[i].actionType == effect.actionType) {
                interactionEffects[i] = effect;
                
                // Also update particle system if needed
                if (effectObjects.TryGetValue(effect.actionType, out GameObject effectObj)) {
                    // Update or recreate particle system
                    if (effect.particles != null) {
                        foreach (Transform child in effectObj.transform) {
                            Destroy(child.gameObject);
                        }
                        Instantiate(effect.particles, effectObj.transform);
                    }
                }
                return;
            }
        }
        
        // Otherwise add new
        interactionEffects.Add(effect);
        
        // Create particle system if needed
        if (effect.particles != null) {
            GameObject effectObj = Instantiate(new GameObject($"{effect.actionType}Effect"), transform);
            effectObj.transform.localPosition = Vector3.zero;
            effectObj.SetActive(false);
            
            Instantiate(effect.particles, effectObj.transform);
            effectObjects[effect.actionType] = effectObj;
        }
    }
}