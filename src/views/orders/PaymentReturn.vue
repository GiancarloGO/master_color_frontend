<script setup>
import { useOrdersStore } from '@/stores/orders';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const toast = useToast();
const ordersStore = useOrdersStore();

// State
const loading = ref(true);
const paymentStatus = ref(null);
const order = ref(null);
const checkingPayment = ref(true);

// Get parameters from URL
const collection_id = route.query.collection_id;
const collection_status = route.query.collection_status;
const payment_id = route.query.payment_id;
const status = route.query.status;
const external_reference = route.query.external_reference;
const payment_type = route.query.payment_type;
const merchant_order_id = route.query.merchant_order_id;
const preference_id = route.query.preference_id;

// Get order ID from URL or localStorage (saved before redirect)
const orderId = route.query.order || localStorage.getItem('currentOrderId') || localStorage.getItem('pendingOrderId');

console.log('🔄 PaymentReturn: URL parameters:', {
    collection_id,
    collection_status,
    payment_id,
    status,
    external_reference,
    payment_type,
    merchant_order_id,
    preference_id,
    orderId
});

// Computed - Basado en la estructura del backend según la guía
const paymentResult = computed(() => {
    // Si no hay paymentStatus, usar parámetros de URL para estado inicial
    if (!paymentStatus.value) {
        const isApproved = status === 'approved' || collection_status === 'approved';
        const isPending = status === 'pending' || collection_status === 'pending';
        const isRejected = status === 'rejected' || collection_status === 'rejected';

        return {
            isApproved,
            isPending,
            isRejected,
            isFailed: !isApproved && !isPending
        };
    }

    // Usar datos del backend según la estructura de la guía
    const backendPaymentStatus = paymentStatus.value.paymentStatus;
    const backendOrderStatus = paymentStatus.value.orderStatus;

    const isApproved = backendPaymentStatus === 'approved' && backendOrderStatus === 'pendiente';
    const isPending = backendPaymentStatus === 'pending';
    const isRejected = backendPaymentStatus === 'rejected' || backendOrderStatus === 'pago_fallido';

    return {
        isApproved,
        isPending,
        isRejected,
        isFailed: !isApproved && !isPending
    };
});

const statusIcon = computed(() => {
    if (!paymentResult.value) return 'pi-spin pi-spinner';

    if (paymentResult.value.isApproved) return 'pi-check-circle';
    if (paymentResult.value.isPending) return 'pi-clock';
    if (paymentResult.value.isRejected) return 'pi-times-circle';
    return 'pi-exclamation-triangle';
});

const statusColor = computed(() => {
    if (!paymentResult.value) return 'text-blue-500';

    if (paymentResult.value.isApproved) return 'text-green-500';
    if (paymentResult.value.isPending) return 'text-yellow-500';
    if (paymentResult.value.isRejected) return 'text-red-500';
    return 'text-orange-500';
});

const statusMessage = computed(() => {
    if (!paymentResult.value) return 'Verificando estado del pago...';

    if (paymentResult.value.isApproved) return '¡Pago procesado exitosamente!';
    if (paymentResult.value.isPending) return 'Tu pago está siendo procesado';
    if (paymentResult.value.isRejected) return 'El pago fue rechazado';
    return 'Hubo un problema con el pago';
});

const statusDetail = computed(() => {
    if (!paymentResult.value) return 'Por favor espera mientras verificamos tu pago...';

    if (paymentResult.value.isApproved) return 'Tu orden ha sido confirmada y está siendo procesada.';
    if (paymentResult.value.isPending) return 'Te notificaremos cuando el pago sea confirmado.';
    if (paymentResult.value.isRejected) return 'Puedes intentar realizar el pago nuevamente.';
    return 'Contacta con soporte si el problema persiste.';
});

