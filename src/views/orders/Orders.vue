<script setup>
import { ordersApi } from '@/api/index';
import { useCart } from '@/composables/useCart';
import { useAddressesStore } from '@/stores/addresses';
import { useOrdersStore } from '@/stores/orders';
import { useToast } from 'primevue/usetoast';
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import OrderDetailsModal from './OrderDetailsModal.vue';
import PaymentModal from './PaymentModal.vue';

const router = useRouter();
const toast = useToast();
const ordersStore = useOrdersStore();
const addressesStore = useAddressesStore();
const { createOrderAndPay } = useCart();

// State
const loading = ref(false);
const showOrderForm = ref(false);
const showOrdersList = ref(false);
const orderItems = ref([]);
const errors = reactive({});
const selectedAddressId = ref(null);
const showNewAddressForm = ref(false);

// Modal states
const showPaymentModal = ref(false);
const showOrderDetailsModal = ref(false);
const selectedOrderForPayment = ref(null);
const selectedOrderId = ref(null);

// Order form data
const orderForm = reactive({
    selectedAddressId: null,
    observations: ''
});

// New address form
const newAddressForm = reactive({
    address_full: '',
    district: '',
    province: '',
    department: '',
    postal_code: '',
    reference: '',
    is_main: false
});

// Payment tracking
const paymentPollingInterval = ref(null);
const paymentLoading = ref(false);

// Computed properties
const orders = computed(() => ordersStore.getOrders);
const addresses = computed(() => addressesStore.getAddresses);

const totalQuantity = computed(() => {
    return orderItems.value.reduce((total, item) => total + (item.quantity || 0), 0);
});

const orderTotal = computed(() => {
    return orderItems.value.reduce((total, item) => {
        return total + (item.price || 0) * (item.quantity || 0);
    }, 0);
});

const totalSavings = computed(() => {
    return orderItems.value.reduce((total, item) => {
        if (item.originalPrice && item.originalPrice > item.price) {
            return total + (item.originalPrice - item.price) * item.quantity;
        }
        return total;
    }, 0);
});

const shippingCost = computed(() => {
    // Free shipping for orders over S/ 100
    return orderTotal.value >= 100 ? 0 : 15;
});

const finalTotal = computed(() => {
    return orderTotal.value + shippingCost.value;
});

// Methods
const loadCheckoutCart = () => {
    try {
        const checkoutCart = localStorage.getItem('checkoutCart');

        if (checkoutCart) {
            const parsedData = JSON.parse(checkoutCart);
            orderItems.value = parsedData;

            if (orderItems.value.length > 0) {
                showOrderForm.value = true;

                toast.add({
                    severity: 'success',
                    summary: 'Carrito Cargado',
                    detail: `Se cargaron ${orderItems.value.length} productos para tu orden`,
                    life: 4000
                });
            }
        }
    } catch (error) {
        console.error('Error loading checkout cart:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar el carrito de compras',
            life: 5000
        });
    }
};

const validateForm = () => {
    // Clear previous errors
    Object.keys(errors).forEach((key) => delete errors[key]);

    let isValid = true;

    if (!selectedAddressId.value) {
        errors.address = 'Debes seleccionar una dirección de entrega';
        isValid = false;

        toast.add({
            severity: 'warn',
            summary: 'Dirección Requerida',
            detail: 'Por favor selecciona una dirección de entrega',
            life: 4000
        });
    }

    if (orderItems.value.length === 0) {
        errors.items = 'No hay productos en el carrito';
        isValid = false;

        toast.add({
            severity: 'warn',
            summary: 'Carrito Vacío',
            detail: 'Agrega productos al carrito antes de crear la orden',
            life: 4000
        });
    }

    return isValid;
};

// Submit order - Step 1: Create Order
const submitOrder = async () => {
    if (!validateForm()) {
        return;
    }

    loading.value = true;

    try {
        const orderPayload = {
            delivery_address_id: selectedAddressId.value,
            products: orderItems.value.map((item) => ({
                product_id: item.id,
                quantity: item.quantity
            })),
            observations: orderForm.observations || null
        };

        const result = await ordersStore.createOrder(orderPayload);

        if (result.success) {
            const createdOrder = result.data.order || result.data;

            toast.add({
                severity: 'success',
                summary: 'Orden Creada',
                detail: `Orden #${createdOrder.id} creada exitosamente`,
                life: 4000
            });

            localStorage.removeItem('checkoutCart');
            selectedOrderForPayment.value = createdOrder;
            showPaymentModal.value = true;
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: result.message || 'Error al crear la orden',
                life: 5000
            });

            if (ordersStore.validationErrors && ordersStore.validationErrors.length > 0) {
                ordersStore.validationErrors.forEach((error) => {
                    toast.add({
                        severity: 'error',
                        summary: 'Error de validación',
                        detail: error,
                        life: 4000
                    });
                });
            }
        }
    } catch (error) {
        console.error('Error creating order:', error);

        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error inesperado al crear la orden',
            life: 5000
        });
    } finally {
        loading.value = false;
    }
};

