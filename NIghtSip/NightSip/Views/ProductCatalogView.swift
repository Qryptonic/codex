import SwiftUI

struct ProductCatalogView: View {
    @StateObject private var viewModel = ProductCatalogViewModel()
    @State private var showingCart = false
    
    var body: some View {
        NavigationView {
            ZStack {
                if viewModel.isLoading {
                    ProgressView("Loading products...")
                } else if !viewModel.products.isEmpty {
                    productListView
                } else if let error = viewModel.errorMessage {
                    VStack {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.largeTitle)
                            .foregroundColor(.orange)
                            .padding()
                        
                        Text("Error loading products")
                            .font(.headline)
                        
                        Text(error)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding()
                        
                        Button("Try Again") {
                            viewModel.loadProducts()
                        }
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                    .padding()
                }
            }
            .navigationTitle("NightSip Products")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingCart = true }) {
                        ZStack(alignment: .topTrailing) {
                            Image(systemName: "cart")
                                .font(.system(size: 20))
                            
                            if viewModel.cartItemCount > 0 {
                                Text("\(viewModel.cartItemCount)")
                                    .font(.caption2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                                    .frame(width: 18, height: 18)
                                    .background(Color.red)
                                    .clipShape(Circle())
                                    .offset(x: 10, y: -10)
                            }
                        }
                    }
                }
            }
            .sheet(isPresented: $showingCart) {
                CartView(viewModel: viewModel)
            }
            .sheet(item: $viewModel.selectedProduct) { product in
                ProductDetailView(product: product, viewModel: viewModel)
            }
        }
    }
    
    private var productListView: some View {
        ScrollView {
            LazyVStack(spacing: 20) {
                ForEach(viewModel.products) { product in
                    ProductCard(product: product)
                        .onTapGesture {
                            viewModel.selectedProduct = product
                        }
                }
                .padding(.horizontal)
            }
            .padding(.vertical)
        }
    }
}

struct ProductCard: View {
    let product: Product
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Top section with image and name
            HStack(alignment: .top, spacing: 15) {
                // Product image
                if product.imageNames.count == 1 {
                    Image(systemName: "drop.fill") // Placeholder
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 80, height: 80)
                        .foregroundColor(.blue)
                        .padding(10)
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(12)
                } else {
                    // Multiple product images (bundle)
                    ZStack(alignment: .center) {
                        ForEach(0..<min(product.imageNames.count, 3), id: \.self) { index in
                            Image(systemName: "drop.fill") // Placeholder
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(width: 60, height: 60)
                                .foregroundColor(.blue)
                                .padding(8)
                                .background(Color.blue.opacity(0.1))
                                .cornerRadius(10)
                                .offset(x: CGFloat(index * 5 - 5), y: CGFloat(index * 5 - 5))
                        }
                    }
                    .frame(width: 80, height: 80)
                }
                
                // Product name and details
                VStack(alignment: .leading, spacing: 4) {
                    Text(product.name)
                        .font(.headline)
                    
                    Text(product.description)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .lineLimit(3)
                    
                    // Pricing
                    HStack(alignment: .firstTextBaseline) {
                        Text(product.displayPrice)
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(.blue)
                        
                        if let regularPrice = product.regularPriceDisplay {
                            Text(regularPrice)
                                .font(.caption)
                                .strikethrough()
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .padding(.leading, 5)
                
                Spacer()
            }
            
            // Quick view of key benefits
            HStack {
                ForEach(product.features.prefix(3), id: \.self) { feature in
                    Label {
                        Text(feature)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    } icon: {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                            .font(.caption)
                    }
                    
                    if feature != product.features.prefix(3).last {
                        Divider()
                    }
                }
            }
            .padding(.horizontal, 5)
            
            // Button for quick actions
            HStack {
                Button(action: {}) {
                    Text("View Details")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.blue)
                        .padding(.vertical, 8)
                        .padding(.horizontal, 15)
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(8)
                }
                
                Spacer()
                
                if product.isSubscriptionAvailable {
                    Text("Subscribe & Save \(product.subscriptionDiscount)%")
                        .font(.caption)
                        .foregroundColor(.green)
                }
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.1), radius: 10, x: 0, y: 5)
    }
}

struct ProductDetailView: View {
    let product: Product
    @ObservedObject var viewModel: ProductCatalogViewModel
    @Environment(\.presentationMode) var presentationMode
    
