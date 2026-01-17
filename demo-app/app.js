// Shopping Cart State
let cart = [];

// Product Data
const products = {
    'LAPTOP-001': { name: 'Gaming Laptop Pro', price: 1299.99 },
    'HEADPHONES-001': { name: 'Wireless Headphones Pro', price: 299.99 },
    'KEYBOARD-001': { name: 'Mechanical Keyboard RGB', price: 149.99 },
    'MOUSE-001': { name: 'Gaming Mouse Ultra', price: 79.99 }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Add to cart buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            const sku = e.target.dataset.sku;
            addToCart(sku);
        });
    });

    // Cart icon click
    document.querySelector('.cart-icon').addEventListener('click', showCart);

    // Continue shopping
    document.getElementById('continue-shopping').addEventListener('click', showProducts);

    // Checkout button
    document.getElementById('checkout-btn').addEventListener('click', showCheckout);

    // Back to cart
    document.getElementById('back-to-cart').addEventListener('click', showCart);

    // Checkout form
    document.getElementById('checkout-form').addEventListener('submit', handleCheckout);

    // New order button
    document.getElementById('new-order').addEventListener('click', () => {
        cart = [];
        updateCartCount();
        showProducts();
    });

    // Load cart from localStorage
    loadCart();
});

// Add item to cart
function addToCart(sku) {
    const existingItem = cart.find(item => item.sku === sku);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            sku: sku,
            name: products[sku].name,
            price: products[sku].price,
            quantity: 1
        });
    }

    updateCartCount();
    saveCart();

    // Visual feedback
    const button = document.querySelector(`[data-sku="${sku}"]`);
    button.textContent = '✓ Added';
    button.style.background = '#28a745';
    setTimeout(() => {
        button.textContent = 'Add to Cart';
        button.style.background = '#667eea';
    }, 1000);
}

// Update cart count
function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelector('.cart-count').textContent = count;
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Load cart from localStorage
function loadCart() {
    const saved = localStorage.getItem('cart');
    if (saved) {
        cart = JSON.parse(saved);
        updateCartCount();
    }
}

// Show products section
function showProducts() {
    document.getElementById('products').style.display = 'block';
    document.getElementById('cart').style.display = 'none';
    document.getElementById('checkout').style.display = 'none';
    document.getElementById('success').style.display = 'none';
}

// Show cart section
function showCart() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    renderCart();
    document.getElementById('products').style.display = 'none';
    document.getElementById('cart').style.display = 'block';
    document.getElementById('checkout').style.display = 'none';
    document.getElementById('success').style.display = 'none';
}

// Render cart items
function renderCart() {
    const cartItemsDiv = document.querySelector('.cart-items');
    cartItemsDiv.innerHTML = '';

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p>Your cart is empty</p>';
        return;
    }

    cart.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        itemDiv.dataset.testid = `cart-item-${item.sku}`;
        itemDiv.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>$${item.price.toFixed(2)} each</p>
            </div>
            <div class="cart-item-actions">
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
                    <span data-testid="quantity-${item.sku}">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
                </div>
                <span style="font-weight: bold; min-width: 100px; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</span>
                <button class="remove-btn" onclick="removeItem(${index})" data-testid="remove-${item.sku}">Remove</button>
            </div>
        `;
        cartItemsDiv.appendChild(itemDiv);
    });

    updateCartSummary();
}

// Update quantity
function updateQuantity(index, change) {
    cart[index].quantity += change;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    updateCartCount();
    saveCart();
    renderCart();
}

// Remove item
function removeItem(index) {
    cart.splice(index, 1);
    updateCartCount();
    saveCart();

    if (cart.length === 0) {
        showProducts();
    } else {
        renderCart();
    }
}

// Update cart summary
function updateCartSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });

    document.querySelector('[data-testid="cart-subtotal"]').textContent = formatter.format(subtotal);
    document.querySelector('[data-testid="cart-tax"]').textContent = formatter.format(tax);
    document.querySelector('[data-testid="cart-total"]').textContent = formatter.format(total);
}

// Show checkout section
function showCheckout() {
    const total = calculateTotal();
    document.querySelector('[data-testid="checkout-total"]').textContent = `$${total.toFixed(2)}`;

    document.getElementById('products').style.display = 'none';
    document.getElementById('cart').style.display = 'none';
    document.getElementById('checkout').style.display = 'block';
    document.getElementById('success').style.display = 'none';
}

// Calculate total
function calculateTotal() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1;
    return subtotal + tax;
}

// Handle checkout form submission
function handleCheckout(e) {
    e.preventDefault();

    // Validate card number
    const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
    const expiry = document.getElementById('expiry').value;
    const cvv = document.getElementById('cvv').value;

    // Simple validation
    if (cardNumber.length !== 16) {
        showError('card-error', 'Card number must be 16 digits');
        return;
    }

    // Check for expired card (simple validation)
    const [month, year] = expiry.split('/');
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;

    if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        showError('card-error', 'Card has expired');
        return;
    }

    // Simulate processing delay
    const submitBtn = document.querySelector('[data-testid="submit-order"]');
    submitBtn.textContent = 'Processing...';
    submitBtn.disabled = true;

    setTimeout(() => {
        // Generate order number
        const orderNumber = 'ORD-' + Math.floor(10000000 + Math.random() * 90000000);
        document.querySelector('[data-testid="order-number"]').textContent = orderNumber;

        // Clear cart
        cart = [];
        updateCartCount();
        saveCart();

        // Show success
        document.getElementById('products').style.display = 'none';
        document.getElementById('cart').style.display = 'none';
        document.getElementById('checkout').style.display = 'none';
        document.getElementById('success').style.display = 'block';

        // Reset form and button
        document.getElementById('checkout-form').reset();
        submitBtn.textContent = 'Complete Purchase';
        submitBtn.disabled = false;
    }, 1500);
}

// Show error message
function showError(errorId, message) {
    const errorElement = document.getElementById(errorId);
    errorElement.textContent = message;
    setTimeout(() => {
        errorElement.textContent = '';
    }, 3000);
}
