import SwiftUI
import SafariServices

struct ProductInfoView: View {
    @State private var showingSafari = false
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Hero Image
                Image(systemName: "drop.fill")
                    .resizable()
                    .scaledToFit()
                    .frame(height: 200)
                    .frame(maxWidth: .infinity)
                    .foregroundColor(.blue)
                    .padding(.vertical)
                
                // Product Name
                Text("NightSip")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .padding(.horizontal)
                
                // Product Description
                Text("The perfect pre-bedtime oral hydration solution")
                    .font(.title3)
                    .foregroundColor(.secondary)
                    .padding(.horizontal)
                
                // Benefits
                VStack(alignment: .leading, spacing: 10) {
                    Text("Benefits")
                        .font(.headline)
                        .padding(.top)
                    
                    BenefitRow(icon: "moon.zzz.fill", text: "Improves overnight oral hygiene")
                    BenefitRow(icon: "wind", text: "Neutralizes morning breath")
                    BenefitRow(icon: "drop.fill", text: "Prevents dry mouth while sleeping")
                    BenefitRow(icon: "heart.fill", text: "Made with natural ingredients")
                    BenefitRow(icon: "leaf.fill", text: "Xylitol promotes dental health")
                }
                .padding(.horizontal)
                
                // Ingredients
                VStack(alignment: .leading, spacing: 10) {
                    Text("Key Ingredients")
                        .font(.headline)
                        .padding(.top)
                    
                    Text("• Baking soda & zinc for odor neutralization")
                    Text("• Xylitol & aloe for soothing hydration")
                    Text("• Mint & electrolytes for freshness")
                }
                .padding(.horizontal)
                
                // Buy Button
                Button(action: {
                    showingSafari = true
                }) {
                    Text("Buy Now")
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .cornerRadius(10)
                }
                .padding()
            }
        }
        .sheet(isPresented: $showingSafari) {
            SafariView(url: URL(string: "https://thenightsip.com")!)
        }
        .navigationTitle("Product Info")
    }
}

struct BenefitRow: View {
    let icon: String
    let text: String
    
    var body: some View {
        HStack(spacing: 15) {
            Image(systemName: icon)
                .foregroundColor(.blue)
                .frame(width: 25)
            
            Text(text)
                .font(.body)
            
            Spacer()
        }
    }
}

struct SafariView: UIViewControllerRepresentable {
    let url: URL
    
    func makeUIViewController(context: UIViewControllerRepresentableContext<SafariView>) -> SFSafariViewController {
        return SFSafariViewController(url: url)
    }
    
    func updateUIViewController(_ uiViewController: SFSafariViewController, context: UIViewControllerRepresentableContext<SafariView>) {
    }
}

struct ProductInfoView_Previews: PreviewProvider {
    static var previews: some View {
        ProductInfoView()
    }
} 