using UnityEngine;
using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine.Networking;

/// <summary>
/// Connects to weather API and applies weather effects to the pet and environment
/// </summary>
public class WeatherManager : MonoBehaviour {
    [System.Serializable]
    public class WeatherEffect {
        public string weatherType; // "Clear", "Rain", "Snow", etc.
        public GameObject effectPrefab;
        public AudioClip ambientSound;
        [Range(0f, 1f)]
        public float volume = 0.5f;
        public Color lightColor = Color.white;
        [Range(0.5f, 1.5f)]
        public float lightIntensity = 1f;
        public float happinessModifier = 0f;
        public string animationTrigger;
    }
    
    [System.Serializable]
    public class WeatherData {
        public string weatherType;
        public float temperature;
        public float humidity;
        public float windSpeed;
        public string description;
        public DateTime timestamp;
    }
    
    [Header("Weather API Configuration")]
    [SerializeField] private bool useRealWeather = true;
    [SerializeField] private string apiKey = "YOUR_API_KEY";
    [SerializeField] private string defaultCity = "London";
    [SerializeField] private float updateInterval = 900f; // 15 minutes
    [SerializeField] private string apiBaseUrl = "https://api.openweathermap.org/data/2.5/weather";
    
    [Header("Weather Effects")]
    [SerializeField] private List<WeatherEffect> weatherEffects = new List<WeatherEffect>();
    [SerializeField] private string defaultWeather = "Clear";
    [SerializeField] private Transform effectsParent;
    
    [Header("References")]
    [SerializeField] private VirtualPetUnity pet;
    [SerializeField] private Light sceneLight;
    [SerializeField] private AudioManager audioManager;
    [SerializeField] private GameObject window;
    
    [Header("Debug")]
    [SerializeField] private bool debugMode = false;
    [SerializeField] private string debugWeatherType = "Rain";
    
    private WeatherData currentWeather;
    private WeatherEffect activeEffect;
    private GameObject spawnedEffect;
    private AudioSource weatherAudio;
    private Coroutine weatherUpdateRoutine;
    private bool isInitialized = false;
    
    void Start() {
        // Create audio source for weather ambient sounds
        weatherAudio = gameObject.AddComponent<AudioSource>();
        weatherAudio.loop = true;
        weatherAudio.spatialBlend = 0f; // 2D sound
        weatherAudio.volume = 0f; // Start silent
        
        if (debugMode) {
            // Use debug weather immediately
            SetWeatherType(debugWeatherType);
        } else if (useRealWeather) {
            // Start weather update routine
            weatherUpdateRoutine = StartCoroutine(WeatherUpdateRoutine());
        } else {
            // Use default weather
            SetWeatherType(defaultWeather);
        }
        
        isInitialized = true;
    }
    
    void OnDisable() {
        if (weatherUpdateRoutine != null) {
            StopCoroutine(weatherUpdateRoutine);
        }
    }
    
    /// <summary>
    /// Updates weather using the specified city
    /// </summary>
    public void UpdateWeatherForCity(string city) {
        StopAllCoroutines();
        weatherUpdateRoutine = StartCoroutine(FetchWeatherData(city));
    }
    
    /// <summary>
    /// Gets the current weather data
    /// </summary>
    public WeatherData GetCurrentWeather() {
        return currentWeather;
    }
    
    /// <summary>
    /// Manually sets a specific weather type
    /// </summary>
    public void SetWeatherType(string weatherType) {
        // Clean up any existing weather effect
        CleanupCurrentWeather();
        
        // Find the matching weather effect
        WeatherEffect effect = weatherEffects.Find(e => e.weatherType.Equals(weatherType, StringComparison.OrdinalIgnoreCase));
        if (effect == null) {
            Debug.LogWarning($"[WeatherManager] Weather type '{weatherType}' not found, using default");
            effect = weatherEffects.Find(e => e.weatherType.Equals(defaultWeather, StringComparison.OrdinalIgnoreCase));
            
            if (effect == null) {
                Debug.LogError("[WeatherManager] Default weather type not found");
                return;
            }
        }
        
        // Store as active effect
        activeEffect = effect;
        
        // Apply visual effects
        if (effect.effectPrefab != null && effectsParent != null) {
            spawnedEffect = Instantiate(effect.effectPrefab, effectsParent);
        }
        
        // Apply lighting changes
        if (sceneLight != null) {
            sceneLight.color = effect.lightColor;
            sceneLight.intensity = effect.lightIntensity;
        }
        
        // Apply audio effects
        if (effect.ambientSound != null) {
            weatherAudio.clip = effect.ambientSound;
            weatherAudio.volume = effect.volume;
            weatherAudio.Play();
        }
        
        // Apply happiness modifier to pet
        if (pet != null && isInitialized) {
            pet.Happiness = Mathf.Clamp(pet.Happiness + effect.happinessModifier, 0f, 100f);
        }
        
        // Apply animation trigger if any
        if (!string.IsNullOrEmpty(effect.animationTrigger) && pet != null) {
            Animator animator = pet.GetComponentInChildren<Animator>();
            if (animator != null) {
                animator.SetTrigger(effect.animationTrigger);
            }
        }
        
        // Update window if present
        if (window != null) {
            // Activate window for outdoor weather effects
            window.SetActive(!weatherType.Equals("Clear", StringComparison.OrdinalIgnoreCase));
        }
    }
    
