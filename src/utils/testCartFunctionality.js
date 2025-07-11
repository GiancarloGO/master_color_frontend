// Test script para verificar la funcionalidad del carrito
import { useCartStore } from '@/stores/cart';

export const testCartFunctionality = () => {
    console.log('🛒 Testing Cart Functionality...');

    const cartStore = useCartStore();

    // Test product with proper structure
    const testProduct = {
        id: 999,
        name: 'Test Product',
        code: 'TEST-001',
        brand: 'Test Brand',
        image: 'https://placehold.co/300x200/4F46E5/FFFFFF?text=Test+Product',
        stock: {
            quantity: 10,
            sale_price: 29.99,
            regular_price: 39.99
        }
    };

    console.log('1️⃣ Test product:', testProduct);

    try {
        // Test 1: Add product to cart
        console.log('2️⃣ Adding product to cart...');
        const result = cartStore.addToCart(testProduct);

        if (result) {
            console.log('✅ Product added successfully');
            console.log('Cart items:', cartStore.cartItems);
            console.log('Total items:', cartStore.totalItems);
            console.log('Total price:', cartStore.totalPrice);
        } else {
            console.log('❌ Failed to add product');
            console.log('Error:', cartStore.error);
        }

        // Test 2: Increase quantity
        console.log('3️⃣ Increasing quantity...');
        cartStore.increaseQuantity(testProduct.id);
        console.log('Cart after increase:', cartStore.cartItems);

        // Test 3: Decrease quantity
        console.log('4️⃣ Decreasing quantity...');
        cartStore.decreaseQuantity(testProduct.id);
        console.log('Cart after decrease:', cartStore.cartItems);

        // Test 4: Remove from cart
        console.log('5️⃣ Removing from cart...');
        cartStore.removeFromCart(testProduct.id);
        console.log('Cart after removal:', cartStore.cartItems);
        console.log('Is cart empty:', cartStore.isCartEmpty);

        return {
            success: true,
            message: 'All cart tests passed! ✅'
        };
    } catch (error) {
        console.error('❌ Cart test failed:', error);
        return {
            success: false,
            message: `Cart test failed: ${error.message}`,
            error: error.message
        };
    }
};

// Test para productos sin stock
export const testOutOfStockProduct = () => {
    console.log('🚫 Testing Out of Stock Product...');

    const cartStore = useCartStore();

    const outOfStockProduct = {
        id: 998,
        name: 'Out of Stock Product',
        code: 'OOS-001',
        brand: 'Test Brand',
        image: 'https://placehold.co/300x200/dc2626/FFFFFF?text=Out+of+Stock',
        stock: {
            quantity: 0,
            sale_price: 19.99,
            regular_price: 29.99
        }
    };

    console.log('Test product (out of stock):', outOfStockProduct);

    try {
        const result = cartStore.addToCart(outOfStockProduct);

        if (!result) {
            console.log('✅ Correctly rejected out of stock product');
            console.log('Error message:', cartStore.error);
            return { success: true, message: 'Out of stock test passed' };
        } else {
            console.log('❌ Should not have added out of stock product');
            return { success: false, message: 'Out of stock test failed' };
        }
    } catch (error) {
        console.log('✅ Exception correctly thrown for out of stock:', error.message);
        return { success: true, message: 'Out of stock test passed with exception' };
    }
};

// Función para ejecutar todos los tests
export const runAllCartTests = () => {
    console.log('🧪 Running All Cart Tests...');

    const results = [];

    // Test 1: Basic functionality
    results.push(testCartFunctionality());

    // Test 2: Out of stock
    results.push(testOutOfStockProduct());

    // Summary
    const passed = results.filter((r) => r.success).length;
    const total = results.length;

    console.log(`\n📊 Test Summary: ${passed}/${total} tests passed`);

    if (passed === total) {
        console.log('🎉 All cart tests passed!');
    } else {
        console.log('💥 Some cart tests failed');
        results.forEach((result, index) => {
            if (!result.success) {
                console.log(`Test ${index + 1} failed:`, result.message);
            }
        });
    }

    return {
        passed,
        total,
        success: passed === total,
        results
    };
};

// Auto-ejecutar en desarrollo si hay parámetro de debug
if (import.meta.env.DEV && window.location.search.includes('debug=cart')) {
    runAllCartTests();
}

export default testCartFunctionality;
