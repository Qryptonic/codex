using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using UnityEngine.Networking;
using System;

/// <summary>
/// Handles multiplayer interactions for pet friend visits
/// This is a simplified implementation that would be connected to a proper backend
/// </summary>
public class MultiplayerManager : MonoBehaviour {
    [System.Serializable]
    public class FriendData {
        public string friendId;
        public string friendName;
        public string petName;
        public int petLevel;
        public string lastVisit;
        public bool hasPendingGift;
    }
    
    [System.Serializable]
    public class PetSnapshot {
        public string petName;
        public string ownerName;
        public int bondLevel;
        public string temperament;
        public List<string> accessories = new List<string>();
        public string currentColor;
        
        // Stats to display (not full stats for security)
        public int petLevel;
        public int totalPlaytime;
        public int highScore;
    }
    
    [System.Serializable]
    public class FriendVisit {
        public string friendId;
        public string timestamp;
        public string message;
        public string giftType;
    }
    
    [Header("Multiplayer Settings")]
    [SerializeField] private bool enableMultiplayer = true;
    [SerializeField] private float syncInterval = 300f; // 5 minutes
    [SerializeField] private string apiBaseUrl = "https://api.yourpetgame.com/";
    [SerializeField] private bool usePlayerPrefsForDemo = true;
    
    [Header("Pet References")]
    [SerializeField] private VirtualPetUnity pet;
    [SerializeField] private CustomizationManager customizationManager;
    
    [Header("Friend Prefabs")]
    [SerializeField] private GameObject friendPetPrefab;
    [SerializeField] private Transform visitPosition;
    
    [Header("Debug")]
    [SerializeField] private bool simulateNetwork = true;
    [SerializeField] private float simulatedNetworkDelay = 0.5f;
    
    private List<FriendData> friendsList = new List<FriendData>();
    private Dictionary<string, GameObject> activeFriendVisits = new Dictionary<string, GameObject>();
    private PetSnapshot myPetSnapshot;
    private string playerId;
    
    void Start() {
        // Generate a player ID if it doesn't exist
        if (PlayerPrefs.HasKey("PlayerId")) {
            playerId = PlayerPrefs.GetString("PlayerId");
        } else {
            playerId = Guid.NewGuid().ToString();
            PlayerPrefs.SetString("PlayerId", playerId);
            PlayerPrefs.Save();
        }
        
        if (enableMultiplayer) {
            StartCoroutine(SyncWithServerRoutine());
            
            // Load friends list from PlayerPrefs for demo
            if (usePlayerPrefsForDemo) {
                LoadFriendsFromPlayerPrefs();
            }
        }
    }
    
    /// <summary>
    /// Create a snapshot of the current pet for sharing
    /// </summary>
    public PetSnapshot CreatePetSnapshot() {
        if (pet == null) return null;
        
        myPetSnapshot = new PetSnapshot {
            petName = customizationManager != null ? customizationManager.GetPetName() : "Guinea Pig",
            ownerName = PlayerPrefs.GetString("PlayerName", "Player"),
            bondLevel = GetBondLevel(),
            temperament = pet.PigTemperament.ToString(),
            petLevel = CalculatePetLevel(),
            totalPlaytime = PlayerPrefs.GetInt("TotalPlaytimeMinutes", 0),
            highScore = GetHighestMinigameScore()
        };
        
        // Get current accessories
        if (customizationManager != null) {
            var accessory = customizationManager.GetCurrentAccessory();
            if (accessory != null) {
                myPetSnapshot.accessories.Add(accessory.id);
            }
        }
        
        return myPetSnapshot;
    }
    
    /// <summary>
    /// Get the current list of friends
    /// </summary>
    public List<FriendData> GetFriendsList() {
        return friendsList;
    }
    
