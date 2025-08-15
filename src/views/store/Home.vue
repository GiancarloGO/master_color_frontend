<script setup>
import { productsApi } from '@/api/index';
import { useCart } from '@/composables/useCart';
import { useAuthStore } from '@/stores/auth';
import { useProductsStore } from '@/stores/products';
import { sanitizeSearchInput } from '@/utils/inputSanitizer';
import { useToast } from 'primevue/usetoast';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

// Router setup
const router = useRouter();

// Toast setup
const toast = useToast();

// Auth setup
const authStore = useAuthStore();

// Products setup
const productsStore = useProductsStore();

// Cart setup
const { addToCart: addProductToCart, proceedToCheckout, cartStore, restorePendingCart } = useCart();

// State
const searchQuery = ref('');
const selectedCategory = ref(null);

// Computed para sanitizar la búsqueda
const sanitizedSearchQuery = computed(() => {
    return sanitizeSearchInput(searchQuery.value);
});
const sortOption = ref('name-asc'); // Default sorting
const cartVisible = ref(false);
const loading = ref(false);
const isSmallScreen = ref(false);
const userMenu = ref();
const forceReactivity = ref(0);

// Responsive detection
const checkScreenSize = () => {
    isSmallScreen.value = window.innerWidth < 640;
};

const categories = ref([
    { id: 1, name: 'impresoras', label: 'Impresoras', icon: 'pi-print' },
    { id: 2, name: 'tintas', label: 'Tintas', icon: 'pi-palette' },
    { id: 3, name: 'toners', label: 'Tóners', icon: 'pi-inbox' },
    { id: 4, name: 'papel', label: 'Papel', icon: 'pi-file' },
    { id: 5, name: 'repuestos', label: 'Repuestos', icon: 'pi-cog' },
    { id: 6, name: 'accesorios', label: 'Accesorios', icon: 'pi-star' }
]);

// Dynamic categories computed from loaded products
const availableCategories = computed(() => {
    const productCategories = [...new Set((productsStore.productsList || []).map((p) => p.category).filter(Boolean))];
    return categories.value.filter((cat) => productCategories.includes(cat.name));
});

// Sort options
const sortOptions = [
    { label: 'Nombre (A-Z)', value: 'name-asc' },
    { label: 'Nombre (Z-A)', value: 'name-desc' },
    { label: 'Precio (Menor a Mayor)', value: 'price-asc' },
    { label: 'Precio (Mayor a Menor)', value: 'price-desc' },
    { label: 'Stock (Menor a Mayor)', value: 'stock-asc' },
    { label: 'Stock (Mayor a Menor)', value: 'stock-desc' }
];

// Load products from backend using public endpoint
const loadProducts = async () => {
    try {
        loading.value = true;
        const response = await productsApi.getPublicProducts();

        if (response.data) {
            const transformedProducts = (response.data.products || response.data.data || response.data || []).map((product) => ({
                id: product.id,
                name: product.name,
                category: product.category,
                price: parseFloat(product.sale_price || product.price || 0),
                originalPrice: parseFloat(product.purchase_price || product.sale_price || 0),
                image: product.image_url || `https://placehold.co/300x200/4F46E5/FFFFFF?text=${encodeURIComponent(product.name)}`,
                inStock: (product.stock_quantity || 0) > 0,
                description: product.description || '',
                brand: product.brand || 'Sin marca',
                code: product.sku || product.code || `PRD-${product.id}`,
                sku: product.sku || '',
                stockQuantity: product.stock_quantity || 0,
                minStock: product.min_stock || 5,
                maxStock: product.max_stock || 100,
                presentation: product.presentation || '',
                unidad: product.unidad || '',
                stock: {
                    quantity: product.stock_quantity || 0,
                    sale_price: parseFloat(product.sale_price || product.price || 0),
                    regular_price: parseFloat(product.purchase_price || product.sale_price || 0),
                    min_stock: product.min_stock || 5,
                    max_stock: product.max_stock || 100
                }
            }));

            productsStore.productsList = transformedProducts;
        } else {
            productsStore.productsList = [];
        }
    } catch (error) {
        console.error('Error loading products:', error);

        productsStore.productsList = [];

        toast.add({
            severity: 'error',
            summary: 'Error al cargar productos',
            detail: 'No se pudieron cargar los productos. Intente nuevamente.',
            life: 5000
        });
    } finally {
        loading.value = false;
    }
};

