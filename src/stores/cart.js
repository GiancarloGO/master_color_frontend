import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useCartStore = defineStore('cart', () => {
    // State
    const items = ref([]);
    const loading = ref(false);
    const error = ref(null);

    // Getters
    const cartItems = computed(() => items.value);

    const totalItems = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0));

    const totalPrice = computed(() => items.value.reduce((sum, item) => sum + item.price * item.quantity, 0));

    const totalSavings = computed(() =>
        items.value.reduce((sum, item) => {
            const savings = item.original_price ? (item.original_price - item.price) * item.quantity : 0;
            return sum + savings;
        }, 0)
    );

    const isCartEmpty = computed(() => items.value.length === 0);

    // Actions
    const addToCart = (product) => {
        try {
            console.log('🏪 Cart Store: Starting addToCart for:', product.name);
            console.log('🏪 Cart Store: Product received:', product);
            console.log('🏪 Cart Store: Current items count:', items.value.length);

            const existingItem = items.value.find((item) => item.id === product.id);
            console.log('🏪 Cart Store: Existing item found:', !!existingItem);

            if (existingItem) {
                // Verificar stock disponible
                console.log('🏪 Cart Store: Existing quantity:', existingItem.quantity, 'Available stock:', product.stock?.quantity);
                if (existingItem.quantity >= product.stock?.quantity) {
                    throw new Error(`Stock insuficiente. Disponible: ${product.stock?.quantity}`);
                }
                existingItem.quantity += 1;
                console.log('🏪 Cart Store: Updated existing item quantity to:', existingItem.quantity);
            } else {
                // Verificar stock antes de agregar
                console.log('🏪 Cart Store: Checking stock availability:', product.stock?.quantity);
                if (product.stock?.quantity < 1) {
                    throw new Error('Producto sin stock disponible');
                }

                const newItem = {
                    id: product.id,
                    name: product.name,
                    code: product.code,
                    brand: product.brand,
                    price: product.stock?.sale_price || 0,
                    original_price: product.stock?.regular_price || null,
                    quantity: 1,
                    image: product.image,
                    stock_available: product.stock?.quantity || 0
                };

                console.log('🏪 Cart Store: Adding new item:', newItem);
                items.value.push(newItem);
                console.log('🏪 Cart Store: Items count after push:', items.value.length);
            }

            saveToLocalStorage();
            error.value = null;
            console.log('🏪 Cart Store: Successfully added to cart');
            return true;
        } catch (err) {
            error.value = err.message;
            return false;
        }
    };

    const removeFromCart = (productId) => {
        const index = items.value.findIndex((item) => item.id === productId);
        if (index > -1) {
            items.value.splice(index, 1);
            saveToLocalStorage();
        }
    };

    const updateQuantity = (productId, quantity) => {
        const item = items.value.find((item) => item.id === productId);
        if (item) {
            if (quantity <= 0) {
                removeFromCart(productId);
            } else if (quantity <= item.stock_available) {
                item.quantity = quantity;
                saveToLocalStorage();
            } else {
                error.value = `Stock insuficiente. Disponible: ${item.stock_available}`;
            }
        }
    };

    const increaseQuantity = (productId) => {
        const item = items.value.find((item) => item.id === productId);
        if (item) {
            if (item.quantity < item.stock_available) {
                item.quantity += 1;
                saveToLocalStorage();
            } else {
                error.value = `Stock insuficiente. Disponible: ${item.stock_available}`;
            }
        }
    };

    const decreaseQuantity = (productId) => {
        const item = items.value.find((item) => item.id === productId);
        if (item) {
            if (item.quantity > 1) {
                item.quantity -= 1;
                saveToLocalStorage();
            } else {
                removeFromCart(productId);
            }
        }
    };

    const clearCart = () => {
        items.value = [];
        localStorage.removeItem('cart');
        localStorage.removeItem('checkoutCart');
    };

    const validateCart = async () => {
        loading.value = true;
        error.value = null;

        try {
            // Aquí podrías llamar a la API para validar stock actual
            // Por ahora, validamos con los datos locales
            const invalidItems = items.value.filter((item) => item.quantity > item.stock_available);

            if (invalidItems.length > 0) {
                const errors = invalidItems.map((item) => `${item.name}: solicitado ${item.quantity}, disponible ${item.stock_available}`);
                throw new Error(`Productos con stock insuficiente:\n${errors.join('\n')}`);
            }

            return true;
        } catch (err) {
            error.value = err.message;
            return false;
        } finally {
            loading.value = false;
        }
    };

    const prepareForCheckout = () => {
        if (isCartEmpty.value) {
            error.value = 'El carrito está vacío';
            return false;
        }

        // Guardar los items completos para la página de orders
        const checkoutData = items.value.map((item) => ({
            id: item.id,
            name: item.name,
            code: item.code,
            brand: item.brand,
            price: item.price,
            originalPrice: item.original_price,
            quantity: item.quantity,
            image: item.image,
            category: 'productos', // Categoría por defecto
            stockQuantity: item.stock_available
        }));

        console.log('💾 Cart Store: Saving checkout data:', checkoutData);
        localStorage.setItem('checkoutCart', JSON.stringify(checkoutData));
        return true;
    };

    const loadFromLocalStorage = () => {
        try {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                items.value = JSON.parse(savedCart);
            }
        } catch (err) {
            console.error('Error loading cart from localStorage:', err);
            items.value = [];
        }
    };

    const saveToLocalStorage = () => {
        try {
            localStorage.setItem('cart', JSON.stringify(items.value));
        } catch (err) {
            console.error('Error saving cart to localStorage:', err);
        }
    };

    const updateStockInfo = (productId, newStock) => {
        const item = items.value.find((item) => item.id === productId);
        if (item) {
            item.stock_available = newStock;

            // Ajustar cantidad si excede el stock disponible
            if (item.quantity > newStock) {
                if (newStock === 0) {
                    removeFromCart(productId);
                } else {
                    item.quantity = newStock;
                }
            }

            saveToLocalStorage();
        }
    };

    const clearError = () => {
        error.value = null;
    };

    // Initialize cart from localStorage
    loadFromLocalStorage();

    return {
        // State
        items,
        loading,
        error,

        // Getters
        cartItems,
        totalItems,
        totalPrice,
        totalSavings,
        isCartEmpty,

        // Actions
        addToCart,
        removeFromCart,
        updateQuantity,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        validateCart,
        prepareForCheckout,
        updateStockInfo,
        clearError,
        loadFromLocalStorage,
        saveToLocalStorage
    };
});
