using UnityEngine;
using UnityEngine.XR.ARFoundation;
using UnityEngine.XR.ARSubsystems;
using System.Collections.Generic;

/// <summary>
/// Handles AR placement of the pet in the real world
/// </summary>
[RequireComponent(typeof(ARRaycastManager))]
public class ARPlacement : MonoBehaviour {
    [Header("AR Setup")]
    [SerializeField] private GameObject placementIndicator;
    [SerializeField] private GameObject petPrefab;
    [SerializeField] private bool autoPlace = false;
    [SerializeField] private float autoPlaceDelay = 3f;
    
    [Header("Placement Options")]
    [SerializeField] private bool snapToFloor = true;
    [SerializeField] private float placementHeight = 0.05f; // Height adjustment
    [SerializeField] private bool scaleBasedOnDistance = true;
    [SerializeField] private float minScale = 0.5f;
    [SerializeField] private float maxScale = 1.5f;
    
    private ARRaycastManager raycastManager;
    private GameObject placedObject;
    private bool isPlaced = false;
    private float autoPlaceTimer = 0f;
    private List<ARRaycastHit> hits = new List<ARRaycastHit>();
    private Camera arCamera;
    
    void OnValidate() {
        if (placementIndicator == null)
            Debug.LogWarning("[ARPlacement] placementIndicator not assigned", this);
            
        if (petPrefab == null)
            Debug.LogWarning("[ARPlacement] petPrefab not assigned", this);
    }
    
    void Awake() {
        raycastManager = GetComponent<ARRaycastManager>();
        arCamera = Camera.main;
    }
    
    void Start() {
        // Hide indicator until tracking
        if (placementIndicator != null)
            placementIndicator.SetActive(false);
    }
    
    void Update() {
        if (isPlaced)
            return;
            
        // Raycast against AR planes
        Vector2 screenCenter = new Vector2(Screen.width / 2, Screen.height / 2);
        if (raycastManager.Raycast(screenCenter, hits, TrackableType.PlaneWithinPolygon)) {
            // Show placement indicator
            if (placementIndicator != null && !placementIndicator.activeSelf)
                placementIndicator.SetActive(true);
                
            // Update indicator position
            Pose hitPose = hits[0].pose;
            
            // Adjust height if needed
            if (snapToFloor) {
                hitPose.position.y = hits[0].pose.position.y + placementHeight;
            }
            
            if (placementIndicator != null)
                UpdateIndicator(hitPose);
            
            // Handle placement
            if (autoPlace) {
                autoPlaceTimer += Time.deltaTime;
                if (autoPlaceTimer >= autoPlaceDelay) {
                    PlaceObject(hitPose);
                }
            } else if (Input.touchCount > 0 && Input.GetTouch(0).phase == TouchPhase.Began) {
                PlaceObject(hitPose);
            }
        } else {
            // Hide indicator when not tracking
            if (placementIndicator != null)
                placementIndicator.SetActive(false);
                
            autoPlaceTimer = 0f;
        }
    }
    
    private void UpdateIndicator(Pose pose) {
        placementIndicator.transform.position = pose.position;
        placementIndicator.transform.rotation = pose.rotation;
    }
    
    private void PlaceObject(Pose pose) {
        if (petPrefab == null || isPlaced)
            return;
            
        // Instantiate the pet at the hit position
        placedObject = Instantiate(petPrefab, pose.position, pose.rotation);
        
        // Scale based on distance if enabled
        if (scaleBasedOnDistance && arCamera != null) {
            float distance = Vector3.Distance(arCamera.transform.position, pose.position);
            float scale = Mathf.Lerp(maxScale, minScale, distance / 5f); // 5m range
            scale = Mathf.Clamp(scale, minScale, maxScale);
            placedObject.transform.localScale = new Vector3(scale, scale, scale);
        }
        
        // Hide the placement indicator
        if (placementIndicator != null)
            placementIndicator.SetActive(false);
            
        isPlaced = true;
    }
    
    /// <summary>
    /// Reset placement to allow repositioning
    /// </summary>
    public void ResetPlacement() {
        if (placedObject != null)
            Destroy(placedObject);
            
        isPlaced = false;
        autoPlaceTimer = 0f;
    }
    
    /// <summary>
    /// Check if the pet has been placed in AR
    /// </summary>
    public bool IsPlaced() {
        return isPlaced;
    }
    
    /// <summary>
    /// Get reference to the placed pet object
    /// </summary>
    public GameObject GetPlacedObject() {
        return placedObject;
    }
}