// Computed properties
const filteredProducts = computed(() => {
    let result = productsStore.productsList || [];

    if (sanitizedSearchQuery.value) {
        const query = sanitizedSearchQuery.value.toLowerCase().trim();
        result = result.filter(
            (product) =>
                (product.name || '').toLowerCase().includes(query) ||
                (product.category || '').toLowerCase().includes(query) ||
                (product.description || '').toLowerCase().includes(query) ||
                (product.brand || '').toLowerCase().includes(query) ||
                (product.sku || '').toLowerCase().includes(query) ||
                (product.presentation || '').toLowerCase().includes(query) ||
                (product.unidad || '').toLowerCase().includes(query)
        );
    }

    if (selectedCategory.value) {
        result = result.filter((product) => product.category === selectedCategory.value.name);
    }

    switch (sortOption.value) {
        case 'name-asc':
            result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            break;
        case 'name-desc':
            result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
            break;
        case 'price-asc':
            result.sort((a, b) => (a.price || 0) - (b.price || 0));
            break;
        case 'price-desc':
            result.sort((a, b) => (b.price || 0) - (a.price || 0));
            break;
        case 'stock-asc':
            result.sort((a, b) => (a.stockQuantity || 0) - (b.stockQuantity || 0));
            break;
        case 'stock-desc':
            result.sort((a, b) => (b.stockQuantity || 0) - (a.stockQuantity || 0));
            break;
        default:
            result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    return result;
});

const cartTotal = computed(() => {
    forceReactivity.value;
    return cartStore.totalPrice;
});

const cartItemsCount = computed(() => {
    forceReactivity.value;
    return cartStore.totalItems;
});

const totalSavings = computed(() => {
    forceReactivity.value;
    return cartStore.totalSavings;
});

const cartItems = computed(() => {
    forceReactivity.value;
    return cartStore.cartItems || [];
});

// Auth computed properties
const isClientAuthenticated = computed(() => {
    return authStore.isAuthenticated && (authStore.userRole === 'client' || authStore.userType === 'client');
});

const currentUserName = computed(() => {
    return authStore.currentUser?.name || 'Usuario';
});

// User menu items
const userMenuItems = ref([
    {
        label: 'Mi Perfil',
        icon: 'pi pi-user',
        command: () => {
            router.push('/profile');
        }
    },
    {
        label: 'Mis Direcciones',
        icon: 'pi pi-map-marker',
        command: () => {
            router.push('/addresses');
        }
    },
    {
        label: 'Mis Pedidos',
        icon: 'pi pi-shopping-bag',
        command: () => {
            router.push('/orders');
        }
    },
    {
        separator: true
    },
    {
        label: 'Cerrar Sesión',
        icon: 'pi pi-sign-out',
        command: () => {
            logout();
        }
    }
]);

// Methods
const selectCategory = (category) => {
    if (selectedCategory.value === category) {
        selectedCategory.value = null;
    } else {
        selectedCategory.value = category;
    }
};

const clearFilters = () => {
    selectedCategory.value = null;
    searchQuery.value = '';
    sortOption.value = 'name-asc';
};

const toggleCart = () => {
    cartVisible.value = !cartVisible.value;
};

const addToCart = async (product) => {
    if (!product.stock || product.stock.quantity <= 0) {
        toast.add({
            severity: 'warn',
            summary: 'Producto No Disponible',
            detail: `${product.name} está fuera de stock`,
            life: 3000
        });
        return;
    }

    loading.value = true;

    try {
        const success = await addProductToCart(product);
        if (success) {
            forceReactivity.value++;
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
    } finally {
        loading.value = false;
    }
};

const removeFromCart = (productId) => {
    cartStore.removeFromCart(productId);
    forceReactivity.value++;
};

const increaseQuantity = (productId) => {
    cartStore.increaseQuantity(productId);
    forceReactivity.value++;
};

const decreaseQuantity = (productId) => {
    cartStore.decreaseQuantity(productId);
    forceReactivity.value++;
};

const clearCart = () => {
    cartStore.clearCart();
    forceReactivity.value++;
    toast.add({
        severity: 'info',
        summary: 'Carrito Limpiado',
        detail: 'Todos los productos han sido removidos del carrito',
        life: 3000
    });
};

const checkout = async () => {
    await proceedToCheckout();
};

const navigateToLogin = () => {
    router.push('/auth/login');
};

const navigateToRegister = () => {
    router.push('/auth/register');
};

const toggleUserMenu = (event) => {
    userMenu.value.toggle(event);
};

const logout = async () => {
    try {
        await authStore.logout();
        toast.add({
            severity: 'success',
            summary: 'Sesión cerrada',
            detail: 'Has cerrado sesión exitosamente',
            life: 3000
        });
        router.push('/auth/login');
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cerrar la sesión',
            life: 3000
        });
    }
};

