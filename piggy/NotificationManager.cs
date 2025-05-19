using UnityEngine;
using UnityEngine.UI;
using System.Collections;
using System.Collections.Generic;

/// <summary>
/// Manages in-game alerts and notifications
/// </summary>
public class NotificationManager : MonoBehaviour {
    [Header("UI References")]
    [SerializeField] private GameObject notificationPanel;
    [SerializeField] private Text notificationText;
    [SerializeField] private float displayDuration = 3f;
    [SerializeField] private float queueDelay = 1f;
    
    [Header("Animation")]
    [SerializeField] private bool animateNotifications = true;
    [SerializeField] private AnimationCurve fadeCurve = AnimationCurve.EaseInOut(0, 0, 1, 1);
    
    private Queue<string> notificationQueue = new Queue<string>();
    private bool isShowingNotification = false;
    
    void OnValidate() {
        if (notificationPanel == null)
            Debug.LogWarning("[NotificationManager] notificationPanel not assigned", this);
        
        if (notificationText == null)
            Debug.LogWarning("[NotificationManager] notificationText not assigned", this);
    }
    
    void Start() {
        // Ensure panel is hidden at start
        if (notificationPanel != null)
            notificationPanel.SetActive(false);
    }
    
    /// <summary>
    /// Trigger multiple alerts from a list
    /// </summary>
    public void TriggerAlerts(List<string> alerts) {
        if (alerts == null || alerts.Count == 0)
            return;
            
        foreach (string alert in alerts) {
            TriggerAlert(alert);
        }
    }
    
    /// <summary>
    /// Show a single notification
    /// </summary>
    public void TriggerAlert(string message) {
        if (string.IsNullOrEmpty(message))
            return;
            
        notificationQueue.Enqueue(message);
        
        if (!isShowingNotification) {
            StartCoroutine(ProcessNotificationQueue());
        }
    }
    
    private IEnumerator ProcessNotificationQueue() {
        isShowingNotification = true;
        
        while (notificationQueue.Count > 0) {
            string message = notificationQueue.Dequeue();
            
            if (notificationText != null)
                notificationText.text = message;
                
            if (notificationPanel != null)
                notificationPanel.SetActive(true);
                
            if (animateNotifications) {
                yield return StartCoroutine(AnimateNotification());
            } else {
                yield return new WaitForSeconds(displayDuration);
            }
            
            if (notificationPanel != null)
                notificationPanel.SetActive(false);
                
            // Wait before showing next notification
            if (notificationQueue.Count > 0)
                yield return new WaitForSeconds(queueDelay);
        }
        
        isShowingNotification = false;
    }
    
    private IEnumerator AnimateNotification() {
        float startTime = Time.time;
        CanvasGroup canvasGroup = notificationPanel.GetComponent<CanvasGroup>();
        
        // Add CanvasGroup if missing
        if (canvasGroup == null)
            canvasGroup = notificationPanel.AddComponent<CanvasGroup>();
            
        // Fade in
        float elapsed = 0f;
        while (elapsed < 0.5f) {
            elapsed = Time.time - startTime;
            float normalizedTime = elapsed / 0.5f;
            canvasGroup.alpha = fadeCurve.Evaluate(normalizedTime);
            yield return null;
        }
        
        // Show at full opacity
        canvasGroup.alpha = 1f;
        yield return new WaitForSeconds(displayDuration - 1f);
        
        // Fade out
        startTime = Time.time;
        elapsed = 0f;
        while (elapsed < 0.5f) {
            elapsed = Time.time - startTime;
            float normalizedTime = elapsed / 0.5f;
            canvasGroup.alpha = fadeCurve.Evaluate(1f - normalizedTime);
            yield return null;
        }
        canvasGroup.alpha = 0f;
    }
}