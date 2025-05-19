using UnityEngine;
using System;
using System.Collections;
using System.Collections.Generic;

/// <summary>
/// Manages day/night cycle effects and time-based behaviors
/// </summary>
public class DayNightCycleManager : MonoBehaviour {
    [System.Serializable]
    public class TimeOfDaySettings {
        public string periodName;
        public float startHour;
        public float endHour;
        public Color lightColor = Color.white;
        [Range(0f, 1f)]
        public float lightIntensity = 1f;
        public Color ambientColor = Color.white;
        [Range(0f, 1f)]
        public float skyboxBlend = 0f;
        public string musicTrack;
        [TextArea(1, 3)]
        public string petBehavior;
    }
    
    [System.Serializable]
    public class ScheduledEvent {
        public string eventName;
        public float hour;
        public float minute;
        public bool repeatsDaily = true;
        public bool isEnabled = true;
        public UnityEngine.Events.UnityEvent onEventTriggered;
        public bool triggeredToday = false;
    }
    
    [Header("Time Settings")]
    [SerializeField] private bool useRealWorldTime = true;
    [SerializeField] private float gameTimeScale = 1f; // For accelerated time
    [SerializeField] private float startHour = 8f; // For manual time
    [SerializeField] private bool pauseAtNight = false;
    [SerializeField] private Vector2 sleepTimeRange = new Vector2(22f, 7f); // 10PM to 7AM
    
    [Header("Environment References")]
    [SerializeField] private Light mainLight;
    [SerializeField] private Material skyboxMaterial;
    [SerializeField] private Transform sunTransform;
    
    [Header("Time Periods")]
    [SerializeField] private List<TimeOfDaySettings> timePeriods = new List<TimeOfDaySettings>();
    
    [Header("Scheduled Events")]
    [SerializeField] private List<ScheduledEvent> scheduledEvents = new List<ScheduledEvent>();
    
    [Header("Pet References")]
    [SerializeField] private VirtualPetUnity pet;
    [SerializeField] private MicroAnimationController animationController;
    [SerializeField] private AudioManager audioManager;
    
    [Header("Debug")]
    [SerializeField] private bool showDebugTime = true;
    [SerializeField] private bool allowManualTimeChange = false;
    
    private float currentGameHour;
    private TimeOfDaySettings currentPeriod;
    private TimeOfDaySettings targetPeriod;
    private float transitionProgress = 1f;
    private bool isSleeping = false;
    private DateTime lastUpdateTime;
    
    void Start() {
        // Initialize time
        if (useRealWorldTime) {
            UpdateTimeFromRealWorld();
        } else {
            currentGameHour = startHour;
        }
        
        // Find initial period
        UpdateCurrentTimePeriod();
        
        // Apply initial lighting
        if (currentPeriod != null) {
            ApplyTimeOfDaySettings(currentPeriod);
        }
        
        // Initialize last update time
        lastUpdateTime = DateTime.Now;
        
        // Reset event triggers for the new day
        foreach (var evt in scheduledEvents) {
            evt.triggeredToday = false;
        }
        
        // Start update routine
        StartCoroutine(TimeUpdateRoutine());
    }
    
    /// <summary>
    /// Gets the current game hour (0-24)
    /// </summary>
    public float GetCurrentHour() {
        return currentGameHour;
    }
    
    /// <summary>
    /// Gets the current time period name
    /// </summary>
    public string GetCurrentTimePeriod() {
        return currentPeriod != null ? currentPeriod.periodName : "Unknown";
    }
    
    /// <summary>
    /// Checks if it's currently sleeping time
    /// </summary>
    public bool IsSleepTime() {
        if (sleepTimeRange.x < sleepTimeRange.y) {
            // Simple case: 22:00 - 06:00
            return currentGameHour >= sleepTimeRange.x || currentGameHour < sleepTimeRange.y;
        } else {
            // Wrapped case: 22:00 - 06:00
            return currentGameHour >= sleepTimeRange.x && currentGameHour < sleepTimeRange.y;
        }
    }
    
    /// <summary>
    /// Manually sets the current time
    /// </summary>
    public void SetTime(float hour) {
        if (!allowManualTimeChange && !Application.isEditor) {
            Debug.LogWarning("[DayNightCycle] Manual time change is disabled");
            return;
        }
        
        // Clamp to valid range
        hour = Mathf.Repeat(hour, 24f);
        currentGameHour = hour;
        
        // Update periods and settings
        UpdateCurrentTimePeriod();
        
        // Reset transition
        transitionProgress = 1f;
        
        // Apply settings immediately
        if (currentPeriod != null) {
            ApplyTimeOfDaySettings(currentPeriod);
        }
        
        // Check for events at this time
        CheckScheduledEvents();
    }
    
