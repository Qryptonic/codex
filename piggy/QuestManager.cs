using UnityEngine;
using UnityEngine.Events;

/// <summary>
/// Tracks interaction counts and fires a quest-complete event.
/// </summary>
public class QuestManager : MonoBehaviour {
    [Header("Quest Settings")]
    [Tooltip("Number of interactions to complete the quest")]
    [SerializeField] private int interactionsRequired = 5;

    [Header("Events")]
    [Tooltip("Invoked when the quest is completed")]
    public UnityEvent OnQuestComplete;

    private int interactionCount = 0;

    void OnValidate() {
        if (OnQuestComplete == null)
            Debug.LogWarning("[QuestManager] OnQuestComplete event not assigned", this);
        if (interactionsRequired <= 0)
            Debug.LogWarning("[QuestManager] interactionsRequired should be > 0", this);
    }

    /// <summary>
    /// Call each time the pet interacts (feed, play, etc.).
    /// </summary>
    public void CheckQuests(VirtualPetUnity pet) {
        if (pet == null) {
            Debug.LogError("[QuestManager] pet is null", this);
            return;
        }

        interactionCount++;
        if (interactionCount >= interactionsRequired) {
            OnQuestComplete?.Invoke();
            interactionCount = 0;
        }
    }
}