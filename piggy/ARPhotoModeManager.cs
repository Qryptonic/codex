using UnityEngine;
using UnityEngine.UI;
using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using UnityEngine.XR.ARFoundation;

/// <summary>
/// Manages AR photo mode features for taking photos with pet in real world
/// </summary>
public class ARPhotoModeManager : MonoBehaviour {
    [System.Serializable]
    public class PhotoFilter {
        public string filterName;
        public Material filterMaterial;
        public Sprite filterIcon;
        public string description;
    }
    
    [System.Serializable]
    public class PhotoSticker {
        public string stickerName;
        public Sprite stickerSprite;
        public Vector2 defaultSize = new Vector2(100, 100);
        public bool unlocked = true;
    }
    
    [Header("Camera Settings")]
    [SerializeField] private Camera arCamera;
    [SerializeField] private Camera uiCamera;
    [SerializeField] private int photoResolution = 1080;
    [SerializeField] private bool useNativeShare = true;
    [SerializeField] private KeyCode captureKey = KeyCode.Space;
    
    [Header("UI Elements")]
    [SerializeField] private GameObject photoModePanel;
    [SerializeField] private GameObject filterPanel;
    [SerializeField] private GameObject stickerPanel;
    [SerializeField] private GameObject captureButton;
    [SerializeField] private GameObject shareButton;
    [SerializeField] private GameObject saveButton;
    [SerializeField] private GameObject closeButton;
    [SerializeField] private Image previewImage;
    [SerializeField] private GameObject countdownText;
    [SerializeField] private GameObject photoFlash;
    [SerializeField] private GameObject sharePanel;
    
    [Header("Photo Content")]
    [SerializeField] private List<PhotoFilter> availableFilters = new List<PhotoFilter>();
    [SerializeField] private List<PhotoSticker> availableStickers = new List<PhotoSticker>();
    [SerializeField] private GameObject stickerPrefab;
    [SerializeField] private Transform stickersContainer;
    [SerializeField] private GameObject watermark;
    
    [Header("Capture Effects")]
    [SerializeField] private AudioClip shutterSound;
    [SerializeField] private float flashDuration = 0.2f;
    [SerializeField] private AnimationCurve flashCurve = AnimationCurve.Linear(0, 1, 1, 0);
    
    [Header("References")]
    [SerializeField] private ARPlacement arPlacement;
    [SerializeField] private VirtualPetUnity pet;
    [SerializeField] private MicroAnimationController animationController;
    [SerializeField] private AudioManager audioManager;
    
    private bool photoModeActive = false;
    private Texture2D capturedTexture;
    private string lastPhotoPath;
    private PhotoFilter currentFilter;
    private List<GameObject> activeStickers = new List<GameObject>();
    private RenderTexture photoRenderTexture;
    private bool isPreviewMode = false;
    
    void Start() {
        // Create photo render texture
        photoRenderTexture = new RenderTexture(photoResolution, photoResolution, 24);
        
        // Ensure initial state is inactive
        if (photoModePanel != null) {
            photoModePanel.SetActive(false);
        }
        
        // Set up button listeners
        SetupButtonListeners();
        
        // Hide watermark initially
        if (watermark != null) {
            watermark.SetActive(false);
        }
    }
    
    /// <summary>
    /// Enters photo mode, showing UI and preparing camera
    /// </summary>
    public void EnterPhotoMode() {
        if (photoModeActive) return;
        
        // Ensure AR pet is placed
        if (arPlacement != null && !arPlacement.IsPlaced()) {
            Debug.LogWarning("[ARPhotoMode] Pet not placed in AR yet");
            NotificationManager notificationManager = FindObjectOfType<NotificationManager>();
            if (notificationManager != null) {
                notificationManager.TriggerAlert("Place your pet in AR first!");
            }
            return;
        }
        
        photoModeActive = true;
        
        // Show photo mode UI
        if (photoModePanel != null) {
            photoModePanel.SetActive(true);
        }
        
        // Hide preview image initially
        if (previewImage != null) {
            previewImage.gameObject.SetActive(false);
        }
        
        // Show filter panel
        if (filterPanel != null) {
            filterPanel.SetActive(true);
        }
        
        // Hide sticker panel initially
        if (stickerPanel != null) {
            stickerPanel.SetActive(false);
        }
        
        // Show watermark
        if (watermark != null) {
            watermark.SetActive(true);
        }
        
        // Reset to default filter
        SetFilter(0);
        
        // Prepare pet - special pose/animation
        if (animationController != null) {
            animationController.PlayAnimation("PhotoPose");
        }
        
        // Log event
        DataLogger dataLogger = FindObjectOfType<DataLogger>();
        if (dataLogger != null) {
            Dictionary<string, object> parameters = new Dictionary<string, object>() {
                { "mode", "photo" }
            };
            dataLogger.LogAction("EnterPhotoMode", parameters);
        }
        
        isPreviewMode = false;
    }
    