const restoreCart = () => {
    try {
        restorePendingCart();
    } catch (error) {
        console.error('Error restoring cart:', error);
    }
};

watch(
    () => cartStore.items,
    () => {
        forceReactivity.value++;
    },
    { deep: true }
);

watch(
    () => cartStore.totalItems,
    () => {
        forceReactivity.value++;
    }
);

// Watcher para sanitizar la búsqueda en tiempo real
watch(searchQuery, (newValue) => {
    const sanitized = sanitizeSearchInput(newValue);
    if (sanitized !== newValue) {
        searchQuery.value = sanitized;
    }
});

// Lifecycle hooks
onMounted(async () => {
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    cartStore.loadFromLocalStorage();
    await loadProducts();
    restoreCart();
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', checkScreenSize);
});
</script>

<template>
    <div class="store-container min-h-screen bg-gray-50">
        <!-- Header -->
        <div class="bg-white shadow-sm border-b sticky top-0 z-40">
            <div class="max-w-7xl mx-auto p-2 sm:p-3 md:p-4">
                <div class="flex flex-wrap justify-between items-center gap-2">
                    <!-- Logo -->
                    <div class="flex items-center space-x-2">
                        <img src="/mc.png" alt="Master Color Logo" class="h-8 sm:h-10" />
                        <h1 class="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">Master Color Store</h1>
                    </div>

                    <!-- Search bar -->
                    <div class="flex-1 max-w-md mx-0 sm:mx-2 md:mx-4 lg:mx-8 order-3 sm:order-2 w-full sm:w-auto mt-2 sm:mt-0">
                        <IconField>
                            <InputIcon class="pi pi-search" />
                            <InputText v-model="searchQuery" placeholder="Buscar productos, categorías..." class="w-full" maxlength="50" />
                        </IconField>
                    </div>

                    <!-- Auth buttons and cart -->
                    <div class="flex items-center space-x-2 sm:space-x-4 order-2 sm:order-3">
                        <!-- Show login/register buttons when NOT authenticated as client -->
                        <template v-if="!isClientAuthenticated">
                            <Button icon="pi pi-sign-in" :label="isSmallScreen ? undefined : 'Iniciar sesión'" class="p-button-outlined p-button-sm font-medium" :class="{ 'p-button-icon-only': isSmallScreen }" @click="navigateToLogin" />
                            <Button
                                icon="pi pi-user-plus"
                                :label="isSmallScreen ? undefined : 'Registrarse'"
                                class="p-button-sm bg-blue-600 border-blue-600 hover:bg-blue-700 font-medium shadow-md"
                                :class="{ 'p-button-icon-only': isSmallScreen }"
                                @click="navigateToRegister"
                            />
                        </template>

                        <!-- Show user info and logout when authenticated as client -->
                        <template v-else>
                            <!-- User menu dropdown -->
                            <div class="relative">
                                <Menu id="user_menu" ref="userMenu" :model="userMenuItems" :popup="true" class="user-menu" />
                                <Button
                                    v-tooltip="isSmallScreen ? currentUserName : 'Menú de usuario'"
                                    icon="pi pi-user"
                                    :label="isSmallScreen ? undefined : currentUserName"
                                    class="p-button-outlined p-button-lg shadow-md user-button"
                                    :class="{ 'p-button-icon-only': isSmallScreen }"
                                    @click="toggleUserMenu"
                                />
                            </div>
                        </template>

                        <!-- Cart button -->
                        <div class="relative">
                            <OverlayBadge :value="cartItemsCount" severity="danger" class="inline-flex">
                                <Button icon="pi pi-shopping-cart" class="p-button-rounded p-button-lg shadow-md" :class="cartItemsCount > 0 ? 'bg-green-600 border-green-600 hover:bg-green-700' : ''" @click="toggleCart" />
                            </OverlayBadge>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main content -->
        <div class="max-w-7xl mx-auto p-2 sm:p-3 md:p-4">
            <div class="flex flex-col md:flex-row gap-3 md:gap-6">
                <!-- Category sidebar -->
                <div class="w-full md:w-64 md:flex-shrink-0">
                    <div class="bg-white rounded-lg shadow-sm p-3 sm:p-4 sticky top-[4.5rem] md:top-24">
                        <div class="flex items-center justify-between mb-4">
                            <h2 class="text-lg font-semibold text-gray-800">Categorías</h2>
                            <Button
                                v-if="selectedCategory || searchQuery || sortOption !== 'name-asc'"
                                v-tooltip="'Limpiar filtros'"
                                icon="pi pi-filter-slash"
                                class="p-button-rounded p-button-outlined p-button-sm p-button-danger"
                                @click="clearFilters"
                            />
                        </div>

                        <div class="flex flex-wrap md:flex-col md:space-y-2 gap-2 md:gap-0">
                            <div
                                v-for="category in availableCategories"
                                :key="category.id"
                                class="flex items-center p-2 sm:p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 text-sm sm:text-base"
                                :class="selectedCategory === category ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-700 hover:text-blue-600'"
                                @click="selectCategory(category)"
                            >
                                <i :class="['pi', category.icon, 'mr-3']"></i>
                                <span class="font-medium">{{ category.label }}</span>
                            </div>
                        </div>

                        <!-- Filter summary -->
                        <div v-if="selectedCategory || searchQuery || sortOption !== 'name-asc'" class="mt-4 pt-4 border-t border-gray-200">
                            <p class="text-sm text-gray-600">Mostrando {{ filteredProducts.length }} de {{ (productsStore.productsList || []).length }} productos</p>
                            <div v-if="sortOption !== 'name-asc'" class="mt-2">
                                <span class="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                    <i class="pi pi-sort-alt mr-1"></i>
                                    {{ sortOptions.find((opt) => opt.value === sortOption)?.label }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Products grid -->
                <div class="flex-1">
                    <!-- Filter and sort bar -->
                    <div class="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-4">
                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div class="flex items-center space-x-2">
                                <i class="pi pi-sort-alt text-gray-500"></i>
                                <span class="text-sm font-medium text-gray-700">Ordenar por:</span>
                            </div>
                            <div class="w-full sm:w-auto">
                                <Select v-model="sortOption" :options="sortOptions" option-label="label" option-value="value" placeholder="Seleccionar orden" class="w-full sm:w-64 sort-select" />
                            </div>
                        </div>
                    </div>

                    <!-- Loading state -->
                    <div v-if="loading" class="text-center py-16 bg-white rounded-lg shadow-sm">
                        <i class="pi pi-spin pi-spinner text-6xl text-blue-500 mb-4"></i>
                        <h3 class="text-xl text-gray-500 mb-2">Cargando productos...</h3>
                        <p class="text-gray-400">Por favor espera mientras cargamos los productos</p>
                    </div>

                    <!-- No results -->
                    <div v-else-if="filteredProducts.length === 0" class="text-center py-16 bg-white rounded-lg shadow-sm">
                        <i class="pi pi-search text-6xl text-gray-300 mb-4"></i>
                        <h3 class="text-xl text-gray-500 mb-2">No se encontraron productos</h3>
                        <p class="text-gray-400 mb-4">Intenta ajustar tu búsqueda o filtros</p>
                        <Button v-tooltip="'Limpiar todos los filtros'" icon="pi pi-broom" class="p-button-rounded p-button-outlined p-button-danger" @click="clearFilters" />
                    </div>

                    <!-- Products grid -->
                    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                        <div v-for="product in filteredProducts" :key="product.id" class="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
                            <!-- Product image -->
                            <div class="relative overflow-hidden">
                                <img :src="product.image" :alt="product.name" class="w-full h-36 sm:h-40 md:h-48 object-contain bg-gray-50 group-hover:scale-105 transition-transform duration-300" />

                                <!-- Discount badge -->
                                <div v-if="product.originalPrice > product.price" class="absolute top-2 left-2">
                                    <span class="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded"> -{{ Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) }}% </span>
                                </div>

                                <!-- Stock status -->
                                <div v-if="!product.inStock" class="absolute top-2 right-2">
                                    <span class="bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded"> Agotado </span>
                                </div>
                            </div>

                            <!-- Product info -->
                            <div class="p-3 sm:p-4">
                                <div class="mb-2">
                                    <span class="text-xs text-gray-500 uppercase tracking-wide">{{ product.category }}</span>
                                </div>

                                <h3 class="text-base sm:text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                                    {{ product.name }}
                                </h3>

                                <p v-tooltip.top="product.description && product.description.length > 100 ? product.description : null" class="text-sm text-gray-600 mb-3 line-clamp-2">
                                    {{ product.description }}
                                </p>

                                <!-- Stock info -->
                                <div class="flex items-center justify-between mb-3">
                                    <div class="flex items-center space-x-2">
                                        <i class="pi pi-box text-gray-500 text-sm"></i>
                                        <span class="text-sm text-gray-600 font-medium">Stock: {{ product.stockQuantity }}</span>
                                    </div>

                                    <!-- Low stock warning -->
                                    <div v-if="product.inStock && product.stockQuantity <= (product.minStock || 5)" class="flex items-center">
                                        <span class="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full border border-orange-200">
                                            <i class="pi pi-exclamation-triangle mr-1"></i>
                                            ¡Quedan pocos!
                                        </span>
                                    </div>
                                </div>

                                <!-- Price -->
                                <div class="flex items-center justify-between mb-3 sm:mb-4">
                                    <div class="flex items-center space-x-2">
                                        <span class="text-xl font-bold text-blue-600"> S/ {{ (product.price || 0).toFixed(2) }} </span>
                                        <span v-if="product.originalPrice && product.price && product.originalPrice > product.price" class="text-sm text-gray-400 line-through"> S/ {{ (product.originalPrice || 0).toFixed(2) }} </span>
                                    </div>
                                </div>

                                <!-- Add to cart button -->
                                <Button
                                    :icon="product.inStock ? 'pi pi-shopping-cart' : 'pi pi-times'"
                                    :label="product.inStock ? 'Añadir al carrito' : 'Agotado'"
                                    :class="product.inStock ? 'w-full' : 'w-full p-button-secondary'"
                                    :disabled="!product.inStock || loading"
                                    @click="addToCart(product)"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Shopping Cart Modal -->
        <Dialog v-model:visible="cartVisible" modal header="Carrito de compras" :style="{ width: '95vw', maxWidth: '600px' }" class="cart-dialog">
            <!-- Empty cart -->
            <div v-if="cartStore.isCartEmpty" class="text-center py-12">
                <i class="pi pi-shopping-cart text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-xl text-gray-500 mb-2">Tu carrito está vacío</h3>
                <p class="text-gray-400">¡Añade algunos productos de impresión para comenzar!</p>
            </div>

            <!-- Cart items -->
            <div v-else>
                <div class="max-h-[60vh] sm:max-h-96 overflow-y-auto mb-4">
                    <div v-for="(item, index) in cartItems" :key="item.id || index" class="flex flex-wrap sm:flex-nowrap items-center p-3 sm:p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors gap-2">
                        <!-- Product image -->
                        <img :src="item.image" :alt="item.name" class="w-12 h-12 sm:w-16 sm:h-16 object-contain bg-gray-50 rounded-lg flex-shrink-0" />

                        <!-- Product info -->
                        <div class="flex-1 ml-0 sm:ml-4 w-[calc(100%-3.5rem)] sm:w-auto">
                            <h4 class="font-semibold text-gray-800 text-sm sm:text-base line-clamp-1 sm:line-clamp-none">{{ item.name }}</h4>
                            <p class="text-sm text-gray-500">{{ item.category }}</p>
                            <div class="flex items-center space-x-2 mt-1">
                                <span class="text-sm font-medium text-blue-600">S/ {{ (item.price || 0).toFixed(2) }}</span>
                                <span v-if="item.originalPrice && item.price && item.originalPrice > item.price" class="text-xs text-gray-400 line-through"> S/ {{ (item.originalPrice || 0).toFixed(2) }} </span>
                            </div>
                        </div>

                        <!-- Quantity controls -->
                        <div class="flex items-center space-x-1 sm:space-x-2 order-3 sm:order-none w-auto">
                            <Button icon="pi pi-minus" class="p-button-rounded p-button-text p-button-sm" @click="decreaseQuantity(item.id)" />
                            <span class="w-8 text-center font-medium">{{ item.quantity }}</span>
                            <Button icon="pi pi-plus" class="p-button-rounded p-button-text p-button-sm" @click="increaseQuantity(item.id)" />
                        </div>

                        <!-- Item total and remove -->
                        <div class="flex flex-col items-end ml-auto sm:ml-4 order-2 sm:order-none">
                            <span class="font-bold text-gray-800">S/ {{ ((item.price || 0) * (item.quantity || 0)).toFixed(2) }}</span>
                            <Button icon="pi pi-trash" class="p-button-rounded p-button-danger p-button-text p-button-sm mt-1" @click="removeFromCart(item.id)" />
                        </div>
                    </div>
                </div>

                <!-- Cart summary -->
                <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-gray-600">Artículos ({{ cartItemsCount }}):</span>
                        <span class="font-medium">S/ {{ (cartTotal || 0).toFixed(2) }}</span>
                    </div>

                    <div v-if="totalSavings > 0" class="flex justify-between items-center text-green-600">
                        <span>Ahorras:</span>
                        <span class="font-medium">-S/ {{ (totalSavings || 0).toFixed(2) }}</span>
                    </div>

                    <div class="border-t border-gray-200 pt-3">
                        <div class="flex justify-between items-center">
                            <span class="text-lg font-semibold text-gray-800">Total:</span>
                            <span class="text-xl font-bold text-blue-600">S/ {{ (cartTotal || 0).toFixed(2) }}</span>
                        </div>
                    </div>
                </div>

                <!-- Action buttons -->
                <div class="flex flex-col sm:flex-row justify-between gap-2 sm:gap-3 mt-4 sm:mt-6">
                    <Button label="Vaciar carrito" icon="pi pi-trash" class="p-button-outlined p-button-danger flex-1" @click="clearCart" />
                    <Button label="Finalizar compra" icon="pi pi-credit-card" class="flex-1 bg-blue-600 border-blue-600 hover:bg-blue-700" :loading="loading" @click="checkout" />
                </div>
            </div>
        </Dialog>

        <!-- Toast notifications -->
        <Toast position="top-right" />
    </div>
