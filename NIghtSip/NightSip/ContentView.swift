import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            ProductCatalogView()
                .tabItem {
                    Label("Shop", systemImage: "cart")
                }
            
            OnboardingView()
                .tabItem {
                    Label("About", systemImage: "info.circle")
                }
            
            SleepTrackingView()
                .tabItem {
                    Label("Sleep Tracking", systemImage: "moon.zzz.fill")
                }
            
            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gear")
                }
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
} 