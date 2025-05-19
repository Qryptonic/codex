import SwiftUI
import Charts

struct SleepTrackingView: View {
    @StateObject private var viewModel = SleepTrackingViewModel()
    @State private var showingAddSleepEntrySheet = false
    @State private var selectedTabIndex = 0
    @State private var showingAuthorizationAlert = false
    
    private let tabTitles = ["Dashboard", "History", "Insights"]
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Tab selector
                HStack {
                    ForEach(0..<tabTitles.count, id: \.self) { index in
                        Button(action: {
                            withAnimation {
                                selectedTabIndex = index
                            }
                        }) {
                            Text(tabTitles[index])
                                .font(.headline)
                                .padding(.vertical, 12)
                                .padding(.horizontal, 16)
                                .background(selectedTabIndex == index ? Color.blue.opacity(0.1) : Color.clear)
                                .foregroundColor(selectedTabIndex == index ? .blue : .gray)
                                .cornerRadius(10)
                        }
                    }
                    Spacer()
                }
                .padding(.horizontal)
                .background(Color(UIColor.systemBackground))
                
                Divider()
                
                // Content view
                ZStack {
                    // Dashboard tab
                    if selectedTabIndex == 0 {
                        dashboardView
                            .transition(.opacity)
                    }
                    
                    // History tab
                    else if selectedTabIndex == 1 {
                        historyView
                            .transition(.opacity)
                    }
                    
                    // Insights tab
                    else {
                        insightsView
                            .transition(.opacity)
                    }
                }
                .animation(.easeInOut, value: selectedTabIndex)
            }
            .navigationTitle("Sleep Tracking")
            .navigationBarItems(trailing: Button(action: {
                showingAddSleepEntrySheet = true
            }) {
                Image(systemName: "plus")
            })
            .sheet(isPresented: $showingAddSleepEntrySheet) {
                AddSleepEntryView(viewModel: viewModel)
            }
            .alert(isPresented: $showingAuthorizationAlert) {
                Alert(
                    title: Text("Health Data Access"),
                    message: Text("NightSip needs access to your sleep data to track your sleep patterns. This will help provide personalized insights for better sleep quality."),
                    primaryButton: .default(Text("Allow")) {
                        viewModel.requestAuthorization()
                    },
                    secondaryButton: .cancel()
                )
            }
            .onAppear {
                if !viewModel.isAuthorized && !viewModel.isAuthorizationRequestInProgress {
                    showingAuthorizationAlert = true
                }
            }
        }
    }
    
    private var dashboardView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Sleep Quality Score Card
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        Text("Sleep Quality Score")
                            .font(.headline)
                        Spacer()
                        Text(viewModel.sleepData.isEmpty ? "No Data" : "\(viewModel.sleepQualityScore)/100")
                            .font(.headline)
                            .foregroundColor(sleepScoreColor)
                    }
                    
                    if !viewModel.sleepData.isEmpty {
                        // Progress bar
                        ZStack(alignment: .leading) {
                            Rectangle()
                                .frame(height: 8)
                                .foregroundColor(Color(.systemGray5))
                                .cornerRadius(4)
                            
                            Rectangle()
                                .frame(width: CGFloat(viewModel.sleepQualityScore) / 100 * UIScreen.main.bounds.width - 48, height: 8)
                                .foregroundColor(sleepScoreColor)
                                .cornerRadius(4)
                        }
                        
                        // Score description
                        Text(sleepScoreDescription)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
                .padding()
                .background(Color(.secondarySystemBackground))
                .cornerRadius(12)
                
                // Average Sleep Duration Card
                VStack(alignment: .leading, spacing: 12) {
                    Text("Average Sleep Duration")
                        .font(.headline)
                    
                    if viewModel.sleepData.isEmpty {
                        Text("No Data")
                            .font(.title)
                            .fontWeight(.bold)
                    } else {
                        HStack(alignment: .firstTextBaseline) {
                            Text(String(format: "%.1f", viewModel.averageSleepHours))
                                .font(.system(size: 36, weight: .bold))
                            
                            Text("hours")
                                .font(.title3)
                                .foregroundColor(.secondary)
                                .padding(.leading, 4)
                        }
                        
                        HStack {
                            Image(systemName: sleepDurationFeedbackIcon)
                                .foregroundColor(sleepDurationFeedbackColor)
                            
                            Text(sleepDurationFeedback)
                                .font(.subheadline)
                                .foregroundColor(sleepDurationFeedbackColor)
                        }
                    }
                }
                .padding()
                .background(Color(.secondarySystemBackground))
                .cornerRadius(12)
                
                // Last Night's Sleep Card
                VStack(alignment: .leading, spacing: 16) {
                    Text("Last Night's Sleep")
                        .font(.headline)
                    
                    if let lastSleep = viewModel.sleepData.first {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Image(systemName: lastSleep.quality.iconName)
                                    .foregroundColor(.blue)
                                
                                Text(lastSleep.quality.description)
                                    .foregroundColor(.blue)
                                
                                Spacer()
                                
                                Text(lastSleep.formattedDuration)
                                    .font(.headline)
                            }
                            
                            Text(lastSleep.formattedDate)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    } else {
                        Text("No data recorded")
                            .foregroundColor(.secondary)
                    }
                }
                .padding()
                .background(Color(.secondarySystemBackground))
                .cornerRadius(12)
                
                // Reminder to use NightSip
                HStack {
                    Image(systemName: "drop.fill")
                        .foregroundColor(.blue)
                        .font(.title2)
                    
                    VStack(alignment: .leading) {
                        Text("Optimize Your Sleep")
                            .font(.headline)
                        
                        Text("Remember to use NightSip 30 minutes before bedtime for better hydration and sleep quality.")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
                .padding()
                .background(Color.blue.opacity(0.1))
                .cornerRadius(12)
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
    }
    
    private var historyView: some View {
        Group {
            if viewModel.sleepData.isEmpty {
                VStack(spacing: 20) {
                    Image(systemName: "moon.zzz")
                        .font(.system(size: 64))
                        .foregroundColor(.blue.opacity(0.7))
                    
                    Text("No Sleep Data")
                        .font(.title2)
                        .fontWeight(.semibold)
                    
                    Text("Add your sleep records or enable Health integration to track your sleep patterns.")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 40)
                    
                    Button(action: {
                        showingAddSleepEntrySheet = true
                    }) {
                        Text("Add Sleep Record")
                            .font(.headline)
                            .foregroundColor(.white)
                            .padding()
                            .background(Color.blue)
                            .cornerRadius(10)
                    }
                    .padding(.top, 10)
                }
                .padding()
            } else {
                List {
                    ForEach(viewModel.sleepData) { entry in
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text(entry.formattedDate)
                                    .font(.headline)
                                
                                Spacer()
                                
                                HStack {
                                    Image(systemName: entry.quality.iconName)
                                        .foregroundColor(.blue)
                                    
                                    Text(entry.quality.description)
                                        .font(.subheadline)
                                        .foregroundColor(.blue)
                                }
                            }
                            
                            HStack {
                                Image(systemName: "clock")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                
                                Text(entry.formattedDuration)
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding(.vertical, 8)
                    }
                }
            }
        }
    }
    
    private var insightsView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // No data view
                if viewModel.sleepData.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "chart.bar.xaxis")
                            .font(.system(size: 64))
                            .foregroundColor(.blue.opacity(0.7))
                        
                        Text("Insights Not Available")
                            .font(.title2)
                            .fontWeight(.semibold)
                        
                        Text("Add more sleep data to receive personalized insights and recommendations.")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 40)
                        
                        Button(action: {
                            showingAddSleepEntrySheet = true
                        }) {
                            Text("Add Sleep Record")
                                .font(.headline)
                                .foregroundColor(.white)
                                .padding()
                                .background(Color.blue)
                                .cornerRadius(10)
                        }
                        .padding(.top, 10)
                    }
                    .padding(.vertical, 50)
                    .frame(maxWidth: .infinity)
                } else {
                    // Sleep duration chart
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Weekly Sleep Duration")
                            .font(.headline)
                            .padding(.bottom, 8)
                        
                        // Chart view
                        sleepDurationChart
                            .frame(height: 200)
                            .padding(.vertical, 8)
                    }
                    .padding()
                    .background(Color(.secondarySystemBackground))
                    .cornerRadius(12)
                    
                    // Sleep quality distribution
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Sleep Quality Distribution")
                            .font(.headline)
                            .padding(.bottom, 8)
                        
                        sleepQualityDistributionView
                    }
                    .padding()
                    .background(Color(.secondarySystemBackground))
                    .cornerRadius(12)
                    
                    // Personalized recommendations
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Recommendations")
                            .font(.headline)
                        
                        ForEach(sleepRecommendations, id: \.self) { recommendation in
                            HStack(alignment: .top, spacing: 16) {
                                Image(systemName: "lightbulb.fill")
                                    .foregroundColor(.yellow)
                                    .frame(width: 24, height: 24)
                                
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(recommendation)
                                        .font(.subheadline)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                            }
                            .padding(.vertical, 4)
                        }
                    }
                    .padding()
                    .background(Color(.secondarySystemBackground))
                    .cornerRadius(12)
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
    }
    
    // MARK: - Sleep Duration Chart
    
    @ViewBuilder
    private var sleepDurationChart: some View {
        if #available(iOS 16.0, *) {
            Chart {
                ForEach(Array(viewModel.sleepData.prefix(7).reversed()), id: \.id) { entry in
                    BarMark(
                        x: .value("Date", entry.formattedDate),
                        y: .value("Hours", entry.duration)
                    )
                    .foregroundStyle(Color.blue.gradient)
                    .cornerRadius(4)
                }
                
                RuleMark(y: .value("Recommended", 8))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [5, 5]))
                    .foregroundStyle(.green)
                    .annotation(position: .top, alignment: .trailing) {
                        Text("Recommended")
                            .font(.caption)
                            .foregroundColor(.green)
                    }
            }
        } else {
            // Fallback for iOS < 16
            VStack(alignment: .leading, spacing: 16) {
                // Simple bar graph implementation
                HStack(alignment: .bottom, spacing: 8) {
                    ForEach(Array(viewModel.sleepData.prefix(7).reversed()), id: \.id) { entry in
                        VStack {
                            Spacer()
                            
                            Rectangle()
                                .fill(Color.blue)
                                .frame(width: 30, height: CGFloat(min(entry.duration * 20, 160)))
                                .cornerRadius(4)
                            
                            Text(entry.formattedDate.split(separator: " ").first ?? "")
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .fixedSize()
                                .frame(width: 30)
                                .rotationEffect(.degrees(-45))
                                .offset(y: 20)
                        }
                        .frame(height: 200)
                    }
                }
                .overlay(
                    Rectangle()
                        .stroke(style: StrokeStyle(lineWidth: 1, dash: [5, 5]))
                        .foregroundColor(.green)
                        .frame(height: 1)
                        .offset(y: -100), // 8 hours = 160px
                    alignment: .bottom
                )
                
                Text("Recommended: 8 hours")
                    .font(.caption)
                    .foregroundColor(.green)
            }
        }
    }
    
    // MARK: - Sleep Quality Distribution
    
    private var sleepQualityDistributionView: some View {
        let lightCount = viewModel.sleepData.filter { $0.quality == .light }.count
        let deepCount = viewModel.sleepData.filter { $0.quality == .deep }.count
        let remCount = viewModel.sleepData.filter { $0.quality == .rem }.count
        let total = Double(viewModel.sleepData.count)
        
        return VStack(spacing: 16) {
            ForEach(SleepQuality.allCases) { quality in
                let count: Int
                switch quality {
                case .light: count = lightCount
                case .deep: count = deepCount
                case .rem: count = remCount
                }
                
                let percentage = total > 0 ? Double(count) / total : 0
                
                HStack {
                    Image(systemName: quality.iconName)
                        .foregroundColor(.blue)
                        .frame(width: 24)
                    
                    Text(quality.description)
                        .frame(width: 100, alignment: .leading)
                    
                    // Progress bar
                    ZStack(alignment: .leading) {
                        Rectangle()
                            .frame(height: 8)
                            .foregroundColor(Color(.systemGray5))
                            .cornerRadius(4)
                        
                        Rectangle()
                            .frame(width: CGFloat(percentage) * (UIScreen.main.bounds.width - 200), height: 8)
                            .foregroundColor(.blue)
                            .cornerRadius(4)
                    }
                    
                    Text("\(Int(percentage * 100))%")
                        .frame(width: 40, alignment: .trailing)
                        .font(.footnote)
                }
            }
        }
    }
    
    // MARK: - Helper Properties
    
    private var sleepScoreColor: Color {
        switch viewModel.sleepQualityScore {
        case 0..<50:
            return .red
        case 50..<75:
            return .orange
        default:
            return .green
        }
    }
    
    private var sleepScoreDescription: String {
        switch viewModel.sleepQualityScore {
        case 0..<50:
            return "Your sleep quality needs improvement. Try establishing a regular sleep schedule."
        case 50..<75:
            return "Your sleep quality is adequate. Small adjustments could help you feel more rested."
        case 75...100:
            return "Excellent sleep quality! Keep up your good sleep habits."
        default:
            return ""
        }
    }
    
    private var sleepDurationFeedback: String {
        if viewModel.averageSleepHours < 6 {
            return "Below recommended range. Aim for 7-9 hours."
        } else if viewModel.averageSleepHours >= 6 && viewModel.averageSleepHours < 7 {
            return "Slightly below recommended range."
        } else if viewModel.averageSleepHours >= 7 && viewModel.averageSleepHours <= 9 {
            return "Perfect range! Keep it up."
        } else {
            return "Above recommended range. Quality may be better than quantity."
        }
    }
    
    private var sleepDurationFeedbackIcon: String {
        if viewModel.averageSleepHours < 7 {
            return "arrow.down.circle"
        } else if viewModel.averageSleepHours > 9 {
            return "arrow.up.circle"
        } else {
            return "checkmark.circle"
        }
    }
    
    private var sleepDurationFeedbackColor: Color {
        if viewModel.averageSleepHours >= 7 && viewModel.averageSleepHours <= 9 {
            return .green
        } else if (viewModel.averageSleepHours >= 6 && viewModel.averageSleepHours < 7) || viewModel.averageSleepHours > 9 {
            return .orange
        } else {
            return .red
        }
    }
    
    private var sleepRecommendations: [String] {
        var recommendations: [String] = []
        
        // Low sleep duration
        if viewModel.averageSleepHours < 7 {
            recommendations.append("Try to get to bed 30 minutes earlier. Using NightSip before bed can help you fall asleep faster.")
        }
        
        // Inconsistent sleep times
        if viewModel.sleepQualityScore < 75 {
            recommendations.append("Maintain a consistent sleep schedule, even on weekends. This helps regulate your body's internal clock.")
        }
        
        // Low deep sleep
        if viewModel.sleepData.filter({ $0.quality == .deep }).count < viewModel.sleepData.count / 4 {
            recommendations.append("Increase deep sleep by exercising regularly, but not too close to bedtime. Also, try using NightSip to stay hydrated overnight.")
        }
        
        // Add a reminder about using NightSip
        recommendations.append("Using NightSip 30 minutes before bedtime helps ensure proper oral hydration throughout the night, leading to better sleep quality and fresher breath in the morning.")
        
        return recommendations
    }
}