const resetForm = () => {
    showOrderForm.value = false;
    orderItems.value = [];
    selectedAddressId.value = null;
    orderForm.observations = '';
    Object.keys(errors).forEach((key) => delete errors[key]);
};

const cancelOrder = () => {
    // Save items back to localStorage as pending cart
    if (orderItems.value.length > 0) {
        localStorage.setItem('pendingCart', JSON.stringify(orderItems.value));

        toast.add({
            severity: 'info',
            summary: 'Orden Cancelada',
            detail: 'Los productos se guardaron en tu carrito',
            life: 4000
        });
    }

    resetForm();
    router.push('/');
};

const startNewOrder = () => {
    // Check if there's a cart to process
    loadCheckoutCart();

    if (orderItems.value.length === 0) {
        toast.add({
            severity: 'info',
            summary: 'Carrito Vacío',
            detail: 'Añade productos a tu carrito desde la tienda',
            life: 4000
        });
        router.push('/');
    } else {
        showOrdersList.value = false;
    }
};

const viewMyOrders = () => {
    showOrderForm.value = false;
    showOrdersList.value = true;
    loadOrders();
};

const viewOrderDetails = (order) => {
    selectedOrderId.value = order.id;
    showOrderDetailsModal.value = true;
};

const goBackToStore = () => {
    router.push('/');
};

const getOrderStatusSeverity = (status) => {
    const statusMap = {
        pendiente_pago: 'warning',
        pendiente: 'info',
        confirmado: 'success',
        procesando: 'info',
        enviado: 'success',
        entregado: 'success',
        pago_fallido: 'danger',
        cancelado: 'secondary'
    };
    return statusMap[status] || 'secondary';
};

const getOrderStatusLabel = (status) => {
    const statusMap = {
        pendiente_pago: 'Pendiente de Pago',
        pendiente: 'Pagado - Preparando Envío',
        confirmado: 'Confirmado',
        procesando: 'En Preparación',
        enviado: 'Enviado',
        entregado: 'Entregado',
        pago_fallido: 'Pago Fallido',
        cancelado: 'Cancelado'
    };
    return statusMap[status] || status;
};

const getOrderStatusIcon = (status) => {
    const iconMap = {
        pendiente_pago: 'pi pi-clock',
        pendiente: 'pi pi-check-circle',
        confirmado: 'pi pi-verified',
        procesando: 'pi pi-cog',
        enviado: 'pi pi-send',
        entregado: 'pi pi-check',
        pago_fallido: 'pi pi-times-circle',
        cancelado: 'pi pi-ban'
    };
    return iconMap[status] || 'pi pi-info-circle';
};

const getOrderStatusDescription = (status) => {
    const descriptionMap = {
        pendiente_pago: 'Tu orden está esperando el pago para ser procesada',
        pendiente: 'Tu pago fue exitoso. Estamos preparando tu pedido para el envío',
        confirmado: 'Tu orden ha sido confirmada y está siendo preparada',
        procesando: 'Tu orden está siendo preparada en nuestro almacén',
        enviado: 'Tu orden ha sido enviada y está en camino',
        entregado: 'Tu orden ha sido entregada exitosamente',
        pago_fallido: 'Hubo un problema con el pago. Puedes intentar nuevamente',
        cancelado: 'Esta orden ha sido cancelada'
    };
    return descriptionMap[status] || 'Estado de la orden';
};

const retryPayment = (orderId) => {
    const order = ordersStore.getOrderById(orderId);
    if (order) {
        selectedOrderForPayment.value = order;
        showPaymentModal.value = true;
    }
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Load addresses
const loadAddresses = async () => {
    const result = await addressesStore.fetchAddresses();

    if (result.success) {
        // Auto-select main address if available
        const mainAddress = addressesStore.getMainAddress;
        if (mainAddress && !selectedAddressId.value) {
            selectedAddressId.value = mainAddress.id;
        }
    } else {
        toast.add({
            severity: 'warn',
            summary: 'Direcciones',
            detail: 'No se pudieron cargar las direcciones. Puedes agregar una nueva.',
            life: 4000
        });
    }
};

// Load orders
const loadOrders = async () => {
    const result = await ordersStore.fetchOrders();

    if (!result.success) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar las órdenes',
            life: 4000
        });
    }
};

// Check payment status on return (actualizado según la guía)
const checkPaymentStatus = async () => {
    const orderId = localStorage.getItem('pendingOrderId') || localStorage.getItem('currentOrderId');
    if (!orderId) return;

    try {
        const response = await ordersApi.getPaymentStatus(orderId);

        if (response.data && response.data.success) {
            const status = response.data.data;

            if (status.payment_status === 'approved') {
                toast.add({
                    severity: 'success',
                    summary: 'Pago Exitoso',
                    detail: `Tu pago ha sido confirmado. Orden #${orderId}`,
                    life: 6000
                });

                // Clear stored order ID
                localStorage.removeItem('pendingOrderId');
                localStorage.removeItem('currentOrderId');

                // Reload orders to show updated status
                await loadOrders();
                showOrdersList.value = true;
            } else if (status.payment_status === 'rejected' || status.payment_status === 'cancelled') {
                toast.add({
                    severity: 'error',
                    summary: 'Pago Fallido',
                    detail: 'El pago no pudo ser procesado. Puedes intentar nuevamente.',
                    life: 6000
                });

                localStorage.removeItem('pendingOrderId');
                localStorage.removeItem('currentOrderId');
            } else if (status.payment_status === 'pending') {
                toast.add({
                    severity: 'info',
                    summary: 'Pago Pendiente',
                    detail: 'Tu pago está siendo procesado. Te notificaremos cuando sea confirmado.',
                    life: 6000
                });

                // Start polling for status updates
                startPaymentPolling(orderId);
            }
        }
    } catch (error) {
        console.error('Error checking payment status:', error);
        localStorage.removeItem('currentOrderId');
    }
};

