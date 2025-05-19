import Foundation
import Combine
import HealthKit

class SleepTrackingViewModel: ObservableObject {
    private let healthStore = HKHealthStore()
    private var cancellables = Set<AnyCancellable>()
    
    @Published var sleepData: [SleepEntry] = []
    @Published var averageSleepHours: Double = 0
    @Published var sleepQualityScore: Int = 0
    @Published var isAuthorizationRequestInProgress = false
    @Published var isAuthorized = false
    @Published var error: String?
    
    init() {
        checkHealthKitAuthorization()
    }
    
    func checkHealthKitAuthorization() {
        guard HKHealthStore.isHealthDataAvailable() else {
            self.error = "HealthKit is not available on this device"
            return
        }
        
        let typesToRead: Set<HKObjectType> = [
            HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!
        ]
        
        healthStore.getRequestStatusForAuthorization(toShare: Set<HKSampleType>(), read: typesToRead) { (status, error) in
            DispatchQueue.main.async {
                switch status {
                case .unnecessary:
                    self.isAuthorized = true
                    self.fetchSleepData()
                case .shouldRequest:
                    self.isAuthorized = false
                default:
                    self.isAuthorized = false
                }
            }
        }
    }
    
    func requestAuthorization() {
        guard HKHealthStore.isHealthDataAvailable() else {
            self.error = "HealthKit is not available on this device"
            return
        }
        
        isAuthorizationRequestInProgress = true
        
        let typesToRead: Set<HKObjectType> = [
            HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!
        ]
        
        healthStore.requestAuthorization(toShare: Set<HKSampleType>(), read: typesToRead) { success, error in
            DispatchQueue.main.async {
                self.isAuthorizationRequestInProgress = false
                if success {
                    self.isAuthorized = true
                    self.fetchSleepData()
                } else if let error = error {
                    self.error = error.localizedDescription
                }
            }
        }
    }
    
    func fetchSleepData() {
        guard isAuthorized, 
              let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else {
            return
        }
        
        let calendar = Calendar.current
        let now = Date()
        guard let thirtyDaysAgo = calendar.date(byAdding: .day, value: -30, to: now) else {
            return
        }
        
        let predicate = HKQuery.predicateForSamples(withStart: thirtyDaysAgo, end: now, options: .strictStartDate)
        
        let query = HKSampleQuery(sampleType: sleepType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]) { (query, samples, error) in
            guard let samples = samples as? [HKCategorySample], error == nil else {
                DispatchQueue.main.async {
                    self.error = error?.localizedDescription ?? "Unknown error fetching sleep data"
                }
                return
            }
            
            var sleepEntries: [SleepEntry] = []
            var totalSleepHours: Double = 0
            
            // Process the samples to create SleepEntry objects
            for sample in samples {
                if sample.value == HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue ||
                   sample.value == HKCategoryValueSleepAnalysis.asleepCore.rawValue ||
                   sample.value == HKCategoryValueSleepAnalysis.asleepDeep.rawValue ||
                   sample.value == HKCategoryValueSleepAnalysis.asleepREM.rawValue {
                    
                    let startDate = sample.startDate
                    let endDate = sample.endDate
                    let durationInHours = sample.endDate.timeIntervalSince(sample.startDate) / 3600
                    
                    // Only include entries with a reasonable duration
                    if durationInHours >= 0.5 { // At least 30 minutes
                        let sleepQuality: SleepQuality
                        if sample.value == HKCategoryValueSleepAnalysis.asleepDeep.rawValue {
                            sleepQuality = .deep
                        } else if sample.value == HKCategoryValueSleepAnalysis.asleepREM.rawValue {
                            sleepQuality = .rem
                        } else {
                            sleepQuality = .light
                        }
                        
                        let sleepEntry = SleepEntry(
                            date: startDate,
                            duration: durationInHours,
                            quality: sleepQuality
                        )
                        
                        // Check if the entry is for a different night than the last one
                        if let lastDate = sleepEntries.last?.date,
                           !calendar.isDate(startDate, inSameDayAs: lastDate) {
                            sleepEntries.append(sleepEntry)
                            totalSleepHours += durationInHours
                        } else if sleepEntries.isEmpty {
                            sleepEntries.append(sleepEntry)
                            totalSleepHours += durationInHours
                        }
                    }
                }
            }
            
            DispatchQueue.main.async {
                self.sleepData = sleepEntries
                self.averageSleepHours = sleepEntries.isEmpty ? 0 : totalSleepHours / Double(sleepEntries.count)
                self.calculateSleepQualityScore()
            }
        }
        