    /// <summary>
    /// Exits photo mode, restoring normal AR view
    /// </summary>
    public void ExitPhotoMode() {
        if (!photoModeActive) return;
        
        photoModeActive = false;
        
        // Hide photo mode UI
        if (photoModePanel != null) {
            photoModePanel.SetActive(false);
        }
        
        // Clear active stickers
        ClearStickers();
        
        // Hide watermark
        if (watermark != null) {
            watermark.SetActive(false);
        }
        
        // Return pet to normal
        if (animationController != null) {
            animationController.PlayAnimation("Idle");
        }
        
        isPreviewMode = false;
    }
    
    /// <summary>
    /// Takes a photo with current settings
    /// </summary>
    public void CapturePhoto() {
        StartCoroutine(CapturePhotoRoutine());
    }
    
    /// <summary>
    /// Applies a filter to the photo
    /// </summary>
    public void SetFilter(int filterIndex) {
        if (filterIndex < 0 || filterIndex >= availableFilters.Count) {
            currentFilter = null;
            return;
        }
        
        currentFilter = availableFilters[filterIndex];
        
        // Update UI if needed
    }
    
    /// <summary>
    /// Adds a sticker to the current photo
    /// </summary>
    public void AddSticker(int stickerIndex) {
        if (stickerIndex < 0 || stickerIndex >= availableStickers.Count) {
            return;
        }
        
        PhotoSticker sticker = availableStickers[stickerIndex];
        
        if (!sticker.unlocked) {
            // Show unlock notification
            NotificationManager notificationManager = FindObjectOfType<NotificationManager>();
            if (notificationManager != null) {
                notificationManager.TriggerAlert($"Sticker '{sticker.stickerName}' is locked!");
            }
            return;
        }
        
        // Create sticker GameObject
        if (stickersContainer != null && stickerPrefab != null) {
            GameObject stickerObj = Instantiate(stickerPrefab, stickersContainer);
            Image image = stickerObj.GetComponent<Image>();
            if (image != null) {
                image.sprite = sticker.stickerSprite;
                image.SetNativeSize();
                
                // Apply default size
                RectTransform rect = stickerObj.GetComponent<RectTransform>();
                if (rect != null) {
                    rect.sizeDelta = sticker.defaultSize;
                }
            }
            
            // Make draggable if needed
            DraggableUI draggable = stickerObj.GetComponent<DraggableUI>();
            if (draggable == null) {
                draggable = stickerObj.AddComponent<DraggableUI>();
            }
            
            // Add to active stickers
            activeStickers.Add(stickerObj);
        }
    }
    
    /// <summary>
    /// Removes all stickers from the photo
    /// </summary>
    public void ClearStickers() {
        foreach (GameObject sticker in activeStickers) {
            Destroy(sticker);
        }
        activeStickers.Clear();
    }
    
    /// <summary>
    /// Shares the photo to social media
    /// </summary>
    public void SharePhoto() {
        if (capturedTexture == null) {
            Debug.LogWarning("[ARPhotoMode] No photo captured to share");
            return;
        }
        
        if (useNativeShare) {
            StartCoroutine(SharePhotoNative());
        } else {
            // Show share panel with options
            if (sharePanel != null) {
                sharePanel.SetActive(true);
            }
        }
    }
    
    /// <summary>
    /// Saves the photo to device gallery
    /// </summary>
    public void SavePhoto() {
        if (capturedTexture == null) {
            Debug.LogWarning("[ARPhotoMode] No photo captured to save");
            return;
        }
        
        StartCoroutine(SavePhotoToGallery());
    }
    
    // Private implementation methods
    
    private IEnumerator CapturePhotoRoutine() {
        // Show countdown if enabled
        if (countdownText != null) {
            countdownText.SetActive(true);
            Text text = countdownText.GetComponent<Text>();
            
            for (int i = 3; i > 0; i--) {
                if (text != null) {
                    text.text = i.ToString();
                }
                yield return new WaitForSeconds(1f);
            }
            
            countdownText.SetActive(false);
        }
        
        // Play shutter sound
        if (audioManager != null && shutterSound != null) {
            audioManager.Play("PhotoCapture");
        } else {
            AudioSource.PlayClipAtPoint(shutterSound, Camera.main.transform.position);
        }
        
        // Flash effect
        if (photoFlash != null) {
            StartCoroutine(FlashEffect());
        }
        
        // Special pose for the photo
        if (animationController != null) {
            animationController.PlayAnimation("PhotoShoot");
        }
        
        // Wait for flash and pose
        yield return new WaitForSeconds(0.1f);
        
        // Render the scene to texture
        CaptureToTexture();
        
        // Switch to preview mode
        EnterPreviewMode();
    }
    