// Poll payment status for pending payments
const startPaymentPolling = (orderId) => {
    if (paymentPollingInterval.value) {
        clearInterval(paymentPollingInterval.value);
    }

    paymentPollingInterval.value = setInterval(async () => {
        try {
            const response = await ordersApi.getPaymentStatus(orderId);

            if (response.data && response.data.success) {
                const status = response.data.data;

                if (status.payment_status === 'approved') {
                    clearInterval(paymentPollingInterval.value);
                    localStorage.removeItem('pendingOrderId');
                    localStorage.removeItem('currentOrderId');

                    toast.add({
                        severity: 'success',
                        summary: 'Pago Confirmado',
                        detail: 'Tu pago ha sido confirmado exitosamente',
                        life: 6000
                    });

                    await loadOrders();
                } else if (status.payment_status === 'rejected' || status.payment_status === 'cancelled') {
                    clearInterval(paymentPollingInterval.value);
                    localStorage.removeItem('pendingOrderId');
                    localStorage.removeItem('currentOrderId');

                    toast.add({
                        severity: 'error',
                        summary: 'Pago Rechazado',
                        detail: 'El pago ha sido rechazado',
                        life: 6000
                    });
                }
            }
        } catch (error) {
            console.error('Error polling payment status:', error);
        }
    }, 10000); // Check every 10 seconds
};

// Stop polling when component unmounts
const stopPaymentPolling = () => {
    if (paymentPollingInterval.value) {
        clearInterval(paymentPollingInterval.value);
        paymentPollingInterval.value = null;
    }
};

// Add new address
const addNewAddress = async () => {
    const result = await addressesStore.createAddress(newAddressForm);

    if (result.success) {
        toast.add({
            severity: 'success',
            summary: 'Dirección Agregada',
            detail: 'Nueva dirección creada exitosamente',
            life: 4000
        });

        // Reset form and close modal
        Object.keys(newAddressForm).forEach((key) => {
            if (typeof newAddressForm[key] === 'boolean') {
                newAddressForm[key] = false;
            } else {
                newAddressForm[key] = '';
            }
        });

        showNewAddressForm.value = false;

        // Auto-select the new address if it's set as main
        const newAddress = result.data.address || result.data;
        if (newAddress.is_main) {
            selectedAddressId.value = newAddress.id;
        }
    } else {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: result.message || 'No se pudo agregar la dirección',
            life: 5000
        });
    }
};

// Métodos para manejar eventos de modales
const handlePaymentSuccess = () => {
    toast.add({
        severity: 'success',
        summary: 'Pago Exitoso',
        detail: 'Tu pago ha sido procesado correctamente',
        life: 5000
    });

    // Recargar órdenes para mostrar el estado actualizado
    loadOrders();

    // Resetear formulario y mostrar lista de órdenes
    resetForm();
    showOrdersList.value = true;
};

const handlePaymentFailed = (error) => {
    toast.add({
        severity: 'error',
        summary: 'Error en el Pago',
        detail: error.message || 'No se pudo procesar el pago',
        life: 5000
    });
};

const handleRetryPaymentFromDetails = (order) => {
    selectedOrderForPayment.value = order;
    showPaymentModal.value = true;
};

const handleCancelOrderFromDetails = async (order) => {
    const result = await ordersStore.cancelOrder(order.id);

    if (result.success) {
        toast.add({
            severity: 'success',
            summary: 'Orden Cancelada',
            detail: `La orden #${order.id} ha sido cancelada`,
            life: 4000
        });

        // Recargar órdenes
        await loadOrders();
    } else {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: result.message || 'No se pudo cancelar la orden',
            life: 5000
        });
    }
};

const getOrderProducts = (order) => {
    const products = order.items || order.products || order.order_details || [];

    return products.map((product) => ({
        name: product.name || product.product_name || product.product?.name || 'Producto sin nombre',
        quantity: product.quantity || product.pivot?.quantity || product.qty || 1
    }));
};

// Lifecycle
onMounted(async () => {
    loadCheckoutCart();
    await loadAddresses();
    await checkPaymentStatus();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('collection_status') || urlParams.has('payment_id') || urlParams.has('status')) {
        router.push(`/payment-return${window.location.search}`);
        return;
    }

    await loadOrders();
});

