using UnityEngine;
using UnityEngine.Audio;
using System;
using System.Collections;
using System.Collections.Generic;

/// <summary>
/// Comprehensive audio system with sound effects, music, and ambient audio
/// </summary>
public class AudioManager : MonoBehaviour {
    [Serializable]
    public class Sound {
        public string name;
        public AudioClip clip;
        
        [Range(0f, 1f)]
        public float volume = 0.7f;
        
        [Range(0.1f, 3f)]
        public float pitch = 1f;
        
        [Range(0f, 1f)]
        public float spatialBlend = 0f;
        
        public bool loop = false;
        
        [HideInInspector]
        public AudioSource source;
        
        public float randomPitchVariation = 0.1f;
        public float cooldown = 0.1f;
        [HideInInspector]
        public float lastPlayTime;
    }
    
    [Header("Audio Settings")]
    [SerializeField] private Sound[] sounds;
    [SerializeField] private string startupMusic = "Theme";
    [SerializeField] private AudioMixerGroup sfxMixerGroup;
    [SerializeField] private AudioMixerGroup musicMixerGroup;
    [SerializeField] private AudioMixerGroup ambientMixerGroup;
    
    [Header("Animation Sync")]
    [SerializeField] private float footstepInterval = 0.3f;
    
    private Dictionary<string, Sound> soundDictionary = new Dictionary<string, Sound>();
    private Dictionary<string, Coroutine> fadeCoroutines = new Dictionary<string, Coroutine>();
    
    void Awake() {
        // Create audio sources for each sound
        foreach (Sound s in sounds) {
            s.source = gameObject.AddComponent<AudioSource>();
            s.source.clip = s.clip;
            s.source.volume = s.volume;
            s.source.pitch = s.pitch;
            s.source.loop = s.loop;
            s.source.spatialBlend = s.spatialBlend;
            
            // Assign mixer groups
            if (s.name.StartsWith("Music")) {
                s.source.outputAudioMixerGroup = musicMixerGroup;
            } else if (s.name.StartsWith("Ambient")) {
                s.source.outputAudioMixerGroup = ambientMixerGroup;
            } else {
                s.source.outputAudioMixerGroup = sfxMixerGroup;
            }
            
            // Store in dictionary for fast lookup
            soundDictionary[s.name] = s;
        }
    }
    
    void Start() {
        // Start background music
        if (!string.IsNullOrEmpty(startupMusic)) {
            PlayMusic(startupMusic);
        }
    }
    
    /// <summary>
    /// Play a sound by name with optional position for 3D sounds
    /// </summary>
    public void Play(string soundName, Vector3 position = default) {
        if (soundDictionary.TryGetValue(soundName, out Sound sound)) {
            // Check cooldown
            if (Time.time - sound.lastPlayTime < sound.cooldown)
                return;
                
            sound.lastPlayTime = Time.time;
            
            // Apply random pitch variation if any
            if (sound.randomPitchVariation > 0) {
                sound.source.pitch = sound.pitch + UnityEngine.Random.Range(-sound.randomPitchVariation, sound.randomPitchVariation);
            }
            
            // Position 3D sound in world
            if (sound.spatialBlend > 0) {
                sound.source.transform.position = position;
            }
            
            sound.source.Play();
        } else {
            Debug.LogWarning($"[AudioManager] Sound {soundName} not found!");
        }
    }
    
    /// <summary>
    /// Play a music track with crossfade
    /// </summary>
    public void PlayMusic(string musicName, float fadeTime = 1.0f) {
        // Fade out current music
        foreach (Sound s in sounds) {
            if (s.name.StartsWith("Music") && s.source.isPlaying && s.name != musicName) {
                FadeOut(s.name, fadeTime);
            }
        }
        
        // Fade in new music
        if (soundDictionary.TryGetValue(musicName, out Sound newMusic)) {
            FadeIn(musicName, fadeTime);
        }
    }
    