    @State private var quantity = 1
    @State private var isSubscription = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Product image
                    HStack {
                        Spacer()
                        if product.imageNames.count == 1 {
                            Image(systemName: "drop.fill") // Placeholder
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(height: 150)
                                .foregroundColor(.blue)
                                .padding()
                        } else {
                            // Multiple products (bundle)
                            HStack(spacing: -30) {
                                ForEach(0..<min(product.imageNames.count, 3), id: \.self) { index in
                                    Image(systemName: "drop.fill") // Placeholder
                                        .resizable()
                                        .aspectRatio(contentMode: .fit)
                                        .frame(height: 120)
                                        .foregroundColor(.blue)
                                        .padding()
                                        .rotationEffect(Angle(degrees: Double(index * 5 - 5)))
                                }
                            }
                        }
                        Spacer()
                    }
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(16)
                    
                    // Product name and price
                    VStack(alignment: .leading, spacing: 8) {
                        Text(product.name)
                            .font(.title)
                            .fontWeight(.bold)
                        
                        HStack(alignment: .firstTextBaseline) {
                            Text(isSubscription ? product.subscriptionPriceDisplay : product.displayPrice)
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(.blue)
                            
                            if !isSubscription, let regularPrice = product.regularPriceDisplay {
                                Text(regularPrice)
                                    .font(.headline)
                                    .strikethrough()
                                    .foregroundColor(.secondary)
                            }
                        }
                        
                        Text(product.description)
                            .font(.body)
                            .foregroundColor(.secondary)
                            .padding(.top, 4)
                    }
                    
                    // Purchase options
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Purchase Options")
                            .font(.headline)
                        
                        HStack {
                            // Subscription toggle
                            if product.isSubscriptionAvailable {
                                Toggle(isOn: $isSubscription) {
                                    VStack(alignment: .leading) {
                                        Text(isSubscription ? "Monthly Subscription" : "One-Time Purchase")
                                            .font(.subheadline)
                                            .fontWeight(.medium)
                                        
                                        if isSubscription {
                                            Text("Save \(product.subscriptionDiscount)% with auto-delivery")
                                                .font(.caption)
                                                .foregroundColor(.green)
                                        }
                                    }
                                }
                                .toggleStyle(SwitchToggleStyle(tint: .blue))
                            }
                        }
                        
                        // Quantity selector
                        HStack {
                            Text("Quantity:")
                                .font(.subheadline)
                            
                            Spacer()
                            
                            Button(action: {
                                if quantity > 1 {
                                    quantity -= 1
                                }
                            }) {
                                Image(systemName: "minus.circle.fill")
                                    .font(.title2)
                                    .foregroundColor(quantity > 1 ? .blue : .gray)
                            }
                            .disabled(quantity <= 1)
                            
                            Text("\(quantity)")
                                .font(.headline)
                                .frame(width: 40)
                                .padding(.horizontal, 8)
                            
                            Button(action: {
                                if quantity < 10 {
                                    quantity += 1
                                }
                            }) {
                                Image(systemName: "plus.circle.fill")
                                    .font(.title2)
                                    .foregroundColor(.blue)
                            }
                        }
                    }
                    .padding()
                    .background(Color(.secondarySystemBackground))
                    .cornerRadius(12)
                    
                    // Features
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Key Benefits")
                            .font(.headline)
                            .padding(.bottom, 4)
                        
                        ForEach(product.features, id: \.self) { feature in
                            HStack(alignment: .top, spacing: 10) {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(.green)
                                    .font(.subheadline)
                                
                                Text(feature)
                                    .font(.subheadline)
                                
                                Spacer()
                            }
                        }
                    }
                    .padding()
                    .background(Color(.secondarySystemBackground))
                    .cornerRadius(12)
                    
                    // Ingredients
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Ingredients")
                            .font(.headline)
                            .padding(.bottom, 4)
                        
                        ForEach(product.ingredients, id: \.self) { ingredient in
                            HStack(alignment: .top, spacing: 10) {
                                Image(systemName: "leaf.fill")
                                    .foregroundColor(.green)
                                    .font(.subheadline)
                                
                                Text(ingredient)
                                    .font(.subheadline)
                                
                                Spacer()
                            }
                        }
                    }
                    .padding()
                    .background(Color(.secondarySystemBackground))
                    .cornerRadius(12)
                    
                    // Add to cart button
                    Button(action: {
                        viewModel.addToCart(product: product, quantity: quantity, isSubscription: isSubscription)
                        presentationMode.wrappedValue.dismiss()
                    }) {
                        HStack {
                            Text("Add to Cart")
                                .fontWeight(.semibold)
                            
                            Spacer()
                            
                            Text("$\(String(format: "%.2f", (isSubscription ? (product.discountPrice ?? product.price) * (1 - Double(product.subscriptionDiscount) / 100) : (product.discountPrice ?? product.price)) * Double(quantity)))")
                        }
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .padding(.vertical)
                }
                .padding()
            }
            .navigationTitle("Product Details")
            .navigationBarItems(trailing: Button("Close") {
                presentationMode.wrappedValue.dismiss()
            })
        }
    }
}