    /// <summary>
    /// Add a new friend by code
    /// </summary>
    public void AddFriendByCode(string friendCode, Action<bool, string> callback) {
        if (!enableMultiplayer) {
            callback?.Invoke(false, "Multiplayer is disabled");
            return;
        }
        
        if (string.IsNullOrEmpty(friendCode)) {
            callback?.Invoke(false, "Invalid friend code");
            return;
        }
        
        if (simulateNetwork) {
            StartCoroutine(SimulateAddFriend(friendCode, callback));
        } else {
            StartCoroutine(AddFriendRequest(friendCode, callback));
        }
    }
    
    /// <summary>
    /// Send a gift to a friend
    /// </summary>
    public void SendGiftToFriend(string friendId, string giftType, Action<bool, string> callback) {
        if (!enableMultiplayer) {
            callback?.Invoke(false, "Multiplayer is disabled");
            return;
        }
        
        if (string.IsNullOrEmpty(friendId)) {
            callback?.Invoke(false, "Invalid friend ID");
            return;
        }
        
        if (simulateNetwork) {
            StartCoroutine(SimulateSendGift(friendId, giftType, callback));
        } else {
            StartCoroutine(SendGiftRequest(friendId, giftType, callback));
        }
    }
    
    /// <summary>
    /// Visit a friend's pet
    /// </summary>
    public void VisitFriend(string friendId, Action<bool, string> callback) {
        if (!enableMultiplayer) {
            callback?.Invoke(false, "Multiplayer is disabled");
            return;
        }
        
        if (string.IsNullOrEmpty(friendId)) {
            callback?.Invoke(false, "Invalid friend ID");
            return;
        }
        
        if (simulateNetwork) {
            StartCoroutine(SimulateVisitFriend(friendId, callback));
        } else {
            StartCoroutine(VisitFriendRequest(friendId, callback));
        }
    }
    
    /// <summary>
    /// Get friend's pet snapshot
    /// </summary>
    public void GetFriendPetSnapshot(string friendId, Action<PetSnapshot> callback) {
        if (!enableMultiplayer) {
            callback?.Invoke(null);
            return;
        }
        
        if (string.IsNullOrEmpty(friendId)) {
            callback?.Invoke(null);
            return;
        }
        
        if (simulateNetwork) {
            StartCoroutine(SimulateGetFriendPet(friendId, callback));
        } else {
            StartCoroutine(GetFriendPetRequest(friendId, callback));
        }
    }
    
    /// <summary>
    /// Check for and claim pending gifts
    /// </summary>
    public void CheckPendingGifts(Action<List<FriendVisit>> callback) {
        if (!enableMultiplayer) {
            callback?.Invoke(new List<FriendVisit>());
            return;
        }
        
        if (simulateNetwork) {
            StartCoroutine(SimulatePendingGifts(callback));
        } else {
            StartCoroutine(CheckPendingGiftsRequest(callback));
        }
    }
    
    /// <summary>
    /// Get your friend code to share
    /// </summary>
    public string GetMyFriendCode() {
        return playerId.Substring(0, 8).ToUpperInvariant();
    }
    
    // Coroutines for server sync
    private IEnumerator SyncWithServerRoutine() {
        while (enableMultiplayer) {
            yield return new WaitForSeconds(syncInterval);
            
            // Upload current pet snapshot
            PetSnapshot snapshot = CreatePetSnapshot();
            if (snapshot != null) {
                if (simulateNetwork) {
                    // Simulate saving to server
                    Debug.Log("[MultiplayerManager] Simulated pet snapshot upload");
                } else {
                    yield return StartCoroutine(UploadPetSnapshot(snapshot));
                }
            }
            
            // Check for friend visits and gifts
            CheckPendingGifts((visits) => {
                foreach (var visit in visits) {
                    HandleFriendVisit(visit);
                }
            });
        }
    }
    
    // Helper methods
    private int GetBondLevel() {
        AffectionMeter affectionMeter = pet.GetComponent<AffectionMeter>();
        return affectionMeter != null ? affectionMeter.GetBondLevel() : 0;
    }
    