struct AddSleepEntryView: View {
    @Environment(\.presentationMode) var presentationMode
    @ObservedObject var viewModel: SleepTrackingViewModel
    
    @State private var bedtime = Date()
    @State private var wakeTime = Date().addingTimeInterval(8 * 3600) // 8 hours later
    @State private var selectedQuality: SleepQuality = .light
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Sleep Details")) {
                    DatePicker("Bedtime", selection: $bedtime, displayedComponents: [.date, .hourAndMinute])
                    
                    DatePicker("Wake time", selection: $wakeTime, displayedComponents: [.date, .hourAndMinute])
                        .onChange(of: wakeTime) { newValue in
                            if newValue < bedtime {
                                wakeTime = bedtime.addingTimeInterval(30 * 60) // At least 30 minutes
                            }
                        }
                    
                    Picker("Sleep Quality", selection: $selectedQuality) {
                        ForEach(SleepQuality.allCases) { quality in
                            HStack {
                                Image(systemName: quality.iconName)
                                Text(quality.description)
                            }
                            .tag(quality)
                        }
                    }
                }
                
                Section {
                    Button("Save") {
                        viewModel.addManualSleepEntry(bedtime: bedtime, wakeTime: wakeTime, quality: selectedQuality)
                        presentationMode.wrappedValue.dismiss()
                    }
                    .frame(maxWidth: .infinity, alignment: .center)
                    .foregroundColor(.blue)
                }
            }
            .navigationTitle("Add Sleep Record")
            .navigationBarItems(trailing: Button("Cancel") {
                presentationMode.wrappedValue.dismiss()
            })
        }
    }
}

struct SleepTrackingView_Previews: PreviewProvider {
    static var previews: some View {
        SleepTrackingView()
    }
} 