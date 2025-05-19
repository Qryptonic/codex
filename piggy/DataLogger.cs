using UnityEngine;
using System;
using System.Collections.Generic;

/// <summary>
/// Logs player actions and pet stats for analytics
/// </summary>
public class DataLogger : MonoBehaviour {
    [Serializable]
    public class LogEvent {
        public string eventType;
        public DateTime timestamp;
        public Dictionary<string, object> parameters;
        
        public LogEvent(string type) {
            eventType = type;
            timestamp = DateTime.Now;
            parameters = new Dictionary<string, object>();
        }
    }
    
    [Header("Logging Settings")]
    [SerializeField] private bool enableLogging = true;
    [SerializeField] private bool logToConsole = false;
    [SerializeField] private int maxCachedEvents = 100;
    [SerializeField] private float uploadInterval = 300f; // 5 minutes
    
    private List<LogEvent> eventCache = new List<LogEvent>();
    private float lastUploadTime;
    
    void Start() {
        lastUploadTime = Time.time;
    }
    
    void Update() {
        // Upload cached data periodically
        if (Time.time - lastUploadTime > uploadInterval && eventCache.Count > 0) {
            UploadCachedEvents();
            lastUploadTime = Time.time;
        }
    }
    
    /// <summary>
    /// Log pet stats during tick update
    /// </summary>
    public void LogTick(VirtualPetUnity pet) {
        if (!enableLogging || pet == null)
            return;
            
        LogEvent logEvent = new LogEvent("PetStats");
        logEvent.parameters["Hunger"] = pet.Hunger;
        logEvent.parameters["Thirst"] = pet.Thirst;
        logEvent.parameters["Happiness"] = pet.Happiness;
        logEvent.parameters["Health"] = pet.Health;
        logEvent.parameters["AgeDays"] = pet.AgeDays;
        
        LogEventInternal(logEvent);
    }
    
    /// <summary>
    /// Log a player action
    /// </summary>
    public void LogAction(string actionType, Dictionary<string, object> parameters = null) {
        if (!enableLogging)
            return;
            
        LogEvent logEvent = new LogEvent(actionType);
        if (parameters != null) {
            foreach (var pair in parameters)
                logEvent.parameters[pair.Key] = pair.Value;
        }
        
        LogEventInternal(logEvent);
    }
    
    private void LogEventInternal(LogEvent logEvent) {
        // Add to cache
        eventCache.Add(logEvent);
        
        // Trim cache if too large
        if (eventCache.Count > maxCachedEvents)
            eventCache.RemoveAt(0);
            
        // Log to console for debugging
        if (logToConsole) {
            string parametersStr = "";
            foreach (var pair in logEvent.parameters)
                parametersStr += $"{pair.Key}={pair.Value}, ";
                
            Debug.Log($"[DataLogger] Event: {logEvent.eventType}, Parameters: {parametersStr}");
        }
    }
    
    private void UploadCachedEvents() {
        if (eventCache.Count == 0)
            return;
            
        // Example implementation - replace with your analytics API
        Debug.Log($"[DataLogger] Uploading {eventCache.Count} events");
        
        // TODO: Upload to server:
        // 1. Convert events to JSON
        // 2. Send via HTTP request to analytics endpoint
        // 3. Clear cache on successful upload
        
        // For demo purposes, just clear the cache
        eventCache.Clear();
    }
    
    /// <summary>
    /// Force upload of all cached events
    /// </summary>
    public void ForceUpload() {
        UploadCachedEvents();
        lastUploadTime = Time.time;
    }
    
    void OnApplicationPause(bool pause) {
        if (pause) {
            // Upload data when app is paused
            ForceUpload();
        }
    }
    
    void OnApplicationQuit() {
        // Upload data when app is closed
        ForceUpload();
    }
}