// Cleanup
onBeforeUnmount(() => {
    stopPaymentPolling();
});
</script>

<template>
    <div class="orders-management">
        <!-- Header Section -->
        <div class="header-section">
            <div class="header-content">
                <div class="title-section">
                    <div class="icon-wrapper">
                        <i class="pi pi-shopping-cart"></i>
                    </div>
                    <div>
                        <h1 class="main-title">Órdenes de Compra</h1>
                        <p class="subtitle">Gestiona tus pedidos y completa tu compra</p>
                    </div>
                </div>
                <div class="header-actions">
                    <Button v-if="!showOrderForm && !showOrdersList" label="Volver a la Tienda" icon="pi pi-arrow-left" class="back-button" outlined @click="goBackToStore" />
                    <Button v-if="!showOrderForm && !showOrdersList" label="Ver Mis Órdenes" icon="pi pi-list" class="orders-button" @click="viewMyOrders" />
                    <Button v-if="showOrdersList" label="Nueva Orden" icon="pi pi-plus" class="new-order-button" @click="startNewOrder" />
                </div>
            </div>
        </div>

        <!-- Order Creation Form -->
        <div v-if="showOrderForm" class="content-card">
            <div class="order-form-header">
                <h2 class="form-title">
                    <i class="pi pi-plus-circle"></i>
                    Nueva Orden de Compra
                </h2>
                <p class="form-subtitle">Revisa tu pedido y completa la información de entrega</p>
            </div>

            <!-- Cart Summary -->
            <div class="cart-summary-section">
                <h3 class="section-title">
                    <i class="pi pi-shopping-bag"></i>
                    {{ totalQuantity }} productos - S/ {{ (parseFloat(finalTotal) || 0).toFixed(2) }}
                </h3>

                <!-- Compact Items List -->
                <div class="cart-items-compact">
                    <div v-for="(item, index) in orderItems" :key="index" class="cart-item-compact">
                        <img :src="item.image" :alt="item.name" class="item-image-compact" />
                        <div class="item-info">
                            <h4 class="item-name-compact">{{ item.name }}</h4>
                            <span class="item-details-compact">
                                {{ item.quantity }}x S/ {{ (parseFloat(item.price) || 0).toFixed(2) }} =
                                <strong>S/ {{ ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)).toFixed(2) }}</strong>
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Compact Totals -->
                <div class="order-totals-compact">
                    <div v-if="totalSavings > 0" class="totals-row-compact savings">
                        <span>Descuentos: -S/ {{ (parseFloat(totalSavings) || 0).toFixed(2) }}</span>
                    </div>
                    <div class="totals-row-compact shipping">
                        <span>Envío: {{ shippingCost > 0 ? `S/ ${(parseFloat(shippingCost) || 0).toFixed(2)}` : 'Gratis' }}</span>
                    </div>
                    <div class="totals-row-compact final">
                        <span
                            ><strong>Total: S/ {{ (parseFloat(finalTotal) || 0).toFixed(2) }}</strong></span
                        >
                    </div>
                </div>
            </div>

            <!-- Order Form -->
            <form class="order-form" @submit.prevent="submitOrder">
                <div class="form-sections">
                    <!-- Delivery Address Selection -->
                    <div class="form-section">
                        <h3 class="section-title">
                            <i class="pi pi-map-marker"></i>
                            Dirección de Entrega
                        </h3>

                        <div v-if="addresses.length === 0" class="no-addresses">
                            <p class="no-addresses-text">No tienes direcciones guardadas</p>
                            <Button label="Agregar Dirección" icon="pi pi-plus" class="add-address-button" @click="showNewAddressForm = true" />
                        </div>

                        <div v-else class="addresses-selection">
                            <div class="form-group">
                                <label class="form-label required">Selecciona dirección de entrega</label>
                                <div class="addresses-grid">
                                    <div v-for="address in addresses" :key="address.id" class="address-card" :class="{ selected: selectedAddressId === address.id }" @click="selectedAddressId = address.id">
                                        <div class="address-header">
                                            <div class="address-indicator">
                                                <i v-if="selectedAddressId === address.id" class="pi pi-check"></i>
                                                <i v-else class="pi pi-circle"></i>
                                            </div>
                                            <span v-if="address.is_main" class="main-badge">Principal</span>
                                        </div>
                                        <div class="address-content">
                                            <p class="address-full">{{ address.address_full }}</p>
                                            <p class="address-location">{{ address.district }}, {{ address.province }}, {{ address.department }}</p>
                                            <p v-if="address.postal_code" class="address-postal">CP: {{ address.postal_code }}</p>
                                            <p v-if="address.reference" class="address-reference">Ref: {{ address.reference }}</p>
                                        </div>
                                    </div>
                                </div>
                                <small v-if="errors.address" class="p-error">{{ errors.address }}</small>
                            </div>

                            <div class="address-actions">
                                <Button label="Agregar Nueva Dirección" icon="pi pi-plus" class="p-button-outlined" type="button" @click="showNewAddressForm = true" />
                            </div>
                        </div>
                    </div>

                    <!-- Additional Information -->
                    <div class="form-section">
                        <h3 class="section-title">
                            <i class="pi pi-comment"></i>
                            Información Adicional
                        </h3>
                        <div class="form-group">
                            <label class="form-label">Observaciones del pedido (opcional)</label>
                            <Textarea v-model="orderForm.observations" placeholder="Instrucciones especiales, preferencias de entrega, etc." rows="3" />
                        </div>
                    </div>
                </div>

                <!-- Form Actions -->
                <div class="form-actions">
                    <Button type="button" label="Cancelar" icon="pi pi-times" class="cancel-button" outlined @click="cancelOrder" />
                    <Button type="submit" label="Proceder al Pago" icon="pi pi-credit-card" class="submit-button" :loading="loading || paymentLoading" :disabled="!selectedAddressId || orderItems.length === 0" />
                </div>
            </form>
        </div>

        <!-- Orders List -->
        <div v-else-if="showOrdersList" class="content-card">
            <div class="orders-header">
                <h2 class="table-title">Mis Órdenes de Compra</h2>
            </div>

            <!-- Orders table or empty state -->
            <div v-if="orders.length === 0" class="empty-orders">
                <i class="pi pi-shopping-cart empty-icon"></i>
                <h3>No tienes órdenes de compra</h3>
                <p>Cuando realices tu primera compra, aparecerá aquí</p>
                <Button label="Ir a la Tienda" icon="pi pi-shopping-bag" class="shop-button" @click="goBackToStore" />
            </div>

            <!-- Orders table -->
            <div v-else class="orders-table">
                <DataTable :value="orders" responsive-layout="scroll" class="orders-datatable">
                    <Column field="id" header="Orden #" style="min-width: 100px">
                        <template #body="slotProps">
                            <strong>#{{ slotProps.data.id }}</strong>
                        </template>
                    </Column>

                    <Column field="created_at" header="Fecha" style="min-width: 150px">
                        <template #body="slotProps">
                            {{ formatDate(slotProps.data.created_at) }}
                        </template>
                    </Column>

                    <Column field="status" header="Estado" style="min-width: 200px">
                        <template #body="slotProps">
                            <div class="order-status-cell">
                                <div class="status-tag-container">
                                    <Tag :value="getOrderStatusLabel(slotProps.data.status)" :severity="getOrderStatusSeverity(slotProps.data.status)" class="status-tag-enhanced">
                                        <template #default>
                                            <i :class="getOrderStatusIcon(slotProps.data.status)" class="status-icon"></i>
                                            <span>{{ getOrderStatusLabel(slotProps.data.status) }}</span>
                                        </template>
                                    </Tag>
                                </div>
                                <small class="status-description">
                                    {{ getOrderStatusDescription(slotProps.data.status) }}
                                </small>
                            </div>
                        </template>
                    </Column>

                    <Column header="Productos" style="min-width: 200px">
                        <template #body="slotProps">
                            <div class="order-products-summary">
                                <div v-if="getOrderProducts(slotProps.data).length > 0" class="products-list">
                                    <div v-for="(product, index) in getOrderProducts(slotProps.data).slice(0, 2)" :key="index" class="product-item">
                                        <span class="product-name">{{ product.name }}</span>
                                        <span class="product-quantity">x{{ product.quantity }}</span>
                                    </div>
                                    <div v-if="getOrderProducts(slotProps.data).length > 2" class="more-products">+{{ getOrderProducts(slotProps.data).length - 2 }} más</div>
                                </div>
                                <div v-else class="no-products">
                                    <Button icon="pi pi-eye" label="Ver detalles" class="p-button-sm p-button-outlined" @click="viewOrderDetails(slotProps.data)" />
                                </div>
                            </div>
                        </template>
                    </Column>

                    <Column field="total" header="Total" style="min-width: 100px">
                        <template #body="slotProps">
                            <strong>S/ {{ (parseFloat(slotProps.data.total) || 0).toFixed(2) }}</strong>
                        </template>
                    </Column>

                    <Column header="Acciones" style="min-width: 150px">
                        <template #body="slotProps">
                            <div class="order-actions">
                                <Button
                                    v-if="slotProps.data.status === 'pendiente_pago' || slotProps.data.status === 'pago_fallido'"
                                    v-tooltip="'Pagar'"
                                    icon="pi pi-credit-card"
                                    class="p-button-rounded p-button-sm"
                                    @click="retryPayment(slotProps.data.id)"
                                />
                                <Button v-tooltip="'Ver detalles'" icon="pi pi-eye" class="p-button-rounded p-button-outlined p-button-sm" @click="viewOrderDetails(slotProps.data)" />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>

        <!-- Welcome screen when no action is selected -->
        <div v-else class="content-card welcome-screen">
            <div class="welcome-content">
                <i class="pi pi-shopping-cart welcome-icon"></i>
                <h2>¡Bienvenido a tus Órdenes!</h2>
                <p>Aquí puedes gestionar tus pedidos y realizar nuevas compras</p>

                <div class="welcome-actions">
                    <Button v-if="orderItems.length > 0" label="Procesar Carrito" icon="pi pi-shopping-cart" class="primary-action" @click="startNewOrder" />
                    <Button label="Ver Mis Órdenes" icon="pi pi-list" class="secondary-action" outlined @click="viewMyOrders" />
                </div>
            </div>
        </div>

        <!-- New Address Dialog -->
        <Dialog v-model:visible="showNewAddressForm" modal header="Agregar Nueva Dirección" :style="{ width: '90vw', maxWidth: '600px' }">
            <form class="new-address-form" @submit.prevent="addNewAddress">
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label required">Dirección completa</label>
                        <InputText v-model="newAddressForm.address_full" placeholder="Ej: Av. Los Olivos 123, Mz A Lt 5" required />
                    </div>

                    <div class="form-group">
                        <label class="form-label required">Distrito</label>
                        <InputText v-model="newAddressForm.district" placeholder="Ej: San Juan de Lurigancho" required />
                    </div>

                    <div class="form-group">
                        <label class="form-label required">Provincia</label>
                        <InputText v-model="newAddressForm.province" placeholder="Ej: Lima" required />
                    </div>

                    <div class="form-group">
                        <label class="form-label required">Departamento</label>
                        <InputText v-model="newAddressForm.department" placeholder="Ej: Lima" required />
                    </div>

                    <div class="form-group">
                        <label class="form-label">Código postal</label>
                        <InputText v-model="newAddressForm.postal_code" placeholder="Ej: 15434" />
                    </div>

                    <div class="form-group">
                        <label class="form-label">Referencia</label>
                        <InputText v-model="newAddressForm.reference" placeholder="Ej: Frente al parque, casa verde" />
                    </div>
                </div>

                <div class="form-group checkbox-group">
                    <Checkbox id="isMain" v-model="newAddressForm.is_main" :binary="true" />
                    <label for="isMain" class="checkbox-label"> Establecer como dirección principal </label>
                </div>

                <div class="dialog-actions">
                    <Button type="button" label="Cancelar" icon="pi pi-times" class="p-button-outlined" @click="showNewAddressForm = false" />
                    <Button type="submit" label="Agregar Dirección" icon="pi pi-check" :loading="loading" />
                </div>
            </form>
        </Dialog>

        <Toast position="top-right" />

        <!-- Payment Modal -->
        <PaymentModal v-model:visible="showPaymentModal" :order="selectedOrderForPayment" @payment-success="handlePaymentSuccess" @payment-failed="handlePaymentFailed" />

        <!-- Order Details Modal -->
        <OrderDetailsModal v-model:visible="showOrderDetailsModal" :order-id="selectedOrderId" @retry-payment="handleRetryPaymentFromDetails" @cancel-order="handleCancelOrderFromDetails" />
    </div>