    private void CaptureToTexture() {
        if (arCamera == null) {
            Debug.LogError("[ARPhotoMode] AR Camera not assigned");
            return;
        }
        
        // Create render texture if needed
        if (photoRenderTexture == null) {
            photoRenderTexture = new RenderTexture(photoResolution, photoResolution, 24);
        }
        
        // Save current camera target
        RenderTexture currentTarget = arCamera.targetTexture;
        
        // Set camera to render to our texture
        arCamera.targetTexture = photoRenderTexture;
        
        // Render the camera
        arCamera.Render();
        
        // Restore original camera target
        arCamera.targetTexture = currentTarget;
        
        // Create a Texture2D from the RenderTexture
        capturedTexture = new Texture2D(photoResolution, photoResolution, TextureFormat.RGB24, false);
        RenderTexture.active = photoRenderTexture;
        capturedTexture.ReadPixels(new Rect(0, 0, photoResolution, photoResolution), 0, 0);
        capturedTexture.Apply();
        
        // Reset RenderTexture active
        RenderTexture.active = null;
        
        // Apply filter if any
        if (currentFilter != null && currentFilter.filterMaterial != null) {
            RenderTexture filteredRT = new RenderTexture(photoResolution, photoResolution, 24);
            Graphics.Blit(capturedTexture, filteredRT, currentFilter.filterMaterial);
            
            // Read back to Texture2D
            RenderTexture.active = filteredRT;
            capturedTexture.ReadPixels(new Rect(0, 0, filteredRT.width, filteredRT.height), 0, 0);
            capturedTexture.Apply();
            RenderTexture.active = null;
            
            // Cleanup
            filteredRT.Release();
            Destroy(filteredRT);
        }
        
        // Include UI camera for stickers and watermark
        if (uiCamera != null && stickersContainer != null) {
            RenderTexture uiRT = new RenderTexture(photoResolution, photoResolution, 24);
            uiCamera.targetTexture = uiRT;
            uiCamera.Render();
            uiCamera.targetTexture = null;
            
            // Combine AR and UI textures
            RenderTexture combinedRT = new RenderTexture(photoResolution, photoResolution, 24);
            Material blendMaterial = new Material(Shader.Find("Unlit/Transparent"));
            
            // Draw AR texture
            Graphics.Blit(capturedTexture, combinedRT);
            
            // Draw UI on top
            blendMaterial.mainTexture = uiRT;
            Graphics.Blit(uiRT, combinedRT, blendMaterial);
            
            // Read back to Texture2D
            RenderTexture.active = combinedRT;
            capturedTexture.ReadPixels(new Rect(0, 0, photoResolution, photoResolution), 0, 0);
            capturedTexture.Apply();
            RenderTexture.active = null;
            
            // Cleanup
            uiRT.Release();
            combinedRT.Release();
            Destroy(uiRT);
            Destroy(combinedRT);
            Destroy(blendMaterial);
        }
    }
    
    private void EnterPreviewMode() {
        isPreviewMode = true;
        
        // Show the captured photo in preview
        if (previewImage != null && capturedTexture != null) {
            previewImage.gameObject.SetActive(true);
            previewImage.sprite = Sprite.Create(
                capturedTexture,
                new Rect(0, 0, capturedTexture.width, capturedTexture.height),
                Vector2.one * 0.5f
            );
        }
        
        // Show share/save buttons
        if (shareButton != null) {
            shareButton.SetActive(true);
        }
        
        if (saveButton != null) {
            saveButton.SetActive(true);
        }
        
        // Hide capture button
        if (captureButton != null) {
            captureButton.SetActive(false);
        }
        
        // Hide filter/sticker panels
        if (filterPanel != null) {
            filterPanel.SetActive(false);
        }
        
        if (stickerPanel != null) {
            stickerPanel.SetActive(false);
        }
        
        // Hide stickers container
        if (stickersContainer != null) {
            stickersContainer.gameObject.SetActive(false);
        }
    }
    
