using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using UnityEngine.EventSystems;

/// <summary>
/// Provides satisfying touch-based interactions with the pet
/// </summary>
public class PhysicsInteractionSystem : MonoBehaviour, IPointerDownHandler, IPointerUpHandler, IDragHandler {
    [System.Serializable]
    public class PhysicsInteraction {
        public string interactionType;
        public GameObject interactionPrefab;
        public GameObject visualFeedback;
        public AudioClip sound;
        [Range(0f, 1f)]
        public float volume = 0.5f;
        public AnimationCurve responseScale = AnimationCurve.Linear(0, 0.8f, 1, 1.2f);
        public string petAnimation;
        public float happinessBoost = 1f;
        public float cooldownSeconds = 0.5f;
        public float minInteractionTime = 0.2f;
        [Range(0, 100)]
        public int requiredStreak = 0;
    }
    
    [System.Serializable]
    public class TouchableZone {
        public string zoneId;
        public string zoneName;
        public Collider zoneCollider;
        public Transform targetTransform;
        public string[] allowedInteractions;
        [Range(0f, 1f)]
        public float sensitivityMultiplier = 1f;
        public bool requirePreciseTouch = false;
        public float responseDelay = 0.1f;
        public List<string> responseSounds;
        public Vector2 movementRange = new Vector2(0.1f, 0.1f);
        public bool useSpringReturn = true;
        public float springStrength = 5f;
    }
    
    [Header("Interaction Settings")]
    [SerializeField] private List<PhysicsInteraction> interactions = new List<PhysicsInteraction>();
    [SerializeField] private List<TouchableZone> touchableZones = new List<TouchableZone>();
    
    [Header("Physics Settings")]
    [SerializeField] private float touchSensitivity = 1f;
    [SerializeField] private float dragSensitivity = 0.5f;
    [SerializeField] private Vector2 maxMovement = new Vector2(0.2f, 0.2f);
    [SerializeField] private AnimationCurve dragResistance = AnimationCurve.EaseInOut(0, 0, 1, 1);
    [SerializeField] private AnimationCurve returnCurve = AnimationCurve.EaseInOut(0, 0, 1, 1);
    [SerializeField] private float returnSpeed = 2.0f;
    
    [Header("Feedback Settings")]
    [SerializeField] private ParticleSystem touchParticles;
    [SerializeField] private GameObject touchRipple;
    [SerializeField] private float feedbackScale = 1f;
    [SerializeField] private float hapticFeedbackStrength = 0.5f;
    [SerializeField] private bool useHapticFeedback = true;
    
    [Header("Streak and Combo")]
    [SerializeField] private float streakResetTime = 1.5f;
    [SerializeField] private float streakMultiplierMax = 3.0f;
    [SerializeField] private int maxStreak = 10;
    
    [Header("References")]
    [SerializeField] private VirtualPetUnity pet;
    [SerializeField] private Camera arCamera;
    [SerializeField] private AudioManager audioManager;
    [SerializeField] private MicroAnimationController animationController;
    [SerializeField] private NotificationManager notificationManager;
    [SerializeField] private Transform petRoot;
    
    private Dictionary<string, float> lastInteractionTimes = new Dictionary<string, float>();
    private Dictionary<string, Vector3> originalPositions = new Dictionary<string, Vector3>();
    private Dictionary<string, Quaternion> originalRotations = new Dictionary<string, Quaternion>();
    private Dictionary<string, int> touchStreaks = new Dictionary<string, int>();
    private float lastTouchTime;
    private string currentTouchZone;
    private bool isDragging = false;
    private Transform draggedObject;
    private TouchableZone currentZone;
    private Vector3 dragStartPosition;
    private int currentStreak = 0;
    private float currentMultiplier = 1.0f;
    private Coroutine returnCoroutine;
    
    void Start() {
        // Store original positions and rotations
        if (petRoot != null) {
            StoreOriginalTransforms(petRoot);
        }
        
        // Initialize all touchable zones
        foreach (var zone in touchableZones) {
            if (zone.targetTransform != null) {
                originalPositions[zone.zoneId] = zone.targetTransform.localPosition;
                originalRotations[zone.zoneId] = zone.targetTransform.localRotation;
            }
            
            touchStreaks[zone.zoneId] = 0;
        }
        
        // Initialize camera
        if (arCamera == null) {
            arCamera = Camera.main;
        }
    }
    
    #region Touch Handlers
    