</template>

<style scoped>
.orders-management {
    min-height: 100vh;
    background: #f8fafc;
}

/* Header Section */
.header-section {
    margin-bottom: 2rem;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
}

.title-section {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.icon-wrapper {
    width: 70px;
    height: 70px;
    border-radius: 20px;
    background: linear-gradient(135deg, #10b981, #059669);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 2rem;
    box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3);
}

.main-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: #2c3e50;
    margin: 0;
    background: linear-gradient(135deg, #10b981, #059669);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.subtitle {
    color: #64748b;
    font-size: 1.1rem;
    margin: 0.5rem 0 0 0;
}

.header-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.back-button,
.orders-button,
.new-order-button {
    background: transparent;
    color: #64748b;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 0.75rem 1.5rem;
    font-weight: 600;
    transition: all 0.3s ease;
}

.back-button:hover,
.orders-button:hover,
.new-order-button:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
    color: #475569;
}

/* Content Card */
.content-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    padding: 2rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
}

/* Order Form Header */
.order-form-header {
    text-align: center;
    margin-bottom: 2rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid #e2e8f0;
}

.form-title {
    font-size: 1.8rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 0.5rem 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.form-title i {
    color: #10b981;
}

.form-subtitle {
    color: #64748b;
    font-size: 1rem;
    margin: 0;
}

/* Cart Summary */
.cart-summary-section {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: #f8fafc;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
}

.section-title {
    font-size: 1.2rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 1.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.section-title i {
    color: #10b981;
}

.cart-items {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.cart-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: white;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
}

.item-image {
    width: 80px;
    height: 80px;
    object-fit: contain;
    background: #f8fafc;
    border-radius: 8px;
    flex-shrink: 0;
}

.item-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.item-name {
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    margin: 0;
}

.item-category {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
}

.item-meta {
    display: flex;
    gap: 1rem;
    margin-top: 0.25rem;
}

.item-sku,
.item-brand {
    font-size: 0.75rem;
    color: #9ca3af;
    background: #f3f4f6;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
}

.item-quantity {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    min-width: 80px;
}

.quantity-label {
    font-size: 0.75rem;
    color: #6b7280;
}

.quantity-value {
    font-size: 1.125rem;
    font-weight: 600;
    color: #10b981;
    background: #ecfdf5;
    padding: 0.25rem 0.75rem;
    border-radius: 6px;
}

.item-pricing {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
    min-width: 120px;
}

.unit-price,
.total-price {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.125rem;
}

.price-label,
.total-label {
    font-size: 0.75rem;
    color: #6b7280;
}

.price-value {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
}

.total-value {
    font-size: 1rem;
    font-weight: 600;
    color: #10b981;
}

/* Compact Cart Items */
.cart-items-compact {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
}

.cart-item-compact {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: white;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.item-image-compact {
    width: 50px;
    height: 50px;
    object-fit: contain;
    background: #f8fafc;
    border-radius: 6px;
    flex-shrink: 0;
}

.item-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.item-name-compact {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin: 0;
    line-height: 1.3;
}

.item-details-compact {
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.2;
}

.item-details-compact strong {
    color: #10b981;
    font-weight: 600;
}

/* Compact Order Totals */
.order-totals-compact {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    padding: 0.75rem;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.totals-row-compact {
    display: flex;
    justify-content: flex-end;
    font-size: 0.875rem;
}

.totals-row-compact.savings {
    color: #059669;
}

.totals-row-compact.shipping {
    color: #6b7280;
}

.totals-row-compact.final {
    font-size: 1rem;
    color: #10b981;
    margin-top: 0.25rem;
    padding-top: 0.375rem;
    border-top: 1px solid #e2e8f0;
}

/* Order Totals */
.order-totals {
    padding: 1rem;
    background: white;
    border-radius: 12px;
    border: 2px solid #10b981;
}

.totals-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
}

.totals-row:not(:last-child) {
    border-bottom: 1px solid #f3f4f6;
}

.totals-row.savings {
    color: #059669;
}

.totals-row.shipping {
    color: #6b7280;
}

.totals-row.final {
    font-size: 1.125rem;
    font-weight: 700;
    color: #10b981;
    border-top: 2px solid #e5e7eb;
    margin-top: 0.5rem;
    padding-top: 1rem;
}

.totals-label {
    font-weight: 500;
}

.totals-value {
    font-weight: 600;
}

/* Form Sections */
.form-sections {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    margin-bottom: 2rem;
}

.form-section {
    padding: 1.5rem;
    background: #f8fafc;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.form-label {
    font-weight: 500;
    color: #374151;
    font-size: 0.9rem;
}

.form-label.required::after {
    content: ' *';
    color: #ef4444;
}

/* Address Selection */
.no-addresses {
    text-align: center;
    padding: 2rem;
    color: #64748b;
}

.no-addresses-text {
    margin-bottom: 1rem;
    font-size: 1rem;
}

.add-address-button {
    background: linear-gradient(135deg, #10b981, #059669);
    border: none;
    color: white;
    padding: 0.75rem 1.5rem;
    font-weight: 600;
    border-radius: 12px;
}

.addresses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
}

.address-card {
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    background: white;
}

.address-card:hover {
    border-color: #10b981;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
}

.address-card.selected {
    border-color: #10b981;
    background: #ecfdf5;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}

.address-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
}

.address-indicator {
    color: #10b981;
    font-size: 1.2rem;
}

.main-badge {
    background: #10b981;
    color: white;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-weight: 600;
}

.address-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.address-full {
    font-weight: 600;
    color: #374151;
    margin: 0;
}

.address-location,
.address-postal,
.address-reference {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
}

.address-actions {
    margin-top: 1rem;
}

/* Form Actions */
.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e2e8f0;
}

.cancel-button {
    background: transparent;
    color: #64748b;
    border: 2px solid #e2e8f0;
    padding: 0.75rem 2rem;
    font-weight: 600;
    border-radius: 12px;
}

.cancel-button:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
}

.submit-button {
    background: linear-gradient(135deg, #10b981, #059669);
    border: none;
    color: white;
    padding: 0.75rem 2rem;
    font-weight: 600;
    border-radius: 12px;
    box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
}

.submit-button:hover {
    background: linear-gradient(135deg, #059669, #047857);
    box-shadow: 0 12px 24px rgba(16, 185, 129, 0.4);
}

.submit-button:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    box-shadow: none;
}

/* Orders List */
.orders-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
}

.table-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #2c3e50;
    margin: 0;
}