    private int CalculatePetLevel() {
        // Calculate level based on bond and age
        return GetBondLevel() + Mathf.FloorToInt(pet.AgeDays / 7);
    }
    
    private int GetHighestMinigameScore() {
        // This would be implemented based on your minigame system
        return PlayerPrefs.GetInt("HighestMinigameScore", 0);
    }
    
    private void HandleFriendVisit(FriendVisit visit) {
        // Find the friend in the list
        FriendData friend = friendsList.Find(f => f.friendId == visit.friendId);
        if (friend == null) return;
        
        // Show notification
        NotificationManager notificationManager = FindObjectOfType<NotificationManager>();
        if (notificationManager != null) {
            notificationManager.TriggerAlert($"{friend.friendName}'s pet came to visit!");
        }
        
        // Create friend pet in the world if AR placement position available
        if (friendPetPrefab != null && visitPosition != null) {
            GameObject friendPet = Instantiate(friendPetPrefab, visitPosition.position, visitPosition.rotation);
            
            // Store visit
            if (activeFriendVisits.ContainsKey(visit.friendId)) {
                Destroy(activeFriendVisits[visit.friendId]);
            }
            activeFriendVisits[visit.friendId] = friendPet;
            
            // Apply gifts if any
            if (!string.IsNullOrEmpty(visit.giftType)) {
                ApplyGift(visit.giftType);
            }
            
            // Set up a cleanup routine
            StartCoroutine(CleanupVisitAfterDelay(visit.friendId, 60f)); // 1 minute visit
        }
    }
    
    private void ApplyGift(string giftType) {
        // Apply different effects based on gift type
        switch (giftType) {
            case "food":
                if (pet != null) pet.Hunger = Mathf.Max(pet.Hunger - 20f, 0f);
                break;
                
            case "water":
                if (pet != null) pet.Thirst = Mathf.Max(pet.Thirst - 20f, 0f);
                break;
                
            case "toy":
                if (pet != null) pet.Happiness = Mathf.Min(pet.Happiness + 15f, 100f);
                break;
                
            case "heart":
                // Add bond points
                AffectionMeter affectionMeter = pet.GetComponent<AffectionMeter>();
                if (affectionMeter != null) {
                    affectionMeter.AddBond(5);
                }
                break;
        }
    }
    
    private IEnumerator CleanupVisitAfterDelay(string friendId, float delay) {
        yield return new WaitForSeconds(delay);
        
        if (activeFriendVisits.TryGetValue(friendId, out GameObject friendPet)) {
            Destroy(friendPet);
            activeFriendVisits.Remove(friendId);
        }
    }
    
    // Demo methods using PlayerPrefs for simulating a backend
    private void LoadFriendsFromPlayerPrefs() {
        friendsList.Clear();
        
        string friendsJson = PlayerPrefs.GetString("FriendsList", "");
        if (!string.IsNullOrEmpty(friendsJson)) {
            try {
                // Parse JSON array of friends
                // In a real implementation, you'd use JsonUtility.FromJson with a wrapper class
                // or JSON.NET if available
                
                // For demo, create some sample friends
                friendsList.Add(new FriendData {
                    friendId = "FRIEND001",
                    friendName = "Alex",
                    petName = "Fluffy",
                    petLevel = 5,
                    lastVisit = DateTime.Now.AddDays(-1).ToString()
                });
                
                friendsList.Add(new FriendData {
                    friendId = "FRIEND002",
                    friendName = "Sam",
                    petName = "Bubbles",
                    petLevel = 3,
                    lastVisit = DateTime.Now.AddDays(-3).ToString(),
                    hasPendingGift = true
                });
            } catch (Exception e) {
                Debug.LogError($"[MultiplayerManager] Error loading friends: {e.Message}");
            }
        }
    }
    
