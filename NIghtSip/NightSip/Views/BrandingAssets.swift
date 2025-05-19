import SwiftUI

// MARK: - Brand Colors
struct BrandColors {
    static let primary = Color("PrimaryBlue")
    static let secondary = Color("MintGreen")
    static let accent = Color("AccentPurple")
    static let background = Color("BackgroundCream")
    static let text = Color("TextDark")
    
    // Fallbacks for when we're on iOS versions that don't support named assets
    static var primaryFallback: Color { Color(red: 0.2, green: 0.5, blue: 0.8) }
    static var secondaryFallback: Color { Color(red: 0.4, green: 0.8, blue: 0.7) }
    static var accentFallback: Color { Color(red: 0.6, green: 0.4, blue: 0.8) }
    static var backgroundFallback: Color { Color(red: 0.98, green: 0.97, blue: 0.94) }
    static var textFallback: Color { Color(red: 0.2, green: 0.2, blue: 0.25) }
}

// MARK: - Brand Typography
struct BrandTypography {
    static func title() -> some ViewModifier {
        return TextStyle(font: .system(.title, design: .rounded), weight: .bold)
    }
    
    static func heading() -> some ViewModifier {
        return TextStyle(font: .system(.headline, design: .rounded), weight: .semibold)
    }
    
    static func subheading() -> some ViewModifier {
        return TextStyle(font: .system(.subheadline, design: .rounded), weight: .medium)
    }
    
    static func body() -> some ViewModifier {
        return TextStyle(font: .system(.body, design: .rounded), weight: .regular)
    }
    
    static func caption() -> some ViewModifier {
        return TextStyle(font: .system(.caption, design: .rounded), weight: .regular)
    }
}

// MARK: - Button Styles
struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(.headline, design: .rounded).weight(.semibold))
            .foregroundColor(.white)
            .padding(.vertical, 14)
            .padding(.horizontal, 20)
            .background(BrandColors.primary)
            .cornerRadius(12)
            .shadow(color: BrandColors.primary.opacity(0.3), radius: 8, x: 0, y: 4)
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: configuration.isPressed)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(.headline, design: .rounded).weight(.semibold))
            .foregroundColor(BrandColors.primary)
            .padding(.vertical, 14)
            .padding(.horizontal, 20)
            .background(Color.white)
            .cornerRadius(12)
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(BrandColors.primary, lineWidth: 2))
            .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 4)
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: configuration.isPressed)
    }
}

// MARK: - Card Styles
struct CardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(20)
            .background(Color.white)
            .cornerRadius(16)
            .shadow(color: Color.black.opacity(0.08), radius: 15, x: 0, y: 5)
    }
}

// MARK: - Helper Extensions
extension View {
    func brandTitle() -> some View {
        self.modifier(BrandTypography.title())
    }
    
    func brandHeading() -> some View {
        self.modifier(BrandTypography.heading())
    }
    
    func brandSubheading() -> some View {
        self.modifier(BrandTypography.subheading())
    }
    
    func brandBody() -> some View {
        self.modifier(BrandTypography.body())
    }
    
    func brandCaption() -> some View {
        self.modifier(BrandTypography.caption())
    }
    
    func cardStyle() -> some View {
        self.modifier(CardModifier())
    }
}

// MARK: - Text Style
struct TextStyle: ViewModifier {
    let font: Font
    let weight: Font.Weight
    
    func body(content: Content) -> some View {
        content
            .font(font.weight(weight))
    }
} 