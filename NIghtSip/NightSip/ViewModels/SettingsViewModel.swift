import Foundation
import Combine

class SettingsViewModel: ObservableObject {
    enum ReminderType: Int, CaseIterable, Identifiable {
        case beforeSleep
        case custom
        
        var id: Int { self.rawValue }
        
        var description: String {
            switch self {
            case .beforeSleep:
                return "30 minutes before sleep"
            case .custom:
                return "Custom time"
            }
        }
    }
    
    @Published var selectedReminderType: ReminderType = .beforeSleep
    @Published var reminderTime = Date()
    @Published var isReminderEnabled = false
    
    private let reminderService = ReminderService.shared
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        reminderService.$isNotificationAuthorized
            .sink { [weak self] authorized in
                if !authorized {
                    self?.isReminderEnabled = false
                }
            }
            .store(in: &cancellables)
    }
    
    func toggleReminder() {
        if isReminderEnabled {
            scheduleReminder()
        } else {
            cancelReminder()
        }
    }
    
    func scheduleReminder() {
        switch selectedReminderType {
        case .beforeSleep:
            reminderService.scheduleReminderBeforeSleep()
        case .custom:
            let calendar = Calendar.current
            let hour = calendar.component(.hour, from: reminderTime)
            let minute = calendar.component(.minute, from: reminderTime)
            
            var dateComponents = DateComponents()
            dateComponents.hour = hour
            dateComponents.minute = minute
            
            reminderService.scheduleNightSipReminder(at: dateComponents)
        }
    }
    
    func cancelReminder() {
        reminderService.cancelReminder()
    }
} 