struct CartView: View {
    @ObservedObject var viewModel: ProductCatalogViewModel
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        NavigationView {
            Group {
                if viewModel.cart.isEmpty {
                    VStack(spacing: 20) {
                        Spacer()
                        
                        Image(systemName: "cart")
                            .font(.system(size: 70))
                            .foregroundColor(.gray.opacity(0.5))
                        
                        Text("Your cart is empty")
                            .font(.title2)
                            .fontWeight(.semibold)
                        
                        Text("Add some products to get started")
                            .foregroundColor(.secondary)
                        
                        Button("Browse Products") {
                            presentationMode.wrappedValue.dismiss()
                        }
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                        .padding(.top)
                        
                        Spacer()
                    }
                    .padding()
                } else {
                    VStack {
                        List {
                            Section(header: Text("Cart Items")) {
                                ForEach(viewModel.cart) { item in
                                    CartItemRow(item: item, viewModel: viewModel)
                                }
                                .onDelete { indexSet in
                                    for index in indexSet {
                                        let item = viewModel.cart[index]
                                        viewModel.removeFromCart(id: item.product.id, isSubscription: item.isSubscription)
                                    }
                                }
                            }
                            
                            Section(header: Text("Order Summary")) {
                                HStack {
                                    Text("Subtotal")
                                    Spacer()
                                    Text(String(format: "$%.2f", viewModel.cartTotal))
                                        .fontWeight(.semibold)
                                }
                                
                                HStack {
                                    Text("Shipping")
                                    Spacer()
                                    Text("Free")
                                        .fontWeight(.semibold)
                                }
                                
                                HStack {
                                    Text("Total")
                                        .fontWeight(.bold)
                                    Spacer()
                                    Text(String(format: "$%.2f", viewModel.cartTotal))
                                        .fontWeight(.bold)
                                        .foregroundColor(.blue)
                                }
                            }
                        }
                        
                        Button(action: {
                            viewModel.checkout()
                            presentationMode.wrappedValue.dismiss()
                        }) {
                            Text("Checkout")
                                .fontWeight(.semibold)
                                .padding()
                                .frame(maxWidth: .infinity)
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Cart")
            .navigationBarItems(trailing: Button("Done") {
                presentationMode.wrappedValue.dismiss()
            })
            .toolbar {
                if !viewModel.cart.isEmpty {
                    ToolbarItem(placement: .navigationBarLeading) {
                        Button("Clear") {
                            viewModel.clearCart()
                        }
                        .foregroundColor(.red)
                    }
                }
            }
        }
    }
}

struct CartItemRow: View {
    let item: CartItem
    @ObservedObject var viewModel: ProductCatalogViewModel
    
    var body: some View {
        HStack(alignment: .top, spacing: 15) {
            // Product image
            Image(systemName: "drop.fill")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 60, height: 60)
                .foregroundColor(.blue)
                .padding(5)
                .background(Color.blue.opacity(0.1))
                .cornerRadius(8)
            
            // Product details
            VStack(alignment: .leading, spacing: 4) {
                Text(item.product.name)
                    .font(.headline)
                
                Text(item.isSubscription ? "Subscription" : "One-time purchase")
                    .font(.caption)
                    .foregroundColor(item.isSubscription ? .green : .secondary)
                
                HStack {
                    // Quantity stepper
                    Button(action: {
                        if item.quantity > 1 {
                            viewModel.updateCartItemQuantity(id: item.product.id, isSubscription: item.isSubscription, quantity: item.quantity - 1)
                        }
                    }) {
                        Image(systemName: "minus.circle.fill")
                            .foregroundColor(item.quantity > 1 ? .blue : .gray)
                    }
                    .disabled(item.quantity <= 1)
                    
                    Text("\(item.quantity)")
                        .frame(minWidth: 20)
                        .padding(.horizontal, 4)
                    
                    Button(action: {
                        viewModel.updateCartItemQuantity(id: item.product.id, isSubscription: item.isSubscription, quantity: item.quantity + 1)
                    }) {
                        Image(systemName: "plus.circle.fill")
                            .foregroundColor(.blue)
                    }
                    
                    Spacer()
                    
                    // Price
                    VStack(alignment: .trailing) {
                        Text(String(format: "$%.2f", item.totalPrice))
                            .font(.headline)
                            .fontWeight(.semibold)
                        
                        if item.quantity > 1 {
                            Text(String(format: "$%.2f each", item.itemPrice))
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }
        }
        .padding(.vertical, 4)
    }
}

struct ProductCatalogView_Previews: PreviewProvider {
    static var previews: some View {
        ProductCatalogView()
    }
} 