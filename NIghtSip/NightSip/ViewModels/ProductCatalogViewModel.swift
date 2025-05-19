import Foundation
import Combine

class ProductCatalogViewModel: ObservableObject {
    @Published var products: [Product] = []
    @Published var selectedProduct: Product?
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var cart: [CartItem] = []
    
    init() {
        loadProducts()
    }
    
    func loadProducts() {
        isLoading = true
        errorMessage = nil
        
        // In a real app, this would fetch from an API
        // For the MVP, we're using hardcoded products
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
            guard let self = self else { return }
            
            self.products = [
                Product(
                    id: "nightsip-original",
                    name: "NightSip Original",
                    description: "Our original formula with baking soda, zinc, xylitol, aloe, mint, and electrolytes for optimal overnight oral hydration.",
                    price: 19.99,
                    discountPrice: 17.99,
                    imageNames: ["nightsip-original"],
                    isSubscriptionAvailable: true,
                    subscriptionDiscount: 15,
                    features: [
                        "Neutralizes morning breath",
                        "Prevents dry mouth while sleeping",
                        "All natural ingredients",
                        "Promotes dental health"
                    ],
                    ingredients: [
                        "Baking soda & zinc for odor neutralization",
                        "Xylitol & aloe for soothing hydration",
                        "Mint & electrolytes for freshness"
                    ]
                ),
                Product(
                    id: "nightsip-mint",
                    name: "NightSip Mint Boost",
                    description: "Enhanced mint formula for extra freshness with all the benefits of our original blend.",
                    price: 21.99,
                    discountPrice: nil,
                    imageNames: ["nightsip-mint"],
                    isSubscriptionAvailable: true,
                    subscriptionDiscount: 15,
                    features: [
                        "Extra mint for maximum freshness",
                        "Neutralizes morning breath",
                        "Prevents dry mouth while sleeping",
                        "All natural ingredients",
                        "Promotes dental health"
                    ],
                    ingredients: [
                        "Baking soda & zinc for odor neutralization",
                        "Xylitol & aloe for soothing hydration",
                        "Enhanced mint blend & electrolytes for superior freshness"
                    ]
                ),
                Product(
                    id: "nightsip-sensitive",
                    name: "NightSip Sensitive",
                    description: "Specially formulated for those with sensitive mouths, with a milder taste but all the same benefits.",
                    price: 21.99,
                    discountPrice: nil,
                    imageNames: ["nightsip-sensitive"],
                    isSubscriptionAvailable: true,
                    subscriptionDiscount: 15,
                    features: [
                        "Gentle formula for sensitive mouths",
                        "Neutralizes morning breath",
                        "Prevents dry mouth while sleeping",
                        "All natural ingredients",
                        "Promotes dental health"
                    ],
                    ingredients: [
                        "Gentle baking soda & zinc for odor neutralization",
                        "Extra aloe for soothing hydration",
                        "Mild mint & electrolytes for freshness"
                    ]
                ),
                Product(
                    id: "nightsip-bundle",
                    name: "NightSip Variety Pack",
                    description: "Try all three NightSip formulas at a special bundle price.",
                    price: 54.99,
                    discountPrice: 49.99,
                    imageNames: ["nightsip-original", "nightsip-mint", "nightsip-sensitive"],
                    isSubscriptionAvailable: true,
                    subscriptionDiscount: 20,
                    features: [
                        "Includes all three NightSip flavors",
                        "Find your favorite or switch nightly",
                        "Best value package",
                        "All natural ingredients"
                    ],
                    ingredients: [
                        "Original, Mint Boost, and Sensitive formulas"
                    ]
                )
            ]
            
            self.isLoading = false
        }
    }
    
    func addToCart(product: Product, quantity: Int = 1, isSubscription: Bool = false) {
        if let index = cart.firstIndex(where: { $0.product.id == product.id && $0.isSubscription == isSubscription }) {
            // Update existing item
            cart[index].quantity += quantity
        } else {
            // Add new item
            cart.append(CartItem(product: product, quantity: quantity, isSubscription: isSubscription))
        }
    }
    
    func removeFromCart(id: String, isSubscription: Bool) {
        cart.removeAll(where: { $0.product.id == id && $0.isSubscription == isSubscription })
    }
    
    func updateCartItemQuantity(id: String, isSubscription: Bool, quantity: Int) {
        if let index = cart.firstIndex(where: { $0.product.id == id && $0.isSubscription == isSubscription }) {
            cart[index].quantity = max(1, quantity)
        }
    }
    
    func clearCart() {
        cart.removeAll()
    }
    
    var cartTotal: Double {
        cart.reduce(0) { total, item in
            let price = item.isSubscription ? 
                (item.product.discountPrice ?? item.product.price) * (1 - Double(item.product.subscriptionDiscount) / 100) : 
                (item.product.discountPrice ?? item.product.price)
            return total + (price * Double(item.quantity))
        }
    }
    
    var cartItemCount: Int {
        cart.reduce(0) { $0 + $1.quantity }
    }
    
    func checkout() {
        // In a real app, this would initiate the checkout process
        // For now, we'll just simulate opening the website
        selectedProduct = nil
        guard let url = URL(string: "https://thenightsip.com") else { return }
        UIApplication.shared.open(url)
    }
}

struct Product: Identifiable {
    let id: String
    let name: String
    let description: String
    let price: Double
    let discountPrice: Double?
    let imageNames: [String]
    let isSubscriptionAvailable: Bool
    let subscriptionDiscount: Int
    let features: [String]
    let ingredients: [String]
    
    var displayPrice: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        
        if let discountPrice = discountPrice,
           let formattedPrice = formatter.string(from: NSNumber(value: discountPrice)) {
            return formattedPrice
        } else if let formattedPrice = formatter.string(from: NSNumber(value: price)) {
            return formattedPrice
        }
        
        return "$\(price)"
    }
    
    var regularPriceDisplay: String? {
        guard discountPrice != nil else { return nil }
        
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        
        if let formattedPrice = formatter.string(from: NSNumber(value: price)) {
            return formattedPrice
        }
        
        return "$\(price)"
    }
    
    var subscriptionPriceDisplay: String {
        let discountedPrice = (discountPrice ?? price) * (1 - Double(subscriptionDiscount) / 100)
        
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        
        if let formattedPrice = formatter.string(from: NSNumber(value: discountedPrice)) {
            return "\(formattedPrice)/month"
        }
        
        return "$\(discountedPrice)/month"
    }
}

struct CartItem: Identifiable {
    var id: String {
        "\(product.id)-\(isSubscription ? "sub" : "one")"
    }
    
    let product: Product
    var quantity: Int
    let isSubscription: Bool
    
    var itemPrice: Double {
        let basePrice = product.discountPrice ?? product.price
        return isSubscription ? 
            basePrice * (1 - Double(product.subscriptionDiscount) / 100) : 
            basePrice
    }
    
    var totalPrice: Double {
        itemPrice * Double(quantity)
    }
} 