// Methods - Implementación exacta según la guía
const startPaymentVerification = (orderId) => {
    console.log('🔄 PaymentReturn: Starting payment verification for order:', orderId);
    let attempts = 0;
    const maxAttempts = 20; // 1 minuto (20 x 3 segundos)

    const interval = setInterval(async () => {
        attempts++;
        console.log(`🔍 PaymentReturn: Verification attempt ${attempts}/${maxAttempts}`);

        try {
            const status = await checkPaymentStatus(orderId);

            if (status) {
                // Pago confirmado - según la guía: approved + pendiente
                if (status.paymentStatus === 'approved' && status.orderStatus === 'pendiente') {
                    clearInterval(interval);
                    localStorage.removeItem('pendingOrderId');
                    localStorage.removeItem('currentOrderId');

                    paymentStatus.value = status;
                    checkingPayment.value = false;

                    toast.add({
                        severity: 'success',
                        summary: 'Pago Exitoso',
                        detail: 'Tu pago ha sido procesado correctamente',
                        life: 5000
                    });
                    return;
                }

                // Pago rechazado - según la guía: rejected o pago_fallido
                if (status.paymentStatus === 'rejected' || status.orderStatus === 'pago_fallido') {
                    clearInterval(interval);
                    localStorage.removeItem('pendingOrderId');
                    localStorage.removeItem('currentOrderId');

                    paymentStatus.value = status;
                    checkingPayment.value = false;

                    toast.add({
                        severity: 'error',
                        summary: 'Pago Rechazado',
                        detail: 'El pago fue rechazado por el procesador',
                        life: 5000
                    });
                    return;
                }

                // Pago pendiente - continuar verificando
                if (status.paymentStatus === 'pending') {
                    paymentStatus.value = status;
                    console.log('💳 PaymentReturn: Payment still pending, continuing verification...');
                }
            }

            // Timeout después de máximo intentos
            if (attempts >= maxAttempts) {
                clearInterval(interval);
                checkingPayment.value = false;

                toast.add({
                    severity: 'warn',
                    summary: 'Verificación en progreso',
                    detail: 'La verificación continúa en segundo plano. Te notificaremos cuando esté listo.',
                    life: 8000
                });
            }
        } catch (error) {
            console.error('PaymentReturn: Error in verification:', error);

            // Si hay demasiados errores, detener
            if (attempts >= 5) {
                clearInterval(interval);
                checkingPayment.value = false;

                toast.add({
                    severity: 'error',
                    summary: 'Error de verificación',
                    detail: 'No se pudo verificar el estado del pago. Contacta con soporte.',
                    life: 8000
                });
            }
        }
    }, 3000); // Verificar cada 3 segundos según la guía
};

const checkPaymentStatus = async (orderId) => {
    try {
        console.log('🔍 PaymentReturn: Checking payment status for order:', orderId);

        // Usar el endpoint exacto de la guía: /api/payment-status/{orderId}
        const response = await ordersStore.checkPaymentStatus(orderId);

        if (response.success) {
            const statusData = response.data || ordersStore.paymentStatus;
            console.log('💳 PaymentReturn: Payment status response:', statusData);

            // Estructura según la guía del backend
            return {
                orderStatus: statusData.order_status,
                paymentStatus: statusData.payment_status,
                hasPayment: statusData.has_payment,
                paymentMethod: statusData.payment_method,
                externalId: statusData.external_id,
                paymentCode: statusData.payment_code,
                createdAt: statusData.created_at,
                updatedAt: statusData.updated_at
            };
        }

        return null;
    } catch (error) {
        console.error('PaymentReturn: Error checking payment status:', error);
        throw error;
    }
};

const loadOrderDetails = async (orderId) => {
    try {
        const orderResult = await ordersStore.fetchOrderById(orderId);
        if (orderResult.success) {
            order.value = ordersStore.getCurrentOrder;
            console.log('📋 PaymentReturn: Order loaded:', order.value);
        }
    } catch (error) {
        console.error('PaymentReturn: Error loading order:', error);
    }
};

const goToOrders = () => {
    router.push('/orders');
};

const goToHome = () => {
    router.push('/');
};

const retryPayment = () => {
    if (order.value && ordersStore.canPayOrder(order.value)) {
        router.push('/orders');
    }
};

// Lifecycle - Implementación según la guía
onMounted(async () => {
    console.log('🚀 PaymentReturn: Component mounted');

    if (!orderId) {
        console.error('PaymentReturn: No order ID found');
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo identificar la orden',
            life: 5000
        });
        router.push('/orders');
        return;
    }

    console.log('📋 PaymentReturn: Processing order:', orderId);

    // Step 1: Load order details
    await loadOrderDetails(orderId);

    // Step 2: Start payment verification with polling (según la guía)
    startPaymentVerification(orderId);

    // Step 3: Refresh orders list for navigation
    await ordersStore.fetchOrders();

    // Initial loading complete
    loading.value = false;
});

onBeforeUnmount(() => {
    ordersStore.stopPaymentPolling();
});
</script>