    private void SaveFriendsToPlayerPrefs() {
        // In a real implementation, you'd use JsonUtility.ToJson with a wrapper class
        // or JSON.NET if available
        
        // For demo, just log
        Debug.Log($"[MultiplayerManager] Saved {friendsList.Count} friends");
    }
    
    // Simulated network methods
    private IEnumerator SimulateAddFriend(string friendCode, Action<bool, string> callback) {
        yield return new WaitForSeconds(simulatedNetworkDelay);
        
        // Simulate success most of the time
        if (UnityEngine.Random.value < 0.8f) {
            // Create a fake friend
            FriendData newFriend = new FriendData {
                friendId = "FRIEND" + UnityEngine.Random.Range(100, 999),
                friendName = "Friend" + UnityEngine.Random.Range(1, 100),
                petName = "Pet" + UnityEngine.Random.Range(1, 100),
                petLevel = UnityEngine.Random.Range(1, 10),
                lastVisit = DateTime.Now.ToString()
            };
            
            friendsList.Add(newFriend);
            SaveFriendsToPlayerPrefs();
            
            callback?.Invoke(true, "Friend added successfully");
        } else {
            callback?.Invoke(false, "Friend code not found");
        }
    }
    
    private IEnumerator SimulateSendGift(string friendId, string giftType, Action<bool, string> callback) {
        yield return new WaitForSeconds(simulatedNetworkDelay);
        
        // Simulate success
        callback?.Invoke(true, "Gift sent successfully");
    }
    
    private IEnumerator SimulateVisitFriend(string friendId, Action<bool, string> callback) {
        yield return new WaitForSeconds(simulatedNetworkDelay);
        
        // Simulate success
        callback?.Invoke(true, "Visit successful");
    }
    
    private IEnumerator SimulateGetFriendPet(string friendId, Action<PetSnapshot> callback) {
        yield return new WaitForSeconds(simulatedNetworkDelay);
        
        // Generate a fake pet snapshot
        PetSnapshot fakePet = new PetSnapshot {
            petName = "FriendPet" + UnityEngine.Random.Range(1, 100),
            ownerName = "Friend" + UnityEngine.Random.Range(1, 100),
            bondLevel = UnityEngine.Random.Range(1, 5),
            temperament = new string[] { "Curious", "Shy", "Playful" }[UnityEngine.Random.Range(0, 3)],
            petLevel = UnityEngine.Random.Range(1, 10),
            totalPlaytime = UnityEngine.Random.Range(10, 500),
            highScore = UnityEngine.Random.Range(100, 10000)
        };
        
        callback?.Invoke(fakePet);
    }
    
    private IEnumerator SimulatePendingGifts(Action<List<FriendVisit>> callback) {
        yield return new WaitForSeconds(simulatedNetworkDelay);
        
        // Occasionally generate a random visit
        if (UnityEngine.Random.value < 0.3f && friendsList.Count > 0) {
            List<FriendVisit> visits = new List<FriendVisit>();
            
            // Pick a random friend
            FriendData friend = friendsList[UnityEngine.Random.Range(0, friendsList.Count)];
            string[] giftTypes = new string[] { "food", "water", "toy", "heart" };
            
            visits.Add(new FriendVisit {
                friendId = friend.friendId,
                timestamp = DateTime.Now.ToString(),
                message = "Just stopping by!",
                giftType = giftTypes[UnityEngine.Random.Range(0, giftTypes.Length)]
            });
            
            callback?.Invoke(visits);
        } else {
            callback?.Invoke(new List<FriendVisit>());
        }
    }
    
    // Actual network methods (implement these with your backend)
    private IEnumerator UploadPetSnapshot(PetSnapshot snapshot) {
        // Convert to JSON
        string json = JsonUtility.ToJson(snapshot);
        
        // Create a web request
        UnityWebRequest request = new UnityWebRequest(apiBaseUrl + "pet/update", "POST");
        byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(json);
        request.uploadHandler = new UploadHandlerRaw(bodyRaw);
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");
        request.SetRequestHeader("User-ID", playerId);
        
        yield return request.SendWebRequest();
        
        if (request.result != UnityWebRequest.Result.Success) {
            Debug.LogError($"[MultiplayerManager] Error uploading pet snapshot: {request.error}");
        }
    }
    