    private void ExitPreviewMode() {
        isPreviewMode = false;
        
        // Hide preview
        if (previewImage != null) {
            previewImage.gameObject.SetActive(false);
        }
        
        // Hide share/save buttons
        if (shareButton != null) {
            shareButton.SetActive(false);
        }
        
        if (saveButton != null) {
            saveButton.SetActive(false);
        }
        
        // Show capture button
        if (captureButton != null) {
            captureButton.SetActive(true);
        }
        
        // Show filter panel
        if (filterPanel != null) {
            filterPanel.SetActive(true);
        }
        
        // Show stickers container
        if (stickersContainer != null) {
            stickersContainer.gameObject.SetActive(true);
        }
    }
    
    private IEnumerator FlashEffect() {
        if (photoFlash == null) yield break;
        
        // Get the flash image
        Image flashImage = photoFlash.GetComponent<Image>();
        if (flashImage == null) yield break;
        
        // Show flash
        photoFlash.SetActive(true);
        
        // Animate flash
        float elapsed = 0f;
        while (elapsed < flashDuration) {
            float t = elapsed / flashDuration;
            Color c = flashImage.color;
            c.a = flashCurve.Evaluate(t);
            flashImage.color = c;
            
            elapsed += Time.deltaTime;
            yield return null;
        }
        
        // Hide flash
        photoFlash.SetActive(false);
    }
    
    private IEnumerator SavePhotoToGallery() {
        // Convert to PNG bytes
        byte[] pngBytes = capturedTexture.EncodeToPNG();
        
        // Generate file path
        string fileName = $"Piggy_Photo_{DateTime.Now.ToString("yyyyMMdd_HHmmss")}.png";
        
        #if UNITY_ANDROID || UNITY_IOS
        // Use native save method on mobile
        string galleryPath = "";
        
        #if UNITY_ANDROID
        // Android implementation
        galleryPath = Path.Combine(Application.persistentDataPath, fileName);
        File.WriteAllBytes(galleryPath, pngBytes);
        
        using (AndroidJavaClass plugin = new AndroidJavaClass("com.unity3d.player.UnityPlayer")) {
            AndroidJavaObject currentActivity = plugin.GetStatic<AndroidJavaObject>("currentActivity");
            using (AndroidJavaObject mediaScanner = new AndroidJavaObject("android.media.MediaScannerConnection")) {
                mediaScanner.CallStatic(
                    "scanFile",
                    currentActivity,
                    new string[] { galleryPath },
                    new string[] { "image/png" },
                    null
                );
            }
        }
        #elif UNITY_IOS
        // iOS implementation
        galleryPath = Path.Combine(Application.temporaryCachePath, fileName);
        File.WriteAllBytes(galleryPath, pngBytes);
        
        using (AndroidJavaClass plugin = new AndroidJavaClass("com.unity3d.player.UnityPlayer")) {
            AndroidJavaObject currentActivity = plugin.GetStatic<AndroidJavaObject>("currentActivity");
            AndroidJavaObject intent = new AndroidJavaObject("android.content.Intent");
            intent.Call<AndroidJavaObject>("setAction", "android.intent.action.MEDIA_SCANNER_SCAN_FILE");
            AndroidJavaClass uriClass = new AndroidJavaClass("android.net.Uri");
            AndroidJavaObject fileObject = new AndroidJavaObject("java.io.File", galleryPath);
            AndroidJavaObject uri = uriClass.CallStatic<AndroidJavaObject>("fromFile", fileObject);
            intent.Call<AndroidJavaObject>("setData", uri);
            currentActivity.Call("sendBroadcast", intent);
        }
        #endif
        
        lastPhotoPath = galleryPath;
        #else
        // Fallback for desktop/editor
        string desktopPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyPictures), fileName);
        File.WriteAllBytes(desktopPath, pngBytes);
        lastPhotoPath = desktopPath;
        #endif
        
        // Show notification
        NotificationManager notificationManager = FindObjectOfType<NotificationManager>();
        if (notificationManager != null) {
            notificationManager.TriggerAlert("Photo saved!");
        }
        
        yield return null;
    }
    
    private IEnumerator SharePhotoNative() {
        if (capturedTexture == null) yield break;
        
        // Save photo temporarily
        byte[] pngBytes = capturedTexture.EncodeToPNG();
        string fileName = $"Piggy_Photo_{DateTime.Now.ToString("yyyyMMdd_HHmmss")}.png";
        string tempPath = Path.Combine(Application.temporaryCachePath, fileName);
        File.WriteAllBytes(tempPath, pngBytes);
        
        // Call native share API
        #if UNITY_ANDROID || UNITY_IOS
        
        #if UNITY_ANDROID
        // Android implementation
        using (AndroidJavaClass intentClass = new AndroidJavaClass("android.content.Intent")) {
            using (AndroidJavaObject intentObject = new AndroidJavaObject("android.content.Intent")) {
                intentObject.Call<AndroidJavaObject>("setAction", intentClass.GetStatic<string>("ACTION_SEND"));
                intentObject.Call<AndroidJavaObject>("setType", "image/png");
                
                using (AndroidJavaClass uriClass = new AndroidJavaClass("android.net.Uri")) {
                    using (AndroidJavaObject fileObject = new AndroidJavaObject("java.io.File", tempPath)) {
                        using (AndroidJavaObject uriObject = uriClass.CallStatic<AndroidJavaObject>("fromFile", fileObject)) {
                            intentObject.Call<AndroidJavaObject>("putExtra", intentClass.GetStatic<string>("EXTRA_STREAM"), uriObject);
                            intentObject.Call<AndroidJavaObject>("putExtra", intentClass.GetStatic<string>("EXTRA_TEXT"), "Check out my virtual pet! #PiggyAR");
                            
                            using (AndroidJavaClass unity = new AndroidJavaClass("com.unity3d.player.UnityPlayer")) {
                                using (AndroidJavaObject currentActivity = unity.GetStatic<AndroidJavaObject>("currentActivity")) {
                                    currentActivity.Call("startActivity", intentObject);
                                }
                            }
                        }
                    }
                }
            }
        }
        #elif UNITY_IOS
        // iOS implementation
        // Note: iOS sharing requires a plugin
        Debug.Log("iOS sharing not implemented in this example");
        #endif
        
        #else
        // Fallback for desktop
        Debug.Log($"Share feature not available on this platform. Photo saved to: {tempPath}");
        #endif
        
        yield return null;
    }
    
    private void SetupButtonListeners() {
        // Set up button listeners
        if (captureButton != null) {
            Button button = captureButton.GetComponent<Button>();
            if (button != null) {
                button.onClick.AddListener(CapturePhoto);
            }
        }
        
        if (shareButton != null) {
            Button button = shareButton.GetComponent<Button>();
            if (button != null) {
                button.onClick.AddListener(SharePhoto);
            }
        }
        
        if (saveButton != null) {
            Button button = saveButton.GetComponent<Button>();
            if (button != null) {
                button.onClick.AddListener(SavePhoto);
            }
        }
        
        if (closeButton != null) {
            Button button = closeButton.GetComponent<Button>();
            if (button != null) {
                button.onClick.AddListener(() => {
                    if (isPreviewMode) {
                        ExitPreviewMode();
                    } else {
                        ExitPhotoMode();
                    }
                });
            }
        }
    }
    
    void Update() {
        // Debug capture with keyboard
        if (photoModeActive && Input.GetKeyDown(captureKey)) {
            CapturePhoto();
        }
    }
    
    void OnDestroy() {
        // Clean up render textures
        if (photoRenderTexture != null) {
            photoRenderTexture.Release();
            Destroy(photoRenderTexture);
        }
    }
}