    // Private implementation methods
    
    private IEnumerator WeatherUpdateRoutine() {
        while (true) {
            yield return StartCoroutine(FetchWeatherData(defaultCity));
            yield return new WaitForSeconds(updateInterval);
        }
    }
    
    private IEnumerator FetchWeatherData(string city) {
        // Check if city is valid
        if (string.IsNullOrEmpty(city)) {
            Debug.LogWarning("[WeatherManager] City name is empty, using default");
            city = defaultCity;
        }
        
        // Build API URL
        string url = $"{apiBaseUrl}?q={city}&appid={apiKey}&units=metric";
        
        using (UnityWebRequest request = UnityWebRequest.Get(url)) {
            yield return request.SendWebRequest();
            
            if (request.result == UnityWebRequest.Result.Success) {
                try {
                    // Parse API response
                    string json = request.downloadHandler.text;
                    WeatherData weatherData = ParseWeatherData(json);
                    
                    if (weatherData != null) {
                        currentWeather = weatherData;
                        
                        // Apply the detected weather type
                        SetWeatherType(weatherData.weatherType);
                        
                        // Log for debugging
                        Debug.Log($"[WeatherManager] Weather updated: {weatherData.weatherType}, {weatherData.temperature}°C");
                    }
                } catch (Exception e) {
                    Debug.LogError($"[WeatherManager] Error parsing weather data: {e.Message}");
                }
            } else {
                Debug.LogError($"[WeatherManager] Error fetching weather: {request.error}");
                
                // Fallback to default weather if API fails
                if (currentWeather == null) {
                    SetWeatherType(defaultWeather);
                }
            }
        }
    }
    
    private WeatherData ParseWeatherData(string json) {
        // In a real implementation, use JsonUtility or JSON.NET
        // This is a simplified parser for demonstration
        
        try {
            // Create a new weather data object
            WeatherData data = new WeatherData();
            data.timestamp = DateTime.Now;
            
            // Extract the weather condition
            // This is a very simple parser that looks for the "main" field
            int weatherIndex = json.IndexOf("\"main\":");
            if (weatherIndex >= 0) {
                int startIndex = json.IndexOf("\"", weatherIndex + 7) + 1;
                int endIndex = json.IndexOf("\"", startIndex);
                data.weatherType = json.Substring(startIndex, endIndex - startIndex);
            } else {
                data.weatherType = defaultWeather;
            }
            
            // Extract temperature
            int tempIndex = json.IndexOf("\"temp\":");
            if (tempIndex >= 0) {
                int startIndex = tempIndex + 7;
                int endIndex = json.IndexOf(",", startIndex);
                string tempStr = json.Substring(startIndex, endIndex - startIndex);
                float.TryParse(tempStr, out data.temperature);
            }
            
            // Extract humidity
            int humidityIndex = json.IndexOf("\"humidity\":");
            if (humidityIndex >= 0) {
                int startIndex = humidityIndex + 11;
                int endIndex = json.IndexOf(",", startIndex);
                if (endIndex < 0) endIndex = json.IndexOf("}", startIndex);
                string humidityStr = json.Substring(startIndex, endIndex - startIndex);
                float.TryParse(humidityStr, out data.humidity);
            }
            
            // Extract wind speed
            int windIndex = json.IndexOf("\"speed\":");
            if (windIndex >= 0) {
                int startIndex = windIndex + 8;
                int endIndex = json.IndexOf(",", startIndex);
                if (endIndex < 0) endIndex = json.IndexOf("}", startIndex);
                string windStr = json.Substring(startIndex, endIndex - startIndex);
                float.TryParse(windStr, out data.windSpeed);
            }
            
            // Map OpenWeatherMap main conditions to our weather types
            switch (data.weatherType) {
                case "Clear":
                    data.weatherType = "Clear";
                    break;
                case "Clouds":
                    data.weatherType = "Cloudy";
                    break;
                case "Rain":
                case "Drizzle":
                    data.weatherType = "Rain";
                    break;
                case "Snow":
                    data.weatherType = "Snow";
                    break;
                case "Thunderstorm":
                    data.weatherType = "Storm";
                    break;
                case "Fog":
                case "Mist":
                case "Haze":
                    data.weatherType = "Fog";
                    break;
                default:
                    data.weatherType = "Clear";
                    break;
            }
            
            return data;
        } catch (Exception e) {
            Debug.LogError($"[WeatherManager] Error parsing weather JSON: {e.Message}");
            return null;
        }
    }
    
    private void CleanupCurrentWeather() {
        // Destroy any spawned effect
        if (spawnedEffect != null) {
            Destroy(spawnedEffect);
            spawnedEffect = null;
        }
        
        // Stop weather audio
        if (weatherAudio != null && weatherAudio.isPlaying) {
            weatherAudio.Stop();
        }
        
        activeEffect = null;
    }
}