using UnityEngine;
using System.Collections.Generic;
using System;

/// <summary>
/// Manages pet customization options like name, accessories, and decorations
/// </summary>
public class CustomizationManager : MonoBehaviour {
    [Serializable]
    public class AccessoryItem {
        public string id;
        public string displayName;
        public GameObject prefab;
        public Sprite icon;
        public string unlockRequirement;
        public bool unlockedByDefault = false;
    }
    
    [Header("Pet References")]
    [SerializeField] private VirtualPetUnity pet;
    [SerializeField] private Transform accessoryAttachPoint;
    
    [Header("Customization Options")]
    [SerializeField] private string defaultPetName = "Guinea Pig";
    [SerializeField] private List<AccessoryItem> accessories = new List<AccessoryItem>();
    [SerializeField] private Color[] availableColors = new Color[] {
        Color.white,           // Default
        new Color(1f, 0.8f, 0.8f),  // Pink
        new Color(0.8f, 0.9f, 1f),  // Light Blue
        new Color(1f, 1f, 0.8f),    // Light Yellow
        new Color(0.8f, 1f, 0.8f)   // Light Green
    };
    
    [Header("Debug")]
    [SerializeField] private bool unlockAllItems = false;
    
    private string petName;
    private Color petColor = Color.white;
    private AccessoryItem currentAccessory;
    private GameObject spawnedAccessory;
    private Dictionary<string, bool> unlockedAccessories = new Dictionary<string, bool>();
    
    void Start() {
        petName = defaultPetName;
        
        // Initialize unlocked status
        foreach (var item in accessories) {
            unlockedAccessories[item.id] = item.unlockedByDefault;
            
            if (unlockAllItems) {
                unlockedAccessories[item.id] = true;
            }
        }
        
        // Load saved customization if available
        LoadCustomization();
    }
    
    /// <summary>
    /// Set the pet's name
    /// </summary>
    public void SetPetName(string name) {
        if (string.IsNullOrEmpty(name)) {
            petName = defaultPetName;
        } else {
            petName = name;
        }
        
        // Notify UI/other components if needed
        PetNameChanged();
    }
    
    /// <summary>
    /// Get the pet's current name
    /// </summary>
    public string GetPetName() {
        return petName;
    }
    
    /// <summary>
    /// Set the pet's color
    /// </summary>
    public void SetPetColor(int colorIndex) {
        if (colorIndex >= 0 && colorIndex < availableColors.Length) {
            petColor = availableColors[colorIndex];
            UpdatePetColor();
        }
    }
    
    /// <summary>
    /// Set the pet's color from a Color value
    /// </summary>
    public void SetPetColor(Color color) {
        petColor = color;
        UpdatePetColor();
    }
    
    /// <summary>
    /// Equip an accessory by ID
    /// </summary>
    public void EquipAccessory(string accessoryId) {
        // Check if accessory is unlocked
        if (!IsAccessoryUnlocked(accessoryId)) {
            Debug.LogWarning($"[CustomizationManager] Accessory '{accessoryId}' is not unlocked");
            return;
        }
        
        // Find accessory by ID
        AccessoryItem item = accessories.Find(a => a.id == accessoryId);
        if (item == null) {
            Debug.LogWarning($"[CustomizationManager] Accessory '{accessoryId}' not found");
            return;
        }
        
        // Remove current accessory if any
        RemoveAccessory();
        
        // Spawn new accessory
        if (accessoryAttachPoint != null && item.prefab != null) {
            spawnedAccessory = Instantiate(item.prefab, accessoryAttachPoint);
            spawnedAccessory.transform.localPosition = Vector3.zero;
            spawnedAccessory.transform.localRotation = Quaternion.identity;
            currentAccessory = item;
        }
    }
    
    /// <summary>
    /// Remove the currently equipped accessory
    /// </summary>
    public void RemoveAccessory() {
        if (spawnedAccessory != null) {
            Destroy(spawnedAccessory);
            spawnedAccessory = null;
        }
        currentAccessory = null;
    }
    
    /// <summary>
    /// Get the currently equipped accessory
    /// </summary>
    public AccessoryItem GetCurrentAccessory() {
        return currentAccessory;
    }
    
    /// <summary>
    /// Check if an accessory is unlocked
    /// </summary>
    public bool IsAccessoryUnlocked(string accessoryId) {
        return unlockedAccessories.ContainsKey(accessoryId) && unlockedAccessories[accessoryId];
    }
    