/// <summary>
/// Utility component for making UI elements draggable
/// </summary>
public class DraggableUI : MonoBehaviour {
    private RectTransform rectTransform;
    private Canvas canvas;
    private Vector2 originalLocalPointerPosition;
    private Vector3 originalPanelLocalPosition;
    private Vector2 originalSize;
    
    void Awake() {
        rectTransform = GetComponent<RectTransform>();
        canvas = GetComponentInParent<Canvas>();
        originalSize = rectTransform.sizeDelta;
    }
    
    public void OnBeginDrag(UnityEngine.EventSystems.PointerEventData data) {
        originalLocalPointerPosition = Vector2.zero;
        if (RectTransformUtility.ScreenPointToLocalPointInRectangle(
            rectTransform, data.position, data.pressEventCamera, out originalLocalPointerPosition)) {
            originalPanelLocalPosition = rectTransform.localPosition;
        }
    }
    
    public void OnDrag(UnityEngine.EventSystems.PointerEventData data) {
        if (canvas == null || rectTransform == null)
            return;
            
        Vector2 localPointerPosition;
        if (RectTransformUtility.ScreenPointToLocalPointInRectangle(
            rectTransform, data.position, data.pressEventCamera, out localPointerPosition)) {
            Vector3 offsetToOriginal = localPointerPosition - originalLocalPointerPosition;
            rectTransform.localPosition = originalPanelLocalPosition + offsetToOriginal;
        }
    }
    
    public void OnPinch(float scaleFactor) {
        // Scale with pinch gesture
        rectTransform.sizeDelta = originalSize * scaleFactor;
    }
}