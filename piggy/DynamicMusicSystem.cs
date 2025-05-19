using UnityEngine;
using UnityEngine.Audio;
using System.Collections;
using System.Collections.Generic;

/// <summary>
/// Manages dynamic, adaptive music that responds to pet mood and activities
/// </summary>
public class DynamicMusicSystem : MonoBehaviour {
    [System.Serializable]
    public class MusicLayer {
        public string layerId;
        public AudioClip clip;
        public string description;
        [Range(0f, 1f)]
        public float defaultVolume = 1.0f;
        public bool playByDefault = false;
        public bool looping = true;
        [Range(0f, 1f)]
        public float spatialBlend = 0f;
        public bool reactsToMood = false;
        public bool reactsToTime = false;
        public bool reactsToActivity = false;
        public AnimationCurve moodInfluence = AnimationCurve.Linear(0f, 0f, 100f, 1f);
        public AudioMixerGroup mixerGroup;
    }
    
    [System.Serializable]
    public class MusicStem {
        public string stemId;
        public AudioClip clip;
        public StemCategory category;
        [Range(0f, 1f)]
        public float defaultVolume = 1.0f;
        public bool looping = true;
        
        public enum StemCategory {
            Bass,
            Melody,
            Percussion,
            Ambient,
            Effects
        }
    }
    
    [System.Serializable]
    public class MusicSet {
        public string setId;
        public string displayName;
        public MoodMapping moodMapping;
        public List<MusicStem> stems = new List<MusicStem>();
        public float bpm = 120f;
        public float transitionTime = 1.0f;
    }
    
    [System.Serializable]
    public class MoodMapping {
        public string happySetId;
        public string calmSetId;
        public string sadSetId;
        public string excitedSetId;
        public string sleepySetId;
    }
    
    [Header("Music Configuration")]
    [SerializeField] private List<MusicLayer> musicLayers = new List<MusicLayer>();
    [SerializeField] private List<MusicSet> musicSets = new List<MusicSet>();
    [SerializeField] private MoodMapping mainMoodMapping = new MoodMapping();
    
    [Header("Playback Settings")]
    [SerializeField] private float crossfadeDuration = 2.0f;
    [SerializeField] private float moodChangeThreshold = 20f;
    [SerializeField] private float activityDetectionTime = 10f;
    [SerializeField] private float moodCheckInterval = 5f;
    [SerializeField] private bool continuousMoodAdaptation = true;
    [SerializeField] private AudioMixerGroup masterMixerGroup;
    
    [Header("Custom Lullabies")]
    [SerializeField] private bool enableCustomLullabies = true;
    [SerializeField] private List<AudioClip> lullabies = new List<AudioClip>();
    [SerializeField] private float lullabyVolume = 0.7f;
    [SerializeField] private float lullabyResponseDelay = 1.0f;
    
    [Header("References")]
    [SerializeField] private VirtualPetUnity pet;
    [SerializeField] private EmotionEngine emotionEngine;
    [SerializeField] private DayNightCycleManager dayNightManager;
    
    private Dictionary<string, AudioSource> layerSources = new Dictionary<string, AudioSource>();
    private Dictionary<string, AudioSource> stemSources = new Dictionary<string, AudioSource>();
    private string currentMusicSetId = "";
    private EmotionEngine.EmotionState lastEmotionState;
    private float lastMoodChangeTime;
    private float lastActivityTime;
    private bool isPlayingLullaby = false;
    private Coroutine moodAdaptationCoroutine;
    private Coroutine lullabyCoroutine;
    
    void Start() {
        // Create AudioSources for each layer
        foreach (var layer in musicLayers) {
            AudioSource source = gameObject.AddComponent<AudioSource>();
            source.clip = layer.clip;
            source.loop = layer.looping;
            source.volume = 0f; // Start silent
            source.spatialBlend = layer.spatialBlend;
            source.playOnAwake = false;
            if (layer.mixerGroup != null) {
                source.outputAudioMixerGroup = layer.mixerGroup;
            } else if (masterMixerGroup != null) {
                source.outputAudioMixerGroup = masterMixerGroup;
            }
            
            layerSources[layer.layerId] = source;
            
            // Play default layers
            if (layer.playByDefault) {
                source.volume = 0f; // Will fade in
                source.Play();
                StartCoroutine(FadeAudioSource(source, layer.defaultVolume, crossfadeDuration));
            }
        }
        
        // Subscribe to events
        if (emotionEngine != null) {
            emotionEngine.OnEmotionChanged.AddListener(OnMoodChanged);
        }
        
        // Start mood adaptation
        if (continuousMoodAdaptation) {
            moodAdaptationCoroutine = StartCoroutine(ContinuousMoodAdaptation());
        }
        
        // Start with appropriate music set
        UpdateMusicBasedOnMood();
    }
    