    /// <summary>
    /// Unlock a new accessory
    /// </summary>
    public void UnlockAccessory(string accessoryId) {
        if (accessories.Exists(a => a.id == accessoryId)) {
            unlockedAccessories[accessoryId] = true;
            
            // Notify UI about new unlock
            AccessoryUnlocked(accessoryId);
        }
    }
    
    /// <summary>
    /// Get all available accessories
    /// </summary>
    public List<AccessoryItem> GetAllAccessories() {
        return accessories;
    }
    
    /// <summary>
    /// Get list of unlocked accessories
    /// </summary>
    public List<AccessoryItem> GetUnlockedAccessories() {
        List<AccessoryItem> unlocked = new List<AccessoryItem>();
        foreach (var item in accessories) {
            if (IsAccessoryUnlocked(item.id)) {
                unlocked.Add(item);
            }
        }
        return unlocked;
    }
    
    /// <summary>
    /// Save customization to player prefs
    /// </summary>
    public void SaveCustomization() {
        // Save pet name
        PlayerPrefs.SetString("PetName", petName);
        
        // Save color (as index)
        int colorIndex = Array.IndexOf(availableColors, petColor);
        if (colorIndex >= 0) {
            PlayerPrefs.SetInt("PetColorIndex", colorIndex);
        }
        
        // Save equipped accessory
        if (currentAccessory != null) {
            PlayerPrefs.SetString("EquippedAccessory", currentAccessory.id);
        } else {
            PlayerPrefs.SetString("EquippedAccessory", "");
        }
        
        // Save unlocked accessories
        string unlockedStr = "";
        foreach (var pair in unlockedAccessories) {
            if (pair.Value) {
                unlockedStr += pair.Key + ",";
            }
        }
        PlayerPrefs.SetString("UnlockedAccessories", unlockedStr);
        
        PlayerPrefs.Save();
    }
    
    /// <summary>
    /// Load customization from player prefs
    /// </summary>
    public void LoadCustomization() {
        // Load pet name
        if (PlayerPrefs.HasKey("PetName")) {
            petName = PlayerPrefs.GetString("PetName");
        }
        
        // Load color
        if (PlayerPrefs.HasKey("PetColorIndex")) {
            int colorIndex = PlayerPrefs.GetInt("PetColorIndex");
            if (colorIndex >= 0 && colorIndex < availableColors.Length) {
                petColor = availableColors[colorIndex];
                UpdatePetColor();
            }
        }
        
        // Load unlocked accessories
        if (PlayerPrefs.HasKey("UnlockedAccessories")) {
            string unlockedStr = PlayerPrefs.GetString("UnlockedAccessories");
            string[] ids = unlockedStr.Split(new char[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
            foreach (string id in ids) {
                unlockedAccessories[id] = true;
            }
        }
        
        // Load equipped accessory
        if (PlayerPrefs.HasKey("EquippedAccessory")) {
            string accessoryId = PlayerPrefs.GetString("EquippedAccessory");
            if (!string.IsNullOrEmpty(accessoryId)) {
                EquipAccessory(accessoryId);
            }
        }
    }
    
    /// <summary>
    /// Get the name of a material slot to use for recoloring
    /// </summary>
    private void UpdatePetColor() {
        // Find renderers on the pet object
        Renderer[] renderers = pet.GetComponentsInChildren<Renderer>();
        foreach (Renderer rend in renderers) {
            // Skip special objects like eyes, nose, etc.
            if (rend.gameObject.name.Contains("Eye") ||
                rend.gameObject.name.Contains("Nose") ||
                rend.gameObject.name.Contains("Blush")) {
                continue;
            }
            
            // Apply color to main material
            Material mat = rend.material;
            if (mat != null) {
                mat.color = petColor;
            }
        }
    }
    
    // Event methods
    private void PetNameChanged() {
        // Example: Update UI or notify other components
        Debug.Log($"[CustomizationManager] Pet name changed to {petName}");
    }
    
    private void AccessoryUnlocked(string accessoryId) {
        // Example: Show notification
        AccessoryItem item = accessories.Find(a => a.id == accessoryId);
        if (item != null) {
            Debug.Log($"[CustomizationManager] New accessory unlocked: {item.displayName}");
            
            // Example: Notify UI system
            NotificationManager notificationManager = FindObjectOfType<NotificationManager>();
            if (notificationManager != null) {
                notificationManager.TriggerAlert($"New accessory unlocked: {item.displayName}!");
            }
        }
    }
}