    private IEnumerator AddFriendRequest(string friendCode, Action<bool, string> callback) {
        // Create a web request
        UnityWebRequest request = new UnityWebRequest(apiBaseUrl + "friends/add?code=" + friendCode, "POST");
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("User-ID", playerId);
        
        yield return request.SendWebRequest();
        
        if (request.result == UnityWebRequest.Result.Success) {
            callback?.Invoke(true, "Friend added successfully");
            
            // Update friends list from response
            // Implement based on your API response format
        } else {
            callback?.Invoke(false, request.error);
        }
    }
    
    private IEnumerator SendGiftRequest(string friendId, string giftType, Action<bool, string> callback) {
        // Create request body
        string json = "{\"friendId\":\"" + friendId + "\",\"giftType\":\"" + giftType + "\"}";
        
        UnityWebRequest request = new UnityWebRequest(apiBaseUrl + "friends/gift", "POST");
        byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(json);
        request.uploadHandler = new UploadHandlerRaw(bodyRaw);
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");
        request.SetRequestHeader("User-ID", playerId);
        
        yield return request.SendWebRequest();
        
        if (request.result == UnityWebRequest.Result.Success) {
            callback?.Invoke(true, "Gift sent successfully");
        } else {
            callback?.Invoke(false, request.error);
        }
    }
    
    private IEnumerator VisitFriendRequest(string friendId, Action<bool, string> callback) {
        UnityWebRequest request = new UnityWebRequest(apiBaseUrl + "friends/visit?id=" + friendId, "POST");
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("User-ID", playerId);
        
        yield return request.SendWebRequest();
        
        if (request.result == UnityWebRequest.Result.Success) {
            callback?.Invoke(true, "Visit successful");
        } else {
            callback?.Invoke(false, request.error);
        }
    }
    
    private IEnumerator GetFriendPetRequest(string friendId, Action<PetSnapshot> callback) {
        UnityWebRequest request = new UnityWebRequest(apiBaseUrl + "friends/pet?id=" + friendId, "GET");
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("User-ID", playerId);
        
        yield return request.SendWebRequest();
        
        if (request.result == UnityWebRequest.Result.Success) {
            try {
                PetSnapshot petData = JsonUtility.FromJson<PetSnapshot>(request.downloadHandler.text);
                callback?.Invoke(petData);
            } catch (Exception e) {
                Debug.LogError($"[MultiplayerManager] Error parsing pet data: {e.Message}");
                callback?.Invoke(null);
            }
        } else {
            Debug.LogError($"[MultiplayerManager] Error fetching friend pet: {request.error}");
            callback?.Invoke(null);
        }
    }
    
    private IEnumerator CheckPendingGiftsRequest(Action<List<FriendVisit>> callback) {
        UnityWebRequest request = new UnityWebRequest(apiBaseUrl + "friends/pending", "GET");
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("User-ID", playerId);
        
        yield return request.SendWebRequest();
        
        if (request.result == UnityWebRequest.Result.Success) {
            try {
                // Need a wrapper class for JSON array deserialization
                // For example: VisitWrapper { public List<FriendVisit> visits; }
                // Then: VisitWrapper wrapper = JsonUtility.FromJson<VisitWrapper>(request.downloadHandler.text);
                
                // For now, simulated:
                callback?.Invoke(new List<FriendVisit>());
            } catch (Exception e) {
                Debug.LogError($"[MultiplayerManager] Error parsing pending visits: {e.Message}");
                callback?.Invoke(new List<FriendVisit>());
            }
        } else {
            Debug.LogError($"[MultiplayerManager] Error checking pending gifts: {request.error}");
            callback?.Invoke(new List<FriendVisit>());
        }
    }
}