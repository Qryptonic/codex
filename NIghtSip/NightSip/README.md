# NightSip iOS App

An iOS app for NightSip - the perfect pre-bedtime oral hydration solution.

## Features

- Onboarding experience highlighting product benefits
- Daily reminders to use NightSip before bedtime
- Product information and direct purchase capability
- Custom notification scheduling

## Requirements

- iOS 14.0+
- Xcode 13.0+
- Swift 5.5+

## Installation

1. Clone this repository
2. Open `NightSip.xcodeproj` in Xcode
3. Build and run the project

## Project Structure

- **Views/**: SwiftUI screens
  - OnboardingView.swift: Product introduction carousel
  - ProductInfoView.swift: Product details and purchasing
  - SettingsView.swift: Reminder configuration
- **ViewModels/**: MVVM logic
  - SettingsViewModel.swift: Manages reminder settings
- **Services/**: Backend functionality
  - ReminderService.swift: Notification scheduling

## Usage

The app allows users to:

1. Learn about NightSip through an interactive onboarding process
2. Set up customized reminders for using NightSip before bedtime
3. View product information and purchase NightSip through the website

## Known Limitations

- The app requires notification permissions to send reminders
- Product purchase requires an internet connection
- Custom reminder times are device-local and not synced to the cloud

## Testing

- Use "Background Notifications" debug option in Xcode to test notifications
- Test on physical devices to verify notification delivery
- Use Safari Inspector to debug WebView checkout flows

## Contact

For questions or support, please contact support@thenightsip.com 