    /// <summary>
    /// Play a specific music set by ID
    /// </summary>
    public void PlayMusicSet(string setId, float fadeTime = 2.0f) {
        MusicSet set = musicSets.Find(s => s.setId == setId);
        if (set == null) {
            Debug.LogWarning($"[DynamicMusic] Music set not found: {setId}");
            return;
        }
        
        // Stop current set stems
        StopCurrentStemSources(fadeTime);
        
        // Create new sources for stems
        foreach (var stem in set.stems) {
            AudioSource source = gameObject.AddComponent<AudioSource>();
            source.clip = stem.clip;
            source.loop = stem.looping;
            source.volume = 0f; // Start silent
            source.playOnAwake = false;
            if (masterMixerGroup != null) {
                source.outputAudioMixerGroup = masterMixerGroup;
            }
            
            // Generate unique ID for this stem source
            string stemSourceId = $"{setId}_{stem.stemId}";
            stemSources[stemSourceId] = source;
            
            // Start playing and fade in
            source.Play();
            StartCoroutine(FadeAudioSource(source, stem.defaultVolume, fadeTime));
        }
        
        currentMusicSetId = setId;
        Debug.Log($"[DynamicMusic] Playing music set: {set.displayName}");
    }
    
    /// <summary>
    /// Enable or disable a specific music layer
    /// </summary>
    public void SetLayerActive(string layerId, bool active, float fadeTime = 1.0f) {
        if (!layerSources.ContainsKey(layerId)) {
            Debug.LogWarning($"[DynamicMusic] Layer not found: {layerId}");
            return;
        }
        
        AudioSource source = layerSources[layerId];
        MusicLayer layer = musicLayers.Find(l => l.layerId == layerId);
        
        if (active) {
            // Enable layer
            if (!source.isPlaying) {
                source.Play();
            }
            StartCoroutine(FadeAudioSource(source, layer.defaultVolume, fadeTime));
        } else {
            // Disable layer
            StartCoroutine(FadeOutAndStop(source, fadeTime));
        }
    }
    
    /// <summary>
    /// Play a lullaby for the pet
    /// </summary>
    public void PlayLullaby(int index = -1) {
        if (!enableCustomLullabies || lullabies.Count == 0) return;
        
        StopLullaby();
        
        lullabyCoroutine = StartCoroutine(PlayLullabyRoutine(index));
    }
    
    /// <summary>
    /// Stop the currently playing lullaby
    /// </summary>
    public void StopLullaby() {
        if (lullabyCoroutine != null) {
            StopCoroutine(lullabyCoroutine);
        }
        
        isPlayingLullaby = false;
    }
    
    /// <summary>
    /// Record pet activity for activity-based music adaptation
    /// </summary>
    public void RecordActivity() {
        lastActivityTime = Time.time;
        
        // Boost activity-reactive layers
        foreach (var layer in musicLayers) {
            if (layer.reactsToActivity && layerSources.ContainsKey(layer.layerId)) {
                AudioSource source = layerSources[layer.layerId];
                if (!source.isPlaying) {
                    source.Play();
                }
                
                // Temporarily boost volume
                float targetVolume = layer.defaultVolume * 1.5f;
                StartCoroutine(BoostAndReturnVolume(source, targetVolume, 0.5f, 5f));
            }
        }
    }
    
    // Private implementation methods
    
    private void OnMoodChanged(EmotionEngine.EmotionState newState) {
        if (newState != lastEmotionState) {
            lastEmotionState = newState;
            lastMoodChangeTime = Time.time;
            
            // Update music based on mood
            UpdateMusicBasedOnMood();
        }
    }
    