    /// <summary>
    /// Adds a new scheduled event
    /// </summary>
    public void AddScheduledEvent(string name, float hour, float minute, UnityEngine.Events.UnityEvent action) {
        ScheduledEvent newEvent = new ScheduledEvent {
            eventName = name,
            hour = hour,
            minute = minute,
            onEventTriggered = action,
            isEnabled = true,
            repeatsDaily = true
        };
        
        scheduledEvents.Add(newEvent);
    }
    
    /// <summary>
    /// Gets formatted time string (HH:MM)
    /// </summary>
    public string GetTimeString() {
        int hour = Mathf.FloorToInt(currentGameHour);
        int minute = Mathf.FloorToInt((currentGameHour - hour) * 60f);
        return $"{hour:00}:{minute:00}";
    }
    
    // Private implementation methods
    
    private IEnumerator TimeUpdateRoutine() {
        while (true) {
            // Update time based on real-world or game time
            if (useRealWorldTime) {
                UpdateTimeFromRealWorld();
            } else {
                // Advance game time
                if (!isSleeping || !pauseAtNight) {
                    float deltaTime = Time.deltaTime * gameTimeScale;
                    currentGameHour += deltaTime / 3600f; // Convert seconds to hours
                    currentGameHour = Mathf.Repeat(currentGameHour, 24f);
                }
            }
            
            // Check time period changes
            TimeOfDaySettings newPeriod = GetTimeOfDaySettings(currentGameHour);
            if (newPeriod != currentPeriod) {
                // Start transition to new period
                targetPeriod = newPeriod;
                transitionProgress = 0f;
                
                // Fire event for period change
                OnTimePeriodChanged(currentPeriod, targetPeriod);
            }
            
            // Handle transitions between time periods
            if (transitionProgress < 1f) {
                transitionProgress += Time.deltaTime * 0.5f; // 2 seconds transition
                transitionProgress = Mathf.Clamp01(transitionProgress);
                
                // Blend between current and target settings
                BlendTimeOfDaySettings(currentPeriod, targetPeriod, transitionProgress);
                
                // Update current period once transition is complete
                if (transitionProgress >= 1f) {
                    currentPeriod = targetPeriod;
                }
            }
            
            // Check sleeping state
            bool shouldSleep = IsSleepTime();
            if (shouldSleep != isSleeping) {
                isSleeping = shouldSleep;
                OnSleepStateChanged(isSleeping);
            }
            
            // Update sun rotation if available
            if (sunTransform != null) {
                float sunAngle = (currentGameHour / 24f) * 360f - 90f;
                sunTransform.rotation = Quaternion.Euler(sunAngle, 0f, 0f);
            }
            
            // Check for scheduled events
            CheckScheduledEvents();
            
            // Reset events at midnight
            if (useRealWorldTime) {
                DateTime now = DateTime.Now;
                if (now.Day != lastUpdateTime.Day) {
                    foreach (var evt in scheduledEvents) {
                        evt.triggeredToday = false;
                    }
                }
                lastUpdateTime = now;
            } else {
                float prevHour = Mathf.Repeat(currentGameHour - Time.deltaTime * gameTimeScale / 3600f, 24f);
                if (prevHour > 23f && currentGameHour < 1f) {
                    // Day changed
                    foreach (var evt in scheduledEvents) {
                        evt.triggeredToday = false;
                    }
                }
            }
            
            yield return null;
        }
    }
    
    private void UpdateTimeFromRealWorld() {
        DateTime now = DateTime.Now;
        currentGameHour = now.Hour + now.Minute / 60f + now.Second / 3600f;
    }
    
    private void UpdateCurrentTimePeriod() {
        currentPeriod = GetTimeOfDaySettings(currentGameHour);
    }
    
    private TimeOfDaySettings GetTimeOfDaySettings(float hour) {
        foreach (var period in timePeriods) {
            if (period.startHour < period.endHour) {
                // Simple case: period within same day (e.g. 8:00 - 17:00)
                if (hour >= period.startHour && hour < period.endHour) {
                    return period;
                }
            } else {
                // Wrapped case: period spans midnight (e.g. 22:00 - 6:00)
                if (hour >= period.startHour || hour < period.endHour) {
                    return period;
                }
            }
        }
        
        // Fallback to first period
        if (timePeriods.Count > 0) {
            return timePeriods[0];
        }
        
        return null;
    }
    