        healthStore.execute(query)
    }
    
    private func calculateSleepQualityScore() {
        guard !sleepData.isEmpty else {
            sleepQualityScore = 0
            return
        }
        
        // Calculate sleep quality score (0-100)
        // Factors: average sleep duration, sleep consistency, deep sleep percentage
        
        // Duration factor: 7-9 hours is ideal (max 40 points)
        let durationFactor = min(40, Int(averageSleepHours >= 7 && averageSleepHours <= 9 ? 40 : (averageSleepHours / 9) * 40))
        
        // Consistency factor: regular sleep times (max 30 points)
        var consistencyFactor = 30
        if sleepData.count >= 2 {
            var totalVariation: Double = 0
            for i in 0..<sleepData.count-1 {
                let currentBedtime = calendar.component(.hour, from: sleepData[i].date) + calendar.component(.minute, from: sleepData[i].date) / 60
                let previousBedtime = calendar.component(.hour, from: sleepData[i+1].date) + calendar.component(.minute, from: sleepData[i+1].date) / 60
                
                let variation = abs(currentBedtime - previousBedtime)
                totalVariation += variation
            }
            
            let averageVariation = totalVariation / Double(sleepData.count - 1)
            consistencyFactor = Int(max(0, 30 - (averageVariation * 10)))
        }
        
        // Quality factor: percentage of deep sleep (max 30 points)
        let deepSleepEntries = sleepData.filter { $0.quality == .deep }
        let qualityFactor = Int((Double(deepSleepEntries.count) / Double(sleepData.count)) * 30)
        
        sleepQualityScore = min(100, durationFactor + consistencyFactor + qualityFactor)
    }
    
    private var calendar: Calendar {
        var calendar = Calendar.current
        calendar.timeZone = TimeZone.current
        return calendar
    }
    
    func addManualSleepEntry(bedtime: Date, wakeTime: Date, quality: SleepQuality) {
        guard wakeTime > bedtime else {
            self.error = "Wake time must be after bedtime"
            return
        }
        
        let durationInHours = wakeTime.timeIntervalSince(bedtime) / 3600
        
        let entry = SleepEntry(
            date: bedtime,
            duration: durationInHours,
            quality: quality
        )
        
        sleepData.append(entry)
        sleepData.sort { $0.date > $1.date } // Sort by date, newest first
        
        // Recalculate averages
        let totalHours = sleepData.reduce(0) { $0 + $1.duration }
        averageSleepHours = sleepData.isEmpty ? 0 : totalHours / Double(sleepData.count)
        
        calculateSleepQualityScore()
    }
}

enum SleepQuality: String, CaseIterable, Identifiable {
    case light = "Light"
    case deep = "Deep"
    case rem = "REM"
    
    var id: String { self.rawValue }
    
    var description: String {
        switch self {
        case .light:
            return "Light Sleep"
        case .deep:
            return "Deep Sleep"
        case .rem:
            return "REM Sleep"
        }
    }
    
    var iconName: String {
        switch self {
        case .light:
            return "moon"
        case .deep:
            return "moon.zzz"
        case .rem:
            return "moon.stars"
        }
    }
}

struct SleepEntry: Identifiable {
    let id = UUID()
    let date: Date
    let duration: Double // Hours
    let quality: SleepQuality
    
    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }
    
    var formattedDuration: String {
        let hours = Int(duration)
        let minutes = Int((duration - Double(hours)) * 60)
        return "\(hours)h \(minutes)m"
    }
} 