    private void UpdateMusicBasedOnMood() {
        if (pet == null) return;
        
        // Determine appropriate music set based on mood
        string targetSetId = "";
        
        if (emotionEngine != null) {
            switch (lastEmotionState) {
                case EmotionEngine.EmotionState.Joy:
                    targetSetId = mainMoodMapping.happySetId;
                    break;
                case EmotionEngine.EmotionState.Content:
                    targetSetId = mainMoodMapping.calmSetId;
                    break;
                case EmotionEngine.EmotionState.Sad:
                    targetSetId = mainMoodMapping.sadSetId;
                    break;
                case EmotionEngine.EmotionState.Anxious:
                    targetSetId = mainMoodMapping.excitedSetId;
                    break;
            }
        } else {
            // Fallback to happiness value
            if (pet.Happiness >= 80f) {
                targetSetId = mainMoodMapping.happySetId;
            } else if (pet.Happiness >= 50f) {
                targetSetId = mainMoodMapping.calmSetId;
            } else if (pet.Happiness >= 20f) {
                targetSetId = mainMoodMapping.sadSetId;
            } else {
                targetSetId = mainMoodMapping.sadSetId;
            }
        }
        
        // Check time of day
        bool isNight = false;
        if (dayNightManager != null) {
            float hour = dayNightManager.GetCurrentHour();
            isNight = hour < 6f || hour > 20f;
        }
        
        if (isNight && !string.IsNullOrEmpty(mainMoodMapping.sleepySetId)) {
            targetSetId = mainMoodMapping.sleepySetId;
        }
        
        // Play target set if different from current
        if (!string.IsNullOrEmpty(targetSetId) && targetSetId != currentMusicSetId) {
            PlayMusicSet(targetSetId, crossfadeDuration);
        }
        
        // Also update mood-reactive layers
        UpdateMoodReactiveLayers();
    }
    
    private void UpdateMoodReactiveLayers() {
        if (pet == null) return;
        
        foreach (var layer in musicLayers) {
            if (layer.reactsToMood && layerSources.ContainsKey(layer.layerId)) {
                AudioSource source = layerSources[layer.layerId];
                
                // Calculate volume based on mood
                float moodFactor = layer.moodInfluence.Evaluate(pet.Happiness / 100f);
                float targetVolume = layer.defaultVolume * moodFactor;
                
                // Crossfade to target volume
                StartCoroutine(FadeAudioSource(source, targetVolume, crossfadeDuration));
                
                // Ensure playing if needed
                if (moodFactor > 0.05f && !source.isPlaying) {
                    source.Play();
                }
            }
        }
    }
    
    private IEnumerator ContinuousMoodAdaptation() {
        while (true) {
            yield return new WaitForSeconds(moodCheckInterval);
            
            // Skip if there was a recent explicit mood change
            if (Time.time - lastMoodChangeTime > moodChangeThreshold) {
                UpdateMoodReactiveLayers();
            }
            
            // Check for activity timeout
            if (Time.time - lastActivityTime > activityDetectionTime) {
                // Reduce activity-reactive layers
                foreach (var layer in musicLayers) {
                    if (layer.reactsToActivity && layerSources.ContainsKey(layer.layerId)) {
                        AudioSource source = layerSources[layer.layerId];
                        StartCoroutine(FadeAudioSource(source, layer.defaultVolume * 0.5f, 3f));
                    }
                }
            }
        }
    }
    
    private void StopCurrentStemSources(float fadeTime) {
        List<string> keysToRemove = new List<string>();
        
        foreach (var pair in stemSources) {
            StartCoroutine(FadeOutAndStop(pair.Value, fadeTime));
            keysToRemove.Add(pair.Key);
        }
        
        // Schedule removal after fade out
        StartCoroutine(RemoveStemSourcesAfterDelay(keysToRemove, fadeTime));
    }
    
    private IEnumerator RemoveStemSourcesAfterDelay(List<string> keys, float delay) {
        yield return new WaitForSeconds(delay + 0.1f);
        
        foreach (var key in keys) {
            if (stemSources.ContainsKey(key)) {
                Destroy(stemSources[key]);
                stemSources.Remove(key);
            }
        }
    }
    
    private IEnumerator FadeAudioSource(AudioSource source, float targetVolume, float duration) {
        if (source == null) yield break;
        
        float startVolume = source.volume;
        float time = 0;
        
        while (time < duration) {
            time += Time.deltaTime;
            float t = time / duration;
            source.volume = Mathf.Lerp(startVolume, targetVolume, t);
            yield return null;
        }
        
        source.volume = targetVolume;
    }
    
