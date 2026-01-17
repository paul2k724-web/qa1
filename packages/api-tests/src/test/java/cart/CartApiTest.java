package cart;

import io.restassured.RestAssured;
import io.restassured.response.Response;
import org.junit.jupiter.api.*;
import static io.restassured.RestAssured.*;
import static io.restassured.module.jsv.JsonSchemaValidator.*;
import static org.hamcrest.Matchers.*;

import clients.CartClient;
import config.ApiConfig;
import models.Cart;
import models.Product;
import testdata.ProductFactory;
import testdata.UserFactory;

/**
 * Cart API Integration Tests
 * 
 * Coverage:
 * - CRUD operations on cart items
 * - Concurrency handling (race conditions)
 * - Error scenarios (validation, auth)
 * - Performance SLA validation
 * 
 * Anti-Flake Measures:
 * - Isolated test data (unique user per test)
 * - JSON schema validation (contract enforcement)
 * - Retry logic for network flakes
 * - Explicit cleanup in afterEach
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@DisplayName("Cart API - Business Logic Tests")
public class CartApiTest {
    
    private CartClient cartClient;
    private String userId;
    private String authToken;

    @BeforeAll
    public void globalSetup() {
        RestAssured.baseURI = ApiConfig.getBaseUrl();
        RestAssured.enableLoggingOfRequestAndResponseIfValidationFails();
        
        // Enable request/response logging for debugging
        RestAssured.filters(new io.restassured.filter.log.RequestLoggingFilter(),
                           new io.restassured.filter.log.ResponseLoggingFilter());
        
        cartClient = new CartClient();
    }

    @BeforeEach
    public void setup() {
        // Create isolated test user for each test
        var user = UserFactory.createUser();
        userId = user.getId();
        authToken = user.getAuthToken();
        
        System.out.println("Test user created: " + userId);
    }

    @Test
    @Tag("smoke")
    @DisplayName("POST /cart/items - Should add product to cart successfully")
    public void shouldAddProductToCart() {
        // Arrange
        Product product = ProductFactory.createProduct("Gaming Laptop", 1299.99);
        
        // Act & Assert
        Response response = cartClient
            .addItem(userId, product.getSku(), 2, authToken)
            .then()
            .statusCode(201)
            .contentType("application/json")
            // Contract validation: Ensure response matches expected schema
            .body(matchesJsonSchemaInClasspath("schemas/cart-response.json"))
            // Business logic validation
            .body("items.size()", equalTo(1))
            .body("items[0].quantity", equalTo(2))
            .body("items[0].sku", equalTo(product.getSku()))
            .body("items[0].name", equalTo(product.getName()))
            .body("totalPrice", equalTo(2599.98f))
            .body("itemCount", equalTo(2))
            // Performance SLA: Response time < 500ms
            .time(lessThan(500L))
            .extract().response();
        
        // Verify idempotency: Cart ID should follow expected pattern
        String cartId = response.path("cartId");
        assertThat(cartId, matchesPattern("^cart_[a-f0-9]{24}$"));
        
        // Verify timestamps
        String createdAt = response.path("createdAt");
        assertThat(createdAt, notNullValue());
    }

    @Test
    @DisplayName("PUT /cart/items/{sku} - Should update item quantity")
    public void shouldUpdateItemQuantity() {
        // Arrange: Add item first
        Product product = ProductFactory.createProduct("Wireless Mouse", 29.99);
        cartClient.addItem(userId, product.getSku(), 1, authToken);

        // Act: Update quantity to 5
        cartClient
            .updateQuantity(userId, product.getSku(), 5, authToken)
            .then()
            .statusCode(200)
            .body("items[0].quantity", equalTo(5))
            .body("totalPrice", equalTo(149.95f))
            .body("itemCount", equalTo(5))
            .body("updatedAt", notNullValue());
    }

    @Test
    @DisplayName("PUT /cart/items/{sku} - Should replace quantity, not increment")
    public void shouldReplaceQuantityNotIncrement() {
        Product product = ProductFactory.createProduct("Mechanical Keyboard", 79.99);
        
        // Add 3 items
        cartClient.addItem(userId, product.getSku(), 3, authToken);
        
        // Update to 1 (should replace, not add)
        cartClient
            .updateQuantity(userId, product.getSku(), 1, authToken)
            .then()
            .statusCode(200)
            .body("items[0].quantity", equalTo(1))
            .body("totalPrice", equalTo(79.99f));
    }

    @Test
    @DisplayName("DELETE /cart/items/{sku} - Should remove item from cart")
    public void shouldRemoveItemFromCart() {
        // Arrange
        Product product = ProductFactory.createProduct("USB-C Cable", 19.99);
        cartClient.addItem(userId, product.getSku(), 2, authToken);

        // Act: Remove item
        cartClient
            .removeItem(userId, product.getSku(), authToken)
            .then()
            .statusCode(204); // No content

        // Assert: Verify cart is empty
        cartClient
            .getCart(userId, authToken)
            .then()
            .statusCode(200)
            .body("items.size()", equalTo(0))
            .body("totalPrice", equalTo(0.0f))
            .body("itemCount", equalTo(0));
    }

    @Test
    @DisplayName("POST /cart/items - Should return 400 for invalid quantity")
    public void shouldRejectInvalidQuantity() {
        Product product = ProductFactory.createProduct("4K Monitor", 399.99);
        
        // Test negative quantity
        cartClient
            .addItem(userId, product.getSku(), -1, authToken)
            .then()
            .statusCode(400)
            .body("error.code", equalTo("INVALID_QUANTITY"))
            .body("error.message", containsString("Quantity must be positive"))
            .body("error.field", equalTo("quantity"));

        // Test zero quantity
        cartClient
            .addItem(userId, product.getSku(), 0, authToken)
            .then()
            .statusCode(400)
            .body("error.code", equalTo("INVALID_QUANTITY"));
    }

    @Test
    @DisplayName("POST /cart/items - Should return 404 for non-existent product")
    public void shouldReturn404ForInvalidProduct() {
        cartClient
            .addItem(userId, "INVALID-SKU-12345", 1, authToken)
            .then()
            .statusCode(404)
            .body("error.code", equalTo("PRODUCT_NOT_FOUND"))
            .body("error.message", containsString("Product not found"));
    }

    @Test
    @DisplayName("GET /cart - Should return 401 for missing auth token")
    public void shouldRequireAuthentication() {
        given()
            .baseUri(ApiConfig.getBaseUrl())
        .when()
            .get("/cart/{userId}", userId)
        .then()
            .statusCode(401)
            .body("error.code", equalTo("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("POST /cart/items - Should enforce max quantity limit")
    public void shouldEnforceMaxQuantityLimit() {
        Product product = ProductFactory.createProduct("Limited Edition Item", 999.99);
        
        // Attempt to add 1000 items (over limit of 99)
        cartClient
            .addItem(userId, product.getSku(), 1000, authToken)
            .then()
            .statusCode(400)
            .body("error.code", equalTo("QUANTITY_LIMIT_EXCEEDED"))
            .body("error.message", containsString("Maximum quantity is 99"));
    }

    @Test
    @DisplayName("GET /cart - Should handle concurrent additions correctly")
    @Timeout(value = 15, unit = java.util.concurrent.TimeUnit.SECONDS)
    public void shouldHandleConcurrentAdditions() throws InterruptedException {
        // Test for race condition handling
        Product product = ProductFactory.createProduct("NVMe SSD 1TB", 149.99);
        
        // Simulate 5 concurrent add requests
        var executor = java.util.concurrent.Executors.newFixedThreadPool(5);
        var latch = new java.util.concurrent.CountDownLatch(5);

        for (int i = 0; i < 5; i++) {
            executor.submit(() -> {
                try {
                    cartClient.addItem(userId, product.getSku(), 1, authToken);
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await();
        executor.shutdown();

        // Verify cart has correct final quantity
        // Expectation: Either optimistic locking (quantity = 5) or idempotency (quantity = 1)
        cartClient
            .getCart(userId, authToken)
            .then()
            .statusCode(200)
            .body("items[0].quantity", anyOf(equalTo(5), equalTo(1)))
            .body("items.size()", equalTo(1)); // Should consolidate into one line item
    }

    @Test
    @DisplayName("POST /cart/items - Should calculate tax correctly for CA addresses")
    public void shouldCalculateTaxForCalifornia() {
        Product product = ProductFactory.createProduct("Tablet Pro", 599.99);
        
        // Add item with CA shipping address
        var response = given()
            .baseUri(ApiConfig.getBaseUrl())
            .header("Authorization", authToken)
            .contentType("application/json")
            .body("""
                {
                    "sku": "%s",
                    "quantity": 1,
                    "shippingAddress": {
                        "state": "CA",
                        "zip": "94105"
                    }
                }
                """.formatted(product.getSku()))
        .when()
            .post("/cart/{userId}/items", userId)
        .then()
            .statusCode(201)
            .body("subtotal", equalTo(599.99f))
            .body("tax", closeTo(59.99f, 1.0f)) // ~10% CA sales tax
            .body("totalPrice", closeTo(659.98f, 1.0f))
            .extract().response();
    }

    @AfterEach
    public void cleanup() {
        // Clear cart after each test to prevent pollution
        try {
            cartClient.clearCart(userId, authToken);
            System.out.println("Cart cleared for user: " + userId);
        } catch (Exception e) {
            System.err.println("Failed to clear cart: " + e.getMessage());
        }
    }

    @AfterAll
    public void globalCleanup() {
        // Mark test users for deletion
        UserFactory.cleanupAllTestUsers();
    }
}