<template>
    <div class="payment-return-container min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div class="max-w-2xl w-full">
            <!-- Main Card -->
            <div class="bg-white rounded-lg shadow-lg p-6 sm:p-8 text-center">
                <!-- Status Icon -->
                <div class="mb-6">
                    <i :class="[statusIcon, statusColor, 'text-6xl']"></i>
                </div>

                <!-- Status Message -->
                <h1 class="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
                    {{ statusMessage }}
                </h1>

                <p class="text-gray-600 text-lg mb-6">
                    {{ statusDetail }}
                </p>

                <!-- Order Information -->
                <div v-if="order" class="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                    <h3 class="font-semibold text-gray-800 mb-3">Información de la orden</h3>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-600">Número de orden:</span>
                            <span class="font-medium">#{{ order.id }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Total:</span>
                            <span class="font-medium">S/ {{ parseFloat(order.total || 0).toFixed(2) }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Estado:</span>
                            <Tag :value="ordersStore.getOrderStatusLabel(order.status)" :severity="ordersStore.getOrderStatusSeverity(order.status)" />
                        </div>
                    </div>
                </div>

                <!-- Payment Details - Estructura según la guía del backend -->
                <div v-if="payment_id || paymentStatus" class="bg-blue-50 rounded-lg p-4 mb-6 text-left">
                    <h3 class="font-semibold text-blue-800 mb-3">Detalles del pago</h3>
                    <div class="space-y-2 text-sm">
                        <!-- IDs de MercadoPago (URL parameters) -->
                        <div v-if="payment_id" class="flex justify-between">
                            <span class="text-blue-600">ID de pago:</span>
                            <span class="font-medium text-blue-800">{{ payment_id }}</span>
                        </div>
                        <div v-if="collection_id" class="flex justify-between">
                            <span class="text-blue-600">ID de cobro:</span>
                            <span class="font-medium text-blue-800">{{ collection_id }}</span>
                        </div>
                        <div v-if="payment_type" class="flex justify-between">
                            <span class="text-blue-600">Tipo de pago:</span>
                            <span class="font-medium text-blue-800">{{ payment_type }}</span>
                        </div>

                        <!-- Datos del backend (estructura de la guía) -->
                        <div v-if="paymentStatus?.paymentMethod" class="flex justify-between">
                            <span class="text-blue-600">Método de pago:</span>
                            <span class="font-medium text-blue-800">{{ paymentStatus.paymentMethod }}</span>
                        </div>
                        <div v-if="paymentStatus?.paymentCode" class="flex justify-between">
                            <span class="text-blue-600">Código de pago:</span>
                            <span class="font-medium text-blue-800">{{ paymentStatus.paymentCode }}</span>
                        </div>
                        <div v-if="paymentStatus?.externalId" class="flex justify-between">
                            <span class="text-blue-600">ID externo:</span>
                            <span class="font-medium text-blue-800">{{ paymentStatus.externalId }}</span>
                        </div>
                        <div v-if="paymentStatus?.updatedAt" class="flex justify-between">
                            <span class="text-blue-600">Última actualización:</span>
                            <span class="font-medium text-blue-800">{{ new Date(paymentStatus.updatedAt).toLocaleString() }}</span>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Button label="Ver mis órdenes" icon="pi pi-list" class="flex-1 bg-blue-600 border-blue-600 hover:bg-blue-700" @click="goToOrders" />

                    <Button v-if="paymentResult?.isFailed && order && ordersStore.canPayOrder(order)" label="Reintentar pago" icon="pi pi-refresh" class="flex-1 bg-orange-600 border-orange-600 hover:bg-orange-700" @click="retryPayment" />

                    <Button label="Continuar comprando" icon="pi pi-shopping-cart" class="flex-1 p-button-outlined" @click="goToHome" />
                </div>
            </div>

            <!-- Additional Information -->
            <div class="mt-6 text-center text-sm text-gray-500">
                <p>¿Tienes alguna pregunta sobre tu pedido?</p>
                <p>Contacta nuestro soporte al <strong>soporte@mastercolor.com</strong></p>
            </div>
        </div>

        <!-- Toast notifications -->
        <Toast position="top-right" />
    </div>
</template>

<style scoped>
.payment-return-container {
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

/* Loading animation */
.pi-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

/* Responsive adjustments */
@media (max-width: 640px) {
    .payment-return-container {
        padding: 1rem;
    }
}
</style>
