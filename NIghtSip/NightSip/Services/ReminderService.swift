import Foundation
import UserNotifications
import Combine

class ReminderService: ObservableObject {
    static let shared = ReminderService()
    
    private let notificationCenter = UNUserNotificationCenter.current()
    
    @Published var isNotificationAuthorized = false
    private var cancellables = Set<AnyCancellable>()
    
    private init() {
        checkAuthorizationStatus()
    }
    
    func requestNotificationPermission() {
        notificationCenter.requestAuthorization(options: [.alert, .sound, .badge]) { [weak self] granted, error in
            DispatchQueue.main.async {
                self?.isNotificationAuthorized = granted
            }
            
            if let error = error {
                print("Error requesting notification permission: \(error.localizedDescription)")
            }
        }
    }
    
    private func checkAuthorizationStatus() {
        notificationCenter.getNotificationSettings { [weak self] settings in
            DispatchQueue.main.async {
                self?.isNotificationAuthorized = settings.authorizationStatus == .authorized
            }
        }
    }
    
    func scheduleNightSipReminder(at dateComponents: DateComponents) {
        // Remove any existing reminders first
        cancelReminder()
        
        let content = UNMutableNotificationContent()
        content.title = "Time for your NightSip"
        content.body = "Hydrate and sleep fresh!"
        content.sound = .default
        
        // Create the trigger
        let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
        
        // Create the request
        let request = UNNotificationRequest(identifier: "nightSipReminder", content: content, trigger: trigger)
        
        // Add the snooze action
        let snoozeAction = UNNotificationAction(identifier: "snoozeAction", title: "Snooze", options: [])
        let category = UNNotificationCategory(identifier: "nightSipReminderCategory", actions: [snoozeAction], intentIdentifiers: [], options: [])
        
        notificationCenter.setNotificationCategories([category])
        content.categoryIdentifier = "nightSipReminderCategory"
        
        // Schedule the request
        notificationCenter.add(request) { error in
            if let error = error {
                print("Error scheduling notification: \(error.localizedDescription)")
            }
        }
    }
    
    func scheduleReminderBeforeSleep(minutes: Int = 30) {
        var dateComponents = DateComponents()
        dateComponents.hour = 21 // 9 PM by default
        dateComponents.minute = 30
        
        scheduleNightSipReminder(at: dateComponents)
    }
    
    func cancelReminder() {
        notificationCenter.removeAllPendingNotificationRequests()
    }
} 