    private IEnumerator FadeOutAndStop(AudioSource source, float duration) {
        if (source == null) yield break;
        
        float startVolume = source.volume;
        float time = 0;
        
        while (time < duration) {
            time += Time.deltaTime;
            float t = time / duration;
            source.volume = Mathf.Lerp(startVolume, 0f, t);
            yield return null;
        }
        
        source.volume = 0f;
        source.Stop();
    }
    
    private IEnumerator BoostAndReturnVolume(AudioSource source, float boostVolume, float boostTime, float returnTime) {
        if (source == null) yield break;
        
        float originalVolume = source.volume;
        
        // Boost
        float time = 0;
        while (time < boostTime) {
            time += Time.deltaTime;
            float t = time / boostTime;
            source.volume = Mathf.Lerp(originalVolume, boostVolume, t);
            yield return null;
        }
        
        source.volume = boostVolume;
        
        // Return
        time = 0;
        while (time < returnTime) {
            time += Time.deltaTime;
            float t = time / returnTime;
            source.volume = Mathf.Lerp(boostVolume, originalVolume, t);
            yield return null;
        }
        
        source.volume = originalVolume;
    }
    
    private IEnumerator PlayLullabyRoutine(int index) {
        // Pick lullaby
        AudioClip lullaby;
        if (index >= 0 && index < lullabies.Count) {
            lullaby = lullabies[index];
        } else {
            lullaby = lullabies[UnityEngine.Random.Range(0, lullabies.Count)];
        }
        
        if (lullaby == null) yield break;
        
        // Create temporary source
        AudioSource lullabySource = gameObject.AddComponent<AudioSource>();
        lullabySource.clip = lullaby;
        lullabySource.loop = false;
        lullabySource.volume = 0f;
        lullabySource.spatialBlend = 0f;
        if (masterMixerGroup != null) {
            lullabySource.outputAudioMixerGroup = masterMixerGroup;
        }
        
        // Fade down current music
        foreach (var pair in layerSources) {
            StartCoroutine(FadeAudioSource(pair.Value, pair.Value.volume * 0.2f, crossfadeDuration));
        }
        
        foreach (var pair in stemSources) {
            StartCoroutine(FadeAudioSource(pair.Value, pair.Value.volume * 0.2f, crossfadeDuration));
        }
        
        // Start playing and fade in
        lullabySource.Play();
        StartCoroutine(FadeAudioSource(lullabySource, lullabyVolume, crossfadeDuration));
        
        isPlayingLullaby = true;
        
        // Wait for response delay (pet reacts to lullaby)
        yield return new WaitForSeconds(lullabyResponseDelay);
        
        // Trigger pet sleep animation if available
        if (pet != null) {
            // Make pet sleepy
            pet.Happiness = Mathf.Min(pet.Happiness + 5f, 100f);
        }
        
        // Wait for lullaby to finish
        float duration = lullaby.length + crossfadeDuration * 2;
        yield return new WaitForSeconds(duration);
        
        // Fade out lullaby
        StartCoroutine(FadeOutAndStop(lullabySource, crossfadeDuration));
        
        // Restore original music
        foreach (var pair in layerSources) {
            MusicLayer layer = musicLayers.Find(l => l.layerId == pair.Key);
            if (layer != null) {
                StartCoroutine(FadeAudioSource(pair.Value, layer.defaultVolume, crossfadeDuration));
            }
        }
        
        foreach (var pair in stemSources) {
            // Extract stem from key (format: setId_stemId)
            string[] parts = pair.Key.Split('_');
            if (parts.Length >= 2) {
                string setId = parts[0];
                string stemId = parts[1];
                
                MusicSet set = musicSets.Find(s => s.setId == setId);
                if (set != null) {
                    MusicStem stem = set.stems.Find(st => st.stemId == stemId);
                    if (stem != null) {
                        StartCoroutine(FadeAudioSource(pair.Value, stem.defaultVolume, crossfadeDuration));
                    }
                }
            }
        }
        
        // Cleanup
        Destroy(lullabySource, crossfadeDuration + 0.5f);
        isPlayingLullaby = false;
    }
    
    void OnDestroy() {
        // Clean up all audio sources
        foreach (var source in layerSources.Values) {
            Destroy(source);
        }
        
        foreach (var source in stemSources.Values) {
            Destroy(source);
        }
    }
}