    public void OnPointerDown(PointerEventData eventData) {
        // Convert screen position to ray
        Ray ray = arCamera.ScreenPointToRay(eventData.position);
        RaycastHit hit;
        
        if (Physics.Raycast(ray, out hit)) {
            // Find which zone was touched
            TouchableZone touchedZone = FindTouchedZone(hit.collider);
            if (touchedZone != null) {
                OnZoneTouched(touchedZone, hit.point);
            }
        }
    }
    
    public void OnDrag(PointerEventData eventData) {
        if (!isDragging || draggedObject == null || currentZone == null) return;
        
        // Convert screen movement to world movement
        Vector3 pointerPos = eventData.position;
        Ray ray = arCamera.ScreenPointToRay(pointerPos);
        
        // Calculate movement plane (perpendicular to camera)
        Plane dragPlane = new Plane(-arCamera.transform.forward, dragStartPosition);
        float distanceToPlane;
        
        if (dragPlane.Raycast(ray, out distanceToPlane)) {
            Vector3 worldPos = ray.GetPoint(distanceToPlane);
            Vector3 delta = worldPos - dragStartPosition;
            
            // Apply sensitivity and resistance
            float dragDistance = delta.magnitude;
            float resistanceFactor = dragResistance.Evaluate(Mathf.Clamp01(dragDistance / (maxMovement.magnitude)));
            
            delta *= dragSensitivity * currentZone.sensitivityMultiplier * resistanceFactor;
            
            // Clamp to max movement
            delta.x = Mathf.Clamp(delta.x, -maxMovement.x, maxMovement.x);
            delta.y = Mathf.Clamp(delta.y, -maxMovement.y, maxMovement.y);
            
            // Apply movement to target
            if (currentZone.targetTransform != null) {
                Vector3 originalPos = originalPositions[currentZone.zoneId];
                currentZone.targetTransform.localPosition = originalPos + delta;
                
                // Apply slight rotation to make it feel more natural
                if (delta.magnitude > 0.01f) {
                    Quaternion originalRot = originalRotations[currentZone.zoneId];
                    Quaternion offsetRot = Quaternion.Euler(delta.y * 30f, -delta.x * 30f, 0);
                    currentZone.targetTransform.localRotation = originalRot * offsetRot;
                }
            }
            
            // Trigger ongoing interaction effects
            OnZoneDragged(currentZone, delta.magnitude);
        }
    }
    
    public void OnPointerUp(PointerEventData eventData) {
        // End drag if active
        if (isDragging && currentZone != null) {
            isDragging = false;
            
            // Start return animation if using spring return
            if (draggedObject != null && currentZone.useSpringReturn) {
                if (returnCoroutine != null) {
                    StopCoroutine(returnCoroutine);
                }
                returnCoroutine = StartCoroutine(ReturnToOriginalPosition(currentZone));
            }
            
            // Check for successful interaction
            float touchDuration = Time.time - lastTouchTime;
            if (touchDuration >= currentZone.responseDelay) {
                OnZoneInteractionComplete(currentZone, touchDuration);
            }
            
            draggedObject = null;
            currentZone = null;
        }
    }
    
    #endregion
    
    private TouchableZone FindTouchedZone(Collider hitCollider) {
        foreach (var zone in touchableZones) {
            if (zone.zoneCollider == hitCollider) {
                return zone;
            }
        }
        return null;
    }
    
    private void OnZoneTouched(TouchableZone zone, Vector3 worldPosition) {
        currentZone = zone;
        currentTouchZone = zone.zoneId;
        lastTouchTime = Time.time;
        
        // Start drag operation
        isDragging = true;
        draggedObject = zone.targetTransform;
        dragStartPosition = worldPosition;
        
        // Check for cooldown
        if (lastInteractionTimes.ContainsKey(zone.zoneId)) {
            float timeSinceLastTouch = Time.time - lastInteractionTimes[zone.zoneId];
            PhysicsInteraction interaction = GetPrimaryInteraction(zone);
            
            if (interaction != null && timeSinceLastTouch < interaction.cooldownSeconds) {
                // Still in cooldown, but start drag anyway
                return;
            }
        }
        
        // Update streak counter
        UpdateStreak(zone.zoneId);
        
        // Play immediate feedback
        PlayTouchFeedback(worldPosition);
        
        // Play zone's specific sound if available
        if (zone.responseSounds != null && zone.responseSounds.Count > 0) {
            string sound = zone.responseSounds[UnityEngine.Random.Range(0, zone.responseSounds.Count)];
            PlaySound(sound);
        }
        
        // Record interaction time
        lastInteractionTimes[zone.zoneId] = Time.time;
    }
    
