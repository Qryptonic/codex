using UnityEngine;
using UnityEngine.UI;
using System.Collections;
using System.Collections.Generic;
using DG.Tweening;

/// <summary>
/// Manages an interactive tutorial system for first-time users
/// </summary>
public class TutorialManager : MonoBehaviour {
    [System.Serializable]
    public class TutorialStep {
        public string stepID;
        public string title;
        [TextArea(3, 6)]
        public string instructions;
        public GameObject targetObject;
        public RectTransform highlightArea;
        public UnityEngine.Events.UnityEvent onStepComplete;
        public bool waitForInteraction = true;
        public float autoAdvanceDelay = 0f;
    }
    
    [Header("Tutorial Configuration")]
    [SerializeField] private bool showTutorialOnFirstLaunch = true;
    [SerializeField] private List<TutorialStep> tutorialSteps = new List<TutorialStep>();
    [SerializeField] private bool tutorialActive = false;
    
    [Header("UI References")]
    [SerializeField] private GameObject tutorialPanel;
    [SerializeField] private Text titleText;
    [SerializeField] private Text instructionsText;
    [SerializeField] private Button nextButton;
    [SerializeField] private Button skipButton;
    [SerializeField] private RectTransform highlight;
    [SerializeField] private Image overlayImage;
    
    private int currentStepIndex = 0;
    private TutorialStep currentStep;
    private Dictionary<string, bool> completedSteps = new Dictionary<string, bool>();
    
    void Start() {
        // Check if the tutorial should be shown
        if (showTutorialOnFirstLaunch && !PlayerPrefs.HasKey("TutorialCompleted")) {
            StartTutorial();
        }
        
        // Set up UI button actions
        if (nextButton != null) {
            nextButton.onClick.AddListener(AdvanceToNextStep);
        }
        
        if (skipButton != null) {
            skipButton.onClick.AddListener(EndTutorial);
        }
        
        // Hide tutorial UI initially
        if (tutorialPanel != null) {
            tutorialPanel.SetActive(false);
        }
    }
    
    /// <summary>
    /// Start the tutorial sequence from the beginning
    /// </summary>
    public void StartTutorial() {
        if (tutorialSteps.Count == 0) {
            Debug.LogWarning("[TutorialManager] No tutorial steps defined");
            return;
        }
        
        tutorialActive = true;
        currentStepIndex = 0;
        
        // Show tutorial UI
        if (tutorialPanel != null) {
            tutorialPanel.SetActive(true);
        }
        
        // Start first step
        ShowCurrentStep();
    }
    
    /// <summary>
    /// Show a specific tutorial step by ID
    /// </summary>
    public void ShowTutorialStep(string stepID) {
        if (!tutorialActive) {
            tutorialActive = true;
            tutorialPanel.SetActive(true);
        }
        
        // Find step with matching ID
        for (int i = 0; i < tutorialSteps.Count; i++) {
            if (tutorialSteps[i].stepID == stepID) {
                currentStepIndex = i;
                ShowCurrentStep();
                return;
            }
        }
        
        Debug.LogWarning($"[TutorialManager] Tutorial step '{stepID}' not found");
    }
    
    /// <summary>
    /// End the tutorial and mark as completed
    /// </summary>
    public void EndTutorial() {
        tutorialActive = false;
        
        // Hide tutorial UI with animation
        if (tutorialPanel != null) {
            tutorialPanel.transform.DOScale(0.8f, 0.3f).SetEase(Ease.InBack);
            tutorialPanel.GetComponent<CanvasGroup>().DOFade(0f, 0.3f).OnComplete(() => {
                tutorialPanel.SetActive(false);
                tutorialPanel.transform.localScale = Vector3.one;
                tutorialPanel.GetComponent<CanvasGroup>().alpha = 1f;
            });
        }
        
        // Fade out overlay
        if (overlayImage != null) {
            overlayImage.DOFade(0f, 0.5f).OnComplete(() => {
                overlayImage.gameObject.SetActive(false);
            });
        }
        
        // Hide highlight
        if (highlight != null) {
            highlight.gameObject.SetActive(false);
        }
        
        // Mark tutorial as completed
        PlayerPrefs.SetInt("TutorialCompleted", 1);
        PlayerPrefs.Save();
    }
    
    /// <summary>
    /// Advance to the next tutorial step
    /// </summary>
    public void AdvanceToNextStep() {
        // Mark current step as completed
        if (currentStep != null) {
            completedSteps[currentStep.stepID] = true;
            
            // Trigger completion event
            currentStep.onStepComplete?.Invoke();
        }
        
        currentStepIndex++;
        if (currentStepIndex >= tutorialSteps.Count) {
            // End of tutorial
            EndTutorial();
            return;
        }
        
        ShowCurrentStep();
    }
    
    /// <summary>
    /// Display the current tutorial step
    /// </summary>
    private void ShowCurrentStep() {
        if (currentStepIndex < 0 || currentStepIndex >= tutorialSteps.Count) {
            return;
        }
        
        currentStep = tutorialSteps[currentStepIndex];
        
        // Update UI text
        if (titleText != null) {
            titleText.text = currentStep.title;
        }
        
        if (instructionsText != null) {
            instructionsText.text = currentStep.instructions;
        }
        
        // Position highlight if target is specified
        if (highlight != null && currentStep.highlightArea != null) {
            highlight.gameObject.SetActive(true);
            
            // Position and size highlight to match target area
            highlight.position = currentStep.highlightArea.position;
            highlight.sizeDelta = currentStep.highlightArea.sizeDelta;
            
            // Animate highlight
            highlight.DOScale(1.05f, 0.5f).SetLoops(-1, LoopType.Yoyo).SetEase(Ease.InOutQuad);
        } else if (highlight != null) {
            highlight.gameObject.SetActive(false);
        }
        
        // Auto-advance if needed
        if (!currentStep.waitForInteraction && currentStep.autoAdvanceDelay > 0) {
            StartCoroutine(AutoAdvance(currentStep.autoAdvanceDelay));
        }
    }
    
    private IEnumerator AutoAdvance(float delay) {
        yield return new WaitForSeconds(delay);
        AdvanceToNextStep();
    }
    
    /// <summary>
    /// Check if a specific tutorial step has been completed
    /// </summary>
    public bool IsStepCompleted(string stepID) {
        return completedSteps.ContainsKey(stepID) && completedSteps[stepID];
    }
    
    /// <summary>
    /// Reset tutorial progress (for testing)
    /// </summary>
    public void ResetTutorial() {
        PlayerPrefs.DeleteKey("TutorialCompleted");
        completedSteps.Clear();
    }
    
    /// <summary>
    /// Check if the full tutorial has been completed
    /// </summary>
    public bool HasCompletedTutorial() {
        return PlayerPrefs.HasKey("TutorialCompleted");
    }
}