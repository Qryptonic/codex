using UnityEngine;
using System.Collections;
using System.Collections.Generic;

/// <summary>
/// Handles micro-animations that give the pet character and personality
/// </summary>
public class MicroAnimationController : MonoBehaviour {
    [System.Serializable]
    public class MicroAnimation {
        public string name;
        public AnimationClip clip;
        [Range(0f, 1f)] public float randomChance = 0.2f;
        [Range(0f, 10f)] public float cooldownSeconds = 3f;
        [HideInInspector] public float lastPlayTime = -1000f;
    }
    
    [Header("Animation References")]
    [SerializeField] private Animator animator;
    [SerializeField] private List<MicroAnimation> microAnimations = new List<MicroAnimation>();
    
    [Header("Idle Behavior")]
    [SerializeField] private float idleCheckInterval = 5f;
    [SerializeField] private bool playRandomIdleAnimations = true;
    
    private bool isPlayingAnimation = false;
    private Coroutine idleCoroutine;
    
    void OnValidate() {
        if (animator == null)
            Debug.LogWarning("[MicroAnimationController] animator not assigned", this);
    }
    
    void Start() {
        if (animator == null)
            animator = GetComponentInChildren<Animator>();
            
        if (playRandomIdleAnimations && idleCoroutine == null)
            idleCoroutine = StartCoroutine(IdleAnimationCheck());
    }
    
    /// <summary>
    /// Play a named animation
    /// </summary>
    public void PlayAnimation(string animName) {
        if (animator == null)
            return;
            
        // Find the animation by name
        MicroAnimation anim = microAnimations.Find(a => a.name == animName);
        if (anim == null) {
            Debug.LogWarning($"[MicroAnimationController] Animation '{animName}' not found", this);
            return;
        }
        
        // Check cooldown
        if (Time.time - anim.lastPlayTime < anim.cooldownSeconds)
            return;
            
        // Play the animation
        PlayAnimationInternal(anim);
    }
    
    /// <summary>
    /// Play a random animation based on weighted chance
    /// </summary>
    public void PlayRandomAnimation() {
        if (animator == null || isPlayingAnimation)
            return;
            
        List<MicroAnimation> available = microAnimations.FindAll(
            a => Time.time - a.lastPlayTime >= a.cooldownSeconds
        );
        
        if (available.Count == 0)
            return;
            
        // Check random chance for each available animation
        foreach (MicroAnimation anim in available) {
            if (Random.value <= anim.randomChance) {
                PlayAnimationInternal(anim);
                break;
            }
        }
    }
    
    private void PlayAnimationInternal(MicroAnimation anim) {
        if (isPlayingAnimation)
            return;
            
        anim.lastPlayTime = Time.time;
        
        if (anim.clip != null) {
            // Use override controller if using clip directly
            AnimatorOverrideController overrideController = new AnimatorOverrideController(animator.runtimeAnimatorController);
            overrideController["MicroAnimation"] = anim.clip;
            animator.runtimeAnimatorController = overrideController;
            
            StartCoroutine(PlayMicroAnimation(anim.clip.length));
        } else {
            // Trigger the animation by name
            animator.SetTrigger(anim.name);
            
            // Get clip length from animator
            AnimatorClipInfo[] clipInfo = animator.GetCurrentAnimatorClipInfo(0);
            float clipLength = clipInfo.Length > 0 ? clipInfo[0].clip.length : 1f;
            
            StartCoroutine(PlayMicroAnimation(clipLength));
        }
    }
    
    private IEnumerator PlayMicroAnimation(float duration) {
        isPlayingAnimation = true;
        yield return new WaitForSeconds(duration);
        isPlayingAnimation = false;
    }
    
    private IEnumerator IdleAnimationCheck() {
        while (true) {
            yield return new WaitForSeconds(idleCheckInterval);
            
            if (!isPlayingAnimation) {
                PlayRandomAnimation();
            }
        }
    }
    
    void OnDisable() {
        if (idleCoroutine != null) {
            StopCoroutine(idleCoroutine);
            idleCoroutine = null;
        }
    }
}