    private void OnZoneDragged(TouchableZone zone, float intensity) {
        // Play continuous feedback based on drag intensity
        if (touchParticles != null && intensity > 0.05f) {
            var emission = touchParticles.emission;
            emission.rateOverTime = intensity * 20f;
            
            if (!touchParticles.isPlaying) {
                touchParticles.Play();
            }
            
            // Update particle position to follow drag
            if (draggedObject != null) {
                touchParticles.transform.position = draggedObject.position;
            }
        }
        
        // Apply haptic feedback based on intensity
        if (useHapticFeedback && intensity > 0.1f) {
            ApplyHapticFeedback(intensity * hapticFeedbackStrength);
        }
    }
    
    private void OnZoneInteractionComplete(TouchableZone zone, float duration) {
        // Get the interaction for this zone
        PhysicsInteraction interaction = GetInteractionForZone(zone, duration);
        if (interaction == null) return;
        
        // Apply interaction effects
        ApplyInteractionEffects(interaction, zone, duration);
        
        // Update streak
        if (currentStreak >= interaction.requiredStreak) {
            // Apply multiplier to happiness boost
            float boost = interaction.happinessBoost * currentMultiplier;
            if (pet != null) {
                pet.Happiness = Mathf.Min(pet.Happiness + boost, 100f);
            }
            
            // Show multiplier effect if significant
            if (currentMultiplier > 1.5f && notificationManager != null) {
                notificationManager.TriggerAlert($"{interaction.interactionType} x{currentMultiplier:F1}!");
            }
        }
        
        // Record interaction time
        lastInteractionTimes[zone.zoneId] = Time.time;
    }
    
    private PhysicsInteraction GetPrimaryInteraction(TouchableZone zone) {
        if (zone.allowedInteractions == null || zone.allowedInteractions.Length == 0) {
            return null;
        }
        
        string primaryInteractionType = zone.allowedInteractions[0];
        return interactions.Find(i => i.interactionType == primaryInteractionType);
    }
    
    private PhysicsInteraction GetInteractionForZone(TouchableZone zone, float duration) {
        if (zone.allowedInteractions == null || zone.allowedInteractions.Length == 0) {
            return null;
        }
        
        // Find all valid interactions for this zone
        List<PhysicsInteraction> validInteractions = new List<PhysicsInteraction>();
        
        foreach (string interactionType in zone.allowedInteractions) {
            PhysicsInteraction interaction = interactions.Find(i => i.interactionType == interactionType);
            if (interaction != null && duration >= interaction.minInteractionTime) {
                // Check streak requirement
                if (touchStreaks[zone.zoneId] >= interaction.requiredStreak) {
                    validInteractions.Add(interaction);
                }
            }
        }
        
        // Return the highest value interaction if multiple are valid
        if (validInteractions.Count > 0) {
            validInteractions.Sort((a, b) => b.happinessBoost.CompareTo(a.happinessBoost));
            return validInteractions[0];
        }
        
        return null;
    }
    
    private void ApplyInteractionEffects(PhysicsInteraction interaction, TouchableZone zone, float duration) {
        // Play interaction sound
        if (interaction.sound != null) {
            PlaySound(interaction.interactionType);
        }
        
        // Play pet animation
        if (!string.IsNullOrEmpty(interaction.petAnimation) && animationController != null) {
            animationController.PlayAnimation(interaction.petAnimation);
        }
        
        // Show visual feedback
        if (interaction.visualFeedback != null) {
            Vector3 feedbackPos = zone.targetTransform != null ? 
                zone.targetTransform.position : 
                petRoot.position + Vector3.up * 0.5f;
                
            GameObject feedback = Instantiate(interaction.visualFeedback, feedbackPos, Quaternion.identity);
            Destroy(feedback, 2f);
        }
    }
    
    private void UpdateStreak(string zoneId) {
        float timeSinceLastTouch = Time.time - lastTouchTime;
        
        if (timeSinceLastTouch <= streakResetTime) {
            // Continue streak
            currentStreak++;
            currentStreak = Mathf.Min(currentStreak, maxStreak);
            
            // Update multiplier (scales from 1.0 to max based on streak)
            currentMultiplier = 1.0f + (streakMultiplierMax - 1.0f) * (float)currentStreak / maxStreak;
        } else {
            // Reset streak
            currentStreak = 1;
            currentMultiplier = 1.0f;
        }
        
        // Update zone-specific streak
        touchStreaks[zoneId] = currentStreak;
    }
    
