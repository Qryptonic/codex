import SwiftUI

struct SettingsView: View {
    @StateObject private var viewModel = SettingsViewModel()
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Reminders")) {
                    Toggle("Enable Reminder", isOn: $viewModel.isReminderEnabled)
                        .onChange(of: viewModel.isReminderEnabled) { _ in
                            viewModel.toggleReminder()
                        }
                    
                    if viewModel.isReminderEnabled {
                        Picker("Reminder Type", selection: $viewModel.selectedReminderType) {
                            ForEach(SettingsViewModel.ReminderType.allCases) { type in
                                Text(type.description).tag(type)
                            }
                        }
                        
                        if viewModel.selectedReminderType == .custom {
                            DatePicker("Reminder Time", selection: $viewModel.reminderTime, displayedComponents: .hourAndMinute)
                                .onChange(of: viewModel.reminderTime) { _ in
                                    if viewModel.isReminderEnabled {
                                        viewModel.scheduleReminder()
                                    }
                                }
                        }
                    }
                }
                
                Section(header: Text("About")) {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.secondary)
                    }
                    
                    Button("Privacy Policy") {
                        if let url = URL(string: "https://thenightsip.com/privacy") {
                            UIApplication.shared.open(url)
                        }
                    }
                    
                    Button("Terms of Service") {
                        if let url = URL(string: "https://thenightsip.com/terms") {
                            UIApplication.shared.open(url)
                        }
                    }
                }
                
                Section {
                    VStack(alignment: .center) {
                        Image(systemName: "moonphase.waxing.gibbous")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 80, height: 80)
                            .foregroundColor(.blue)
                            .padding(.vertical)
                        
                        Text("NightSip")
                            .font(.headline)
                        
                        Text("The perfect pre-bedtime oral hydration solution")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .navigationTitle("Settings")
            .onChange(of: viewModel.selectedReminderType) { _ in
                if viewModel.isReminderEnabled {
                    viewModel.scheduleReminder()
                }
            }
        }
    }
}

struct SettingsView_Previews: PreviewProvider {
    static var previews: some View {
        SettingsView()
    }
} 