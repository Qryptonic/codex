import SwiftUI

struct OnboardingView: View {
    @State private var selectedPage = 0
    @State private var isOnboardingComplete = false
    
    private let pages = [
        OnboardingPage(
            title: "Baking Soda & Zinc",
            description: "Our proprietary blend helps reduce bacteria and neutralize odors while you sleep.",
            imageSystemName: "drop.fill"
        ),
        OnboardingPage(
            title: "Xylitol & Aloe",
            description: "Natural ingredients that soothe your throat and promote oral health overnight.",
            imageSystemName: "leaf.fill"
        ),
        OnboardingPage(
            title: "Mint & Electrolytes",
            description: "Wake up refreshed with a clean feeling that lasts all day.",
            imageSystemName: "bolt.fill"
        )
    ]
    
    var body: some View {
        if isOnboardingComplete {
            ProductInfoView()
        } else {
            VStack {
                TabView(selection: $selectedPage) {
                    ForEach(0..<pages.count, id: \.self) { index in
                        OnboardingPageView(page: pages[index])
                            .tag(index)
                    }
                }
                .tabViewStyle(PageTabViewStyle())
                .indexViewStyle(PageIndexViewStyle(backgroundDisplayMode: .always))
                
                Button(action: {
                    if selectedPage < pages.count - 1 {
                        withAnimation {
                            selectedPage += 1
                        }
                    } else {
                        requestNotificationPermission()
                    }
                }) {
                    Text(selectedPage < pages.count - 1 ? "Next" : "Get Started")
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .cornerRadius(10)
                }
                .padding(.horizontal)
                .padding(.bottom, 20)
            }
            .navigationTitle("Welcome to NightSip")
        }
    }
    
    private func requestNotificationPermission() {
        let reminderService = ReminderService.shared
        reminderService.requestNotificationPermission()
        withAnimation {
            isOnboardingComplete = true
        }
    }
}

struct OnboardingPage {
    let title: String
    let description: String
    let imageSystemName: String
}

struct OnboardingPageView: View {
    let page: OnboardingPage
    
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: page.imageSystemName)
                .resizable()
                .scaledToFit()
                .frame(width: 150, height: 150)
                .foregroundColor(.blue)
                .padding(.top, 50)
            
            Text(page.title)
                .font(.title)
                .fontWeight(.bold)
                .padding(.horizontal)
            
            Text(page.description)
                .font(.body)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
                .foregroundColor(.secondary)
            
            Spacer()
        }
    }
}

struct OnboardingView_Previews: PreviewProvider {
    static var previews: some View {
        OnboardingView()
    }
} 