    private void PlayTouchFeedback(Vector3 worldPosition) {
        // Show touch particles
        if (touchParticles != null) {
            touchParticles.transform.position = worldPosition;
            touchParticles.Play();
        }
        
        // Show touch ripple
        if (touchRipple != null) {
            GameObject ripple = Instantiate(touchRipple, worldPosition, Quaternion.identity);
            ripple.transform.localScale = Vector3.one * feedbackScale;
            Destroy(ripple, 1f);
        }
        
        // Apply initial haptic feedback
        if (useHapticFeedback) {
            ApplyHapticFeedback(hapticFeedbackStrength);
        }
    }
    
    private void PlaySound(string soundName) {
        if (audioManager != null) {
            audioManager.Play(soundName);
        }
    }
    
    private void ApplyHapticFeedback(float strength) {
        #if UNITY_ANDROID || UNITY_IOS
        // On mobile, use haptic feedback if available
        if (strength < 0.33f) {
            #if UNITY_ANDROID
            // Light feedback
            AndroidJavaClass unityPlayer = new AndroidJavaClass("com.unity3d.player.UnityPlayer");
            AndroidJavaObject currentActivity = unityPlayer.GetStatic<AndroidJavaObject>("currentActivity");
            AndroidJavaObject vibrator = currentActivity.Call<AndroidJavaObject>("getSystemService", "vibrator");
            vibrator.Call("vibrate", 20);
            #elif UNITY_IOS
            // Light impact
            if (iOSHapticFeedback.IsSupported()) {
                iOSHapticFeedback.LightImpact();
            }
            #endif
        } else if (strength < 0.66f) {
            #if UNITY_ANDROID
            // Medium feedback
            AndroidJavaClass unityPlayer = new AndroidJavaClass("com.unity3d.player.UnityPlayer");
            AndroidJavaObject currentActivity = unityPlayer.GetStatic<AndroidJavaObject>("currentActivity");
            AndroidJavaObject vibrator = currentActivity.Call<AndroidJavaObject>("getSystemService", "vibrator");
            vibrator.Call("vibrate", 40);
            #elif UNITY_IOS
            // Medium impact
            if (iOSHapticFeedback.IsSupported()) {
                iOSHapticFeedback.MediumImpact();
            }
            #endif
        } else {
            #if UNITY_ANDROID
            // Strong feedback
            AndroidJavaClass unityPlayer = new AndroidJavaClass("com.unity3d.player.UnityPlayer");
            AndroidJavaObject currentActivity = unityPlayer.GetStatic<AndroidJavaObject>("currentActivity");
            AndroidJavaObject vibrator = currentActivity.Call<AndroidJavaObject>("getSystemService", "vibrator");
            vibrator.Call("vibrate", 80);
            #elif UNITY_IOS
            // Heavy impact
            if (iOSHapticFeedback.IsSupported()) {
                iOSHapticFeedback.HeavyImpact();
            }
            #endif
        }
        #endif
    }
    
    private void StoreOriginalTransforms(Transform root) {
        foreach (Transform child in root) {
            string id = child.name;
            originalPositions[id] = child.localPosition;
            originalRotations[id] = child.localRotation;
            
            // Recursively store children
            StoreOriginalTransforms(child);
        }
    }
    
    private IEnumerator ReturnToOriginalPosition(TouchableZone zone) {
        if (zone.targetTransform == null || !originalPositions.ContainsKey(zone.zoneId)) yield break;
        
        Vector3 startPos = zone.targetTransform.localPosition;
        Quaternion startRot = zone.targetTransform.localRotation;
        Vector3 targetPos = originalPositions[zone.zoneId];
        Quaternion targetRot = originalRotations[zone.zoneId];
        
        float time = 0f;
        float duration = Vector3.Distance(startPos, targetPos) * returnSpeed;
        duration = Mathf.Clamp(duration, 0.2f, 1.0f);
        
        while (time < duration) {
            float t = time / duration;
            float curve = returnCurve.Evaluate(t);
            
            zone.targetTransform.localPosition = Vector3.Lerp(startPos, targetPos, curve);
            zone.targetTransform.localRotation = Quaternion.Slerp(startRot, targetRot, curve);
            
            time += Time.deltaTime;
            yield return null;
        }
        
        // Ensure final position is exact
        zone.targetTransform.localPosition = targetPos;
        zone.targetTransform.localRotation = targetRot;
    }
}