</template>

<style scoped>
@media (max-width: 640px) {
    :deep(.p-dialog-header) {
        padding: 1rem;
    }

    :deep(.p-dialog-content) {
        padding: 1rem;
    }

    :deep(.p-button) {
        padding: 0.5rem 0.75rem;
    }

    :deep(.p-button .p-button-icon) {
        font-size: 0.875rem;
    }

    :deep(.p-button .p-button-label) {
        font-size: 0.875rem;
    }

    :deep(.p-toast .p-toast-message) {
        margin: 0.25rem;
        padding: 0.5rem;
    }

    :deep(.p-toast .p-toast-message-content) {
        padding: 0.5rem;
    }
}

.store-container {
    min-height: 100vh;
}

.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Custom PrimeVue overrides */
:deep(.p-button) {
    border-radius: 0.5rem;
    font-weight: 500;
}

:deep(.p-dialog-header) {
    border-bottom: 1px solid #e5e7eb;
    padding: 1.5rem;
}

:deep(.p-dialog-content) {
    padding: 1.5rem;
}

:deep(.p-toast .p-toast-message) {
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

:deep(.p-badge) {
    border-radius: 50%;
    min-width: 1.25rem;
    height: 1.25rem;
    font-size: 0.75rem;
    font-weight: 600;
}

/* Smooth transitions */
.group:hover .group-hover\:scale-105 {
    transform: scale(1.05);
}

/* User authentication styles - unified with cart button */
.user-button {
    background: linear-gradient(135deg, #4f46e5, #6366f1) !important;
    border: none !important;
    color: white !important;
    transition: all 0.3s ease;
    font-weight: 500 !important;
    height: 3rem !important;
    min-height: 3rem !important;
    min-width: 3rem !important;
    padding: 0 1rem !important;
}

/* When showing only icon (small screen), make it circular */
.user-button.p-button-icon-only {
    width: 3rem !important;
    min-width: 3rem !important;
    padding: 0 !important;
}

.user-button:hover {
    background: linear-gradient(135deg, #4338ca, #4f46e5) !important;
    transform: scale(1.05);
}

.logout-button {
    background: linear-gradient(135deg, #ef4444, #dc2626) !important;
    border: none !important;
    color: white !important;
    transition: all 0.3s ease;
    width: 3rem !important;
    height: 3rem !important;
    min-width: 3rem !important;
    min-height: 3rem !important;
}

.logout-button:hover {
    background: linear-gradient(135deg, #dc2626, #b91c1c) !important;
    transform: scale(1.05);
}

/* Ensure consistency with cart button styling */
.user-button i,
.logout-button i {
    font-size: 1.2rem;
}

/* Ensure cart button has consistent sizing */
:deep(.p-button-rounded.p-button-lg) {
    width: 3rem !important;
    height: 3rem !important;
    min-width: 3rem !important;
    min-height: 3rem !important;
}

/* Sort select styling */
.sort-select :deep(.p-dropdown) {
    border-radius: 8px;
    border: 2px solid var(--surface-border);
    transition: all 0.3s ease;
}

.sort-select :deep(.p-dropdown:focus) {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.sort-select :deep(.p-dropdown-label) {
    font-size: 0.875rem;
    color: var(--text-color);
}

/* Low stock warning styles */
.bg-orange-100 {
    background-color: #fed7aa;
}

.text-orange-800 {
    color: #9a3412;
}

.border-orange-200 {
    border-color: #fed7aa;
}

/* Dark mode support for low stock warning */
@media (prefers-color-scheme: dark) {
    .bg-orange-100 {
        background-color: rgba(251, 146, 60, 0.2);
    }

    .text-orange-800 {
        color: #fb923c;
    }

    .border-orange-200 {
        border-color: rgba(251, 146, 60, 0.3);
    }
}

/* User menu styling */
:deep(.user-menu .p-menu) {
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    border: 1px solid #e5e7eb;
    min-width: 180px;
}

:deep(.user-menu .p-menuitem-link) {
    padding: 0.75rem 1rem;
    transition: all 0.2s ease;
}

:deep(.user-menu .p-menuitem-link:hover) {
    background-color: #f3f4f6;
}

:deep(.user-menu .p-menuitem-icon) {
    margin-right: 0.75rem;
    color: #6b7280;
}

:deep(.user-menu .p-menuitem-text) {
    font-weight: 500;
}

:deep(.user-menu .p-separator) {
    margin: 0.5rem 0;
    border-color: #e5e7eb;
}

/* Responsive adjustments */
@media (max-width: 640px) {
    .user-button.p-button-icon-only,
    .logout-button,
    :deep(.p-button-rounded.p-button-lg) {
        width: 2.75rem !important;
        height: 2.75rem !important;
        min-width: 2.75rem !important;
        min-height: 2.75rem !important;
        padding: 0 !important;
    }

    .user-button i,
    .logout-button i {
        font-size: 1.1rem;
    }
}
</style>