    private void ApplyTimeOfDaySettings(TimeOfDaySettings settings) {
        if (settings == null) return;
        
        // Apply light settings
        if (mainLight != null) {
            mainLight.color = settings.lightColor;
            mainLight.intensity = settings.lightIntensity;
        }
        
        // Apply ambient settings
        RenderSettings.ambientLight = settings.ambientColor;
        
        // Apply skybox settings
        if (skyboxMaterial != null) {
            skyboxMaterial.SetFloat("_Blend", settings.skyboxBlend);
        }
        
        // Apply audio settings
        if (audioManager != null && !string.IsNullOrEmpty(settings.musicTrack)) {
            audioManager.PlayMusic(settings.musicTrack, 2.0f);
        }
    }
    
    private void BlendTimeOfDaySettings(TimeOfDaySettings from, TimeOfDaySettings to, float t) {
        if (from == null || to == null) return;
        
        // Blend light settings
        if (mainLight != null) {
            mainLight.color = Color.Lerp(from.lightColor, to.lightColor, t);
            mainLight.intensity = Mathf.Lerp(from.lightIntensity, to.lightIntensity, t);
        }
        
        // Blend ambient settings
        RenderSettings.ambientLight = Color.Lerp(from.ambientColor, to.ambientColor, t);
        
        // Blend skybox settings
        if (skyboxMaterial != null) {
            skyboxMaterial.SetFloat("_Blend", Mathf.Lerp(from.skyboxBlend, to.skyboxBlend, t));
        }
    }
    
    private void CheckScheduledEvents() {
        foreach (var evt in scheduledEvents) {
            if (!evt.isEnabled || evt.triggeredToday) continue;
            
            // Convert event time to hours
            float eventTime = evt.hour + evt.minute / 60f;
            
            // Check if event should trigger (within 1 minute precision)
            float hourDiff = Mathf.Abs(currentGameHour - eventTime);
            if (hourDiff < 1f/60f) { // Within 1 minute
                TriggerScheduledEvent(evt);
            }
        }
    }
    
    private void TriggerScheduledEvent(ScheduledEvent evt) {
        Debug.Log($"[DayNightCycle] Triggering event: {evt.eventName}");
        
        // Invoke the event
        evt.onEventTriggered?.Invoke();
        
        // Mark as triggered for today
        if (evt.repeatsDaily) {
            evt.triggeredToday = true;
        } else {
            // One-time event, disable it
            evt.isEnabled = false;
        }
    }
    
    private void OnTimePeriodChanged(TimeOfDaySettings previous, TimeOfDaySettings current) {
        Debug.Log($"[DayNightCycle] Time period changed from {previous?.periodName} to {current?.periodName}");
        
        // Apply pet behavior changes
        if (pet != null && animationController != null && !string.IsNullOrEmpty(current?.petBehavior)) {
            animationController.PlayAnimation(current.petBehavior);
        }
    }
    
    private void OnSleepStateChanged(bool sleeping) {
        Debug.Log($"[DayNightCycle] Sleep state changed: {sleeping}");
        
        if (sleeping) {
            // Pet goes to sleep
            if (animationController != null) {
                animationController.PlayAnimation("Sleep");
            }
            
            // Play sleep music if any
            if (audioManager != null) {
                audioManager.PlayMusic("Lullaby", 3.0f);
            }
        } else {
            // Pet wakes up
            if (animationController != null) {
                animationController.PlayAnimation("WakeUp");
                
                // Health/Happiness bonus for sleeping through the night
                if (pet != null) {
                    pet.Happiness = Mathf.Min(pet.Happiness + 10f, 100f);
                    pet.Health = Mathf.Min(pet.Health + 5f, 100f);
                }
            }
        }
    }
    
    void OnGUI() {
        if (showDebugTime && Application.isEditor) {
            GUILayout.Label($"Time: {GetTimeString()} ({GetCurrentTimePeriod()})");
            
            if (allowManualTimeChange) {
                if (GUILayout.Button("+ 1 Hour")) {
                    SetTime(currentGameHour + 1f);
                }
                if (GUILayout.Button("+ 6 Hours")) {
                    SetTime(currentGameHour + 6f);
                }
            }
        }
    }
}