    /// <summary>
    /// Play animation-synchronized footsteps
    /// </summary>
    public void StartFootsteps(string footstepSound = "Footstep") {
        StartCoroutine(PlayFootsteps(footstepSound));
    }
    
    /// <summary>
    /// Stop animation-synchronized footsteps
    /// </summary>
    public void StopFootsteps() {
        StopAllCoroutines(); // Note: this will stop ALL coroutines
    }
    
    /// <summary>
    /// Set volume of a specific mixer (SFX, Music, Ambient)
    /// </summary>
    public void SetVolume(string mixerName, float volumePercent) {
        switch (mixerName.ToLower()) {
            case "sfx":
                if (sfxMixerGroup != null && sfxMixerGroup.audioMixer != null) {
                    sfxMixerGroup.audioMixer.SetFloat("SFXVolume", Mathf.Log10(volumePercent) * 20);
                }
                break;
            case "music":
                if (musicMixerGroup != null && musicMixerGroup.audioMixer != null) {
                    musicMixerGroup.audioMixer.SetFloat("MusicVolume", Mathf.Log10(volumePercent) * 20);
                }
                break;
            case "ambient":
                if (ambientMixerGroup != null && ambientMixerGroup.audioMixer != null) {
                    ambientMixerGroup.audioMixer.SetFloat("AmbientVolume", Mathf.Log10(volumePercent) * 20);
                }
                break;
        }
    }
    
    /// <summary>
    /// Stop a specific sound
    /// </summary>
    public void Stop(string soundName) {
        if (soundDictionary.TryGetValue(soundName, out Sound sound)) {
            sound.source.Stop();
        }
    }
    
    /// <summary>
    /// Fade in a sound over time
    /// </summary>
    public void FadeIn(string soundName, float fadeTime) {
        if (soundDictionary.TryGetValue(soundName, out Sound sound)) {
            // Stop any existing fade
            if (fadeCoroutines.TryGetValue(soundName, out Coroutine oldCoroutine)) {
                StopCoroutine(oldCoroutine);
            }
            
            // Start new fade
            fadeCoroutines[soundName] = StartCoroutine(FadeSound(sound, 0f, sound.volume, fadeTime, true));
        }
    }
    
    /// <summary>
    /// Fade out a sound over time
    /// </summary>
    public void FadeOut(string soundName, float fadeTime) {
        if (soundDictionary.TryGetValue(soundName, out Sound sound)) {
            // Stop any existing fade
            if (fadeCoroutines.TryGetValue(soundName, out Coroutine oldCoroutine)) {
                StopCoroutine(oldCoroutine);
            }
            
            // Start new fade
            fadeCoroutines[soundName] = StartCoroutine(FadeSound(sound, sound.source.volume, 0f, fadeTime, false));
        }
    }
    
    private IEnumerator FadeSound(Sound sound, float startVolume, float targetVolume, float fadeTime, bool playOnStart) {
        if (playOnStart && !sound.source.isPlaying) {
            sound.source.volume = startVolume;
            sound.source.Play();
        }
        
        float elapsed = 0;
        while (elapsed < fadeTime) {
            sound.source.volume = Mathf.Lerp(startVolume, targetVolume, elapsed / fadeTime);
            elapsed += Time.deltaTime;
            yield return null;
        }
        
        sound.source.volume = targetVolume;
        
        if (targetVolume <= 0) {
            sound.source.Stop();
        }
    }
    
    private IEnumerator PlayFootsteps(string footstepSound) {
        while (true) {
            Play(footstepSound);
            yield return new WaitForSeconds(footstepInterval);
        }
    }
    
    /// <summary>
    /// Play a random sound from a category (e.g. "Eating1", "Eating2", "Eating3")
    /// </summary>
    public void PlayRandom(string category, int count = 3) {
        int index = UnityEngine.Random.Range(1, count + 1);
        Play($"{category}{index}");
    }
}