/* Empty State */
.empty-orders {
    text-align: center;
    padding: 4rem 2rem;
    color: #64748b;
}

.empty-icon {
    font-size: 4rem;
    color: #cbd5e1;
    margin-bottom: 1rem;
}

.empty-orders h3 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    color: #374151;
}

.empty-orders p {
    margin: 0 0 2rem 0;
    font-size: 1rem;
}

.shop-button {
    background: linear-gradient(135deg, #667eea, #764ba2);
    border: none;
    color: white;
    padding: 0.75rem 2rem;
    font-weight: 600;
    border-radius: 12px;
}

.shop-button:hover {
    background: linear-gradient(135deg, #5a67d8, #667eea);
}

/* Orders Table */
.orders-table {
    margin-top: 1rem;
}

.order-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

/* Enhanced Order Status Styles */
.order-status-cell {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-width: 220px;
}

.status-tag-container {
    display: flex;
    justify-content: flex-start;
}

.status-tag-enhanced {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.875rem;
    white-space: nowrap;
    min-width: fit-content;
}

.status-icon {
    font-size: 0.875rem;
    flex-shrink: 0;
}

.status-description {
    color: #6b7280;
    font-size: 0.75rem;
    line-height: 1.3;
    margin: 0;
    display: block;
    text-align: left;
}

/* Status-specific colors and animations */
.status-tag-enhanced[data-pc-severity='info'] {
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
    color: #1e40af;
    border: 1px solid #60a5fa;
}

.status-tag-enhanced[data-pc-severity='success'] {
    background: linear-gradient(135deg, #d1fae5, #a7f3d0);
    color: #059669;
    border: 1px solid #34d399;
}

.status-tag-enhanced[data-pc-severity='warning'] {
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    color: #d97706;
    border: 1px solid #f59e0b;
}

.status-tag-enhanced[data-pc-severity='danger'] {
    background: linear-gradient(135deg, #fee2e2, #fecaca);
    color: #dc2626;
    border: 1px solid #f87171;
}

.status-tag-enhanced[data-pc-severity='secondary'] {
    background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
    color: #64748b;
    border: 1px solid #94a3b8;
}

/* Special styling for "pendiente" status to make it more prominent */
.status-tag-enhanced[data-pc-severity='info'] .status-icon {
    color: #10b981;
    animation: pulse-success 2s infinite;
}

@keyframes pulse-success {
    0%,
    100% {
        opacity: 1;
        transform: scale(1);
    }

    50% {
        opacity: 0.8;
        transform: scale(1.1);
    }
}

/* Processing animation for "procesando" status */
.status-tag-enhanced:has(.pi-cog) .status-icon {
    animation: spin 2s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

/* Products column styles */
.order-products-summary {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    max-width: 200px;
}

.products-list {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
}

.product-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    font-size: 0.875rem;
}

.product-name {
    color: #374151;
    font-weight: 500;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.product-quantity {
    color: #10b981;
    font-weight: 600;
    font-size: 0.75rem;
    background: #ecfdf5;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    flex-shrink: 0;
}

.more-products {
    font-size: 0.75rem;
    color: #6b7280;
    font-style: italic;
    text-align: center;
    padding: 0.125rem 0;
}

.no-products {
    font-size: 0.875rem;
    color: #9ca3af;
    font-style: italic;
}

/* Welcome Screen */
.welcome-screen {
    text-align: center;
    padding: 4rem 2rem;
}

.welcome-content {
    max-width: 500px;
    margin: 0 auto;
}

.welcome-icon {
    font-size: 4rem;
    color: #10b981;
    margin-bottom: 2rem;
}

.welcome-content h2 {
    font-size: 2rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 1rem 0;
}

.welcome-content p {
    color: #64748b;
    font-size: 1.1rem;
    margin: 0 0 2rem 0;
}

.welcome-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
}

.primary-action {
    background: linear-gradient(135deg, #10b981, #059669);
    border: none;
    color: white;
    padding: 1rem 2rem;
    font-weight: 600;
    border-radius: 12px;
    font-size: 1rem;
}

.secondary-action {
    background: transparent;
    color: #10b981;
    border: 2px solid #10b981;
    padding: 1rem 2rem;
    font-weight: 600;
    border-radius: 12px;
    font-size: 1rem;
}

/* New Address Form */
.new-address-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
}

.checkbox-group {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
}

.checkbox-label {
    cursor: pointer;
    font-size: 0.9rem;
    color: #374151;
}

.dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e2e8f0;
}

/* Responsive Design */
@media (max-width: 768px) {
    .header-content {
        flex-direction: column;
        gap: 1.5rem;
        text-align: center;
    }

    .main-title {
        font-size: 2rem;
    }

    .content-card {
        padding: 1rem;
    }

    .cart-item {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
    }

    .item-details,
    .item-quantity,
    .item-pricing {
        text-align: center;
    }

    .addresses-grid {
        grid-template-columns: 1fr;
    }

    .form-actions,
    .welcome-actions,
    .dialog-actions {
        flex-direction: column;
    }

    .orders-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
    }

    .header-actions {
        flex-direction: column;
        gap: 0.5rem;
    }

    /* Responsive status styles */
    .order-status-cell {
        max-width: 100%;
    }

    .status-tag-enhanced {
        font-size: 0.75rem;
        padding: 0.375rem 0.5rem;
        flex-wrap: wrap;
        justify-content: center;
        min-width: 100%;
    }

    .status-description {
        font-size: 0.6875rem;
        text-align: center;
    }

    /* Responsive compact cart styles */
    .cart-item-compact {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
        text-align: center;
        padding: 1rem;
    }

    .item-image-compact {
        width: 60px;
        height: 60px;
        align-self: center;
    }

    .item-info {
        align-items: center;
        text-align: center;
        gap: 0.375rem;
    }

    .order-totals-compact {
        padding: 1rem;
    }

    .totals-row-compact {
        justify-content: center;
        font-size: 0.